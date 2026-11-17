"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { contactCopy as copy } from "./copy";
import {
  CONTACT_ENDPOINT,
  CONTACT_TURNSTILE_ACTION,
  affiliationLabels,
  contactGrades,
  contactLimits,
  contactTopics,
  detailsLabels,
  describeContactField,
  describeContactGrade,
  describeContactTopic,
  validateContactFields,
  type ContactFieldErrors,
  type ContactFieldName,
  type ContactFields,
  type ContactTopic
} from "./schema";
import ui from "./contact.module.css";

type SubmissionState = "idle" | "submitting" | "success";
type Notice = "" | "failure" | "rateLimited" | "turnstile" | "turnstilePending" | "validation";
type Receipt = ContactFields & { topic: ContactTopic; grade: string };
type ErrorKey = ContactFieldName | "grade";

type TurnstileApi = {
  remove: (widgetId: string) => void;
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const initialForm = { name: "", email: "", details: "" };
type SharedField = keyof typeof initialForm;
const TURNSTILE_WAIT_MS = 15_000;
const COUNTER_FROM = contactLimits.details.max - 100;
const topicEntries = Object.entries(contactTopics) as [ContactTopic, string][];

// Preview builds use Cloudflare's public test key; production must provide its own.
const turnstileSiteKey = process.env.NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY?.trim() || "1x00000000000000000000AA";

/** Reads any response body defensively: WAF pages and gateways are not JSON. */
async function readResult(response: Response) {
  try {
    const parsed: unknown = JSON.parse(await response.text());
    return parsed && typeof parsed === "object" ? parsed as { ok?: unknown; code?: unknown; fieldErrors?: unknown } : {};
  } catch {
    return {};
  }
}

export function ContactForm() {
  // The form is complete from the start: the first choice is selected and its fields are shown.
  const [topic, setTopic] = useState<ContactTopic | "">("work");
  const [shared, setShared] = useState(initialForm);
  // Each choice keeps its own affiliation, so switching back restores what was typed.
  const [affiliations, setAffiliations] = useState<Record<ContactTopic, string>>({ work: "", student: "" });
  const [grade, setGrade] = useState("");
  const [touched, setTouched] = useState<Partial<Record<ErrorKey, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<SubmissionState>("idle");
  const [notice, setNotice] = useState<Notice>("");
  const [failures, setFailures] = useState(0);
  const form: ContactFields = { ...shared, affiliation: topic ? affiliations[topic] : "" };
  const gradeValue = topic === "student" ? grade : "";
  const dirty = Boolean(shared.name || shared.email || shared.details || affiliations.work || affiliations.student || grade);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileUnavailable, setTurnstileUnavailable] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetRef = useRef<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);


  // Leaving with an unsent draft asks first; the browser supplies the wording.
  useEffect(() => {
    if (!dirty || status === "success") return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty, status]);

  useEffect(() => {
    if (status !== "success") return;
    successHeadingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [status]);

  const showTurnstileFallback = useCallback(() => {
    setTurnstileToken("");
    setTurnstileUnavailable(true);
    return true;
  }, []);

  useEffect(() => {
    if (turnstileToken || turnstileUnavailable || status !== "idle") return;
    const deadline = window.setTimeout(() => setTurnstileUnavailable(true), TURNSTILE_WAIT_MS);
    return () => window.clearTimeout(deadline);
  }, [turnstileToken, turnstileUnavailable, status]);

  useEffect(() => {
    if (!turnstileReady || !turnstileContainerRef.current) return;
    const api = window.turnstile;
    if (!api) {
      showTurnstileFallback();
      return;
    }
    let widgetId: string;
    try {
      widgetId = api.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        action: CONTACT_TURNSTILE_ACTION,
        // Most visitors are verified silently; the widget appears only when it needs them.
        appearance: "interaction-only",
        language: "ja",
        size: "flexible",
        theme: "light",
        callback: (token: string) => {
          setTurnstileToken(token);
          setTurnstileUnavailable(false);
          setNotice((current) => (current === "turnstilePending" ? "" : current));
        },
        "error-callback": showTurnstileFallback,
        "timeout-callback": showTurnstileFallback,
        "expired-callback": () => setTurnstileToken("")
      });
    } catch {
      showTurnstileFallback();
      return;
    }
    turnstileWidgetRef.current = widgetId;
    return () => {
      api.remove(widgetId);
      turnstileWidgetRef.current = null;
    };
  }, [turnstileReady, showTurnstileFallback]);

  const resetTurnstile = () => {
    setTurnstileToken("");
    if (window.turnstile && turnstileWidgetRef.current) window.turnstile.reset(turnstileWidgetRef.current);
  };

  const clearProblem = (key: ErrorKey) => {
    setServerErrors((current) => ({ ...current, [key]: undefined }));
    if (notice === "validation") setNotice("");
  };

  const updateField = (field: ContactFieldName, value: string) => {
    if (status !== "idle") return;
    if (field === "affiliation") {
      if (topic) setAffiliations((current) => ({ ...current, [topic]: value }));
    } else {
      setShared((current) => ({ ...current, [field]: value }));
    }
    clearProblem(field);
  };

  const markTouched = (key: ErrorKey) => setTouched((current) => ({ ...current, [key]: true }));

  const fieldError = (key: ErrorKey) => {
    if (!attempted && !touched[key]) return undefined;
    if (key === "grade") return describeContactGrade(topic, gradeValue) ?? serverErrors.grade;
    return describeContactField(key, form[key], topic || undefined) ?? serverErrors[key];
  };
  const topicError = attempted ? describeContactTopic(topic) ?? serverErrors.topic : undefined;
  const describedBy = (key: ErrorKey) => (fieldError(key) ? `${key}-error` : undefined);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status !== "idle") return;
    setAttempted(true);
    const parsed = validateContactFields(form, topic || undefined);
    const topicProblem = describeContactTopic(topic);
    const gradeProblem = describeContactGrade(topic, gradeValue);
    if (!parsed.ok || topicProblem || gradeProblem || !topic) {
      // Take the visitor straight to the first thing to fix, in the order it appears.
      const first = topicProblem ? "topic-work" : (["affiliation", "grade", "name", "email", "details"] as const).find((key) => (
        key === "grade" ? Boolean(gradeProblem) : !parsed.ok && Boolean(parsed.fieldErrors[key])
      ));
      if (first) document.getElementById(first)?.focus();
      return;
    }
    if (!turnstileToken) {
      if (!turnstileUnavailable) setNotice("turnstilePending");
      return;
    }

    setStatus("submitting");
    setNotice("");
    setServerErrors({});
    let outcome: Notice = "failure";
    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          grade: gradeValue,
          ...parsed.data,
          requestId: crypto.randomUUID(),
          turnstileToken,
          website: honeypotRef.current?.value ?? ""
        })
      });
      const result = await readResult(response);
      if (response.ok && result.ok === true) {
        setReceipt({ topic, grade: gradeValue, ...parsed.data });
        setStatus("success");
        return;
      }
      if (response.status === 429) outcome = "rateLimited";
      else if (result.code === "turnstile") outcome = "turnstile";
      else if (result.code === "validation") {
        outcome = "validation";
        if (result.fieldErrors && typeof result.fieldErrors === "object") setServerErrors(result.fieldErrors as ContactFieldErrors);
      }
    } catch {
      outcome = "failure";
    }
    setStatus("idle");
    setNotice(outcome);
    if (outcome === "failure" || outcome === "rateLimited") setFailures((count) => count + 1);
    resetTurnstile();
  };

  if (status === "success" && receipt) {
    return (
      <section className={ui.result} aria-labelledby="success-title">
        <h1 id="success-title" className={ui.title} ref={successHeadingRef} tabIndex={-1}>{copy.successTitle}</h1>
        <p className={ui.lead}>{copy.successBefore}<span>{receipt.email}</span>{copy.successAfter}</p>
        <section className={ui.receipt} aria-labelledby="receipt-title">
          <h2 id="receipt-title">{copy.receiptTitle}</h2>
          <dl>
            <div><dt>{copy.receiptTopic}</dt><dd>{contactTopics[receipt.topic]}</dd></div>
            <div><dt>{affiliationLabels[receipt.topic]}</dt><dd>{receipt.affiliation}</dd></div>
            {receipt.topic === "student" ? <div><dt>{copy.receiptGrade}</dt><dd>{receipt.grade}</dd></div> : null}
            <div><dt>{copy.receiptName}</dt><dd>{receipt.name}</dd></div>
            <div><dt>{copy.receiptEmail}</dt><dd>{receipt.email}</dd></div>
            <div><dt>{detailsLabels[receipt.topic]}</dt><dd className={ui.receiptMessage}>{receipt.details}</dd></div>
          </dl>
        </section>
        <a className={ui.button} href="/">{copy.home}</a>
      </section>
    );
  }

  const showEmailFallback = turnstileUnavailable && !turnstileToken;
  const noticeText = showEmailFallback ? copy.turnstileUnavailable : notice ? copy[notice] : "";
  const remaining = contactLimits.details.max - form.details.length;

  const textField = (field: "name" | "email" | "affiliation", label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => {
    const error = fieldError(field);
    return (
      <div className={ui.field}>
        <label htmlFor={field}>{label}</label>
        <input id={field} name={field} value={form[field]} maxLength={contactLimits[field].max} required aria-invalid={Boolean(error)} aria-describedby={describedBy(field)} onBlur={() => markTouched(field)} onChange={(event) => updateField(field, event.target.value)} {...props} />
        {error ? <p className={ui.error} id={`${field}-error`}>{error}</p> : null}
      </div>
    );
  };

  const gradeError = fieldError("grade");
  const detailsError = fieldError("details");
  const affiliationField = topic ? textField("affiliation", affiliationLabels[topic], { type: "text", autoComplete: "organization" }) : null;
  const nameField = textField("name", copy.name, { type: "text", autoComplete: "name" });
  const emailField = textField("email", copy.email, { type: "email", autoComplete: "email", inputMode: "email" });

  return (
    <section aria-labelledby="form-title">
      <form id="contact-form" noValidate aria-busy={status !== "idle"} onSubmit={handleSubmit}>
        <h1 id="form-title" className={ui.title} tabIndex={-1}>{copy.title}</h1>

        <div className={ui.flow} id="contact-flow">
          {/* The two choices are the page's statement of what it is for; the fields follow the choice. */}
          <fieldset className={ui.choices} aria-describedby={topicError ? "topic-error" : undefined}>
            <legend className={ui.srOnly}>{copy.topicLegend}</legend>
            {topicEntries.map(([value, label]) => (
              <label key={value} className={ui.choice} data-checked={topic === value}>
                <input id={`topic-${value}`} type="radio" name="topic" value={value} checked={topic === value} aria-invalid={Boolean(topicError)} onChange={() => { if (status === "idle") { setTopic(value); clearProblem("affiliation"); setServerErrors((current) => ({ ...current, topic: undefined, grade: undefined })); } }} />
                <span>{label}</span>
              </label>
            ))}
            {topicError ? <p className={ui.error} id="topic-error">{topicError}</p> : null}
          </fieldset>

          <div className={ui.sheet}>
            {topic === "student" ? (
              <div className={ui.grid}>
                {affiliationField}
                <div className={ui.field}>
                  <label htmlFor="grade">{copy.grade}</label>
                  <select id="grade" name="grade" value={grade} required aria-invalid={Boolean(gradeError)} aria-describedby={describedBy("grade")} onBlur={() => markTouched("grade")} onChange={(event) => { if (status === "idle") { setGrade(event.target.value); clearProblem("grade"); } }}>
                    <option value="" disabled>{copy.gradePlaceholder}</option>
                    {contactGrades.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  {gradeError ? <p className={ui.error} id="grade-error">{gradeError}</p> : null}
                </div>
                {nameField}
                {emailField}
              </div>
            ) : (
              <div className={ui.grid}>
                {affiliationField}
                {nameField}
                <div className={ui.wide}>{emailField}</div>
              </div>
            )}

            <div className={ui.field}>
              <label htmlFor="details">{detailsLabels[topic || "work"]}</label>
              <textarea id="details" name="details" rows={6} maxLength={contactLimits.details.max} required value={form.details} aria-invalid={Boolean(detailsError)} aria-describedby={describedBy("details")} onBlur={() => markTouched("details")} onChange={(event) => updateField("details", event.target.value)} />
              {detailsError || form.details.length >= COUNTER_FROM ? (
                <div className={ui.meta}>
                  {detailsError ? <p className={ui.error} id="details-error">{detailsError}</p> : <span />}
                  {form.details.length >= COUNTER_FROM ? <span className={ui.counter}>残り{remaining}文字</span> : null}
                </div>
              ) : null}
            </div>

            <div className={ui.verify} ref={turnstileContainerRef} />

            {noticeText ? (
              <div className={ui.notice} role="alert">
                <p>{noticeText}</p>
                {showEmailFallback || (failures >= 2 && (notice === "failure" || notice === "rateLimited")) ? (
                  <p>{copy.fallbackBefore}<a href="/#contact-cta" target="_blank" rel="noopener">{copy.fallbackLink}</a>{copy.fallbackAfter}</p>
                ) : null}
              </div>
            ) : null}

            <div className={ui.actions}>
              <button className={ui.button} type="submit" disabled={status === "submitting"}>
                {status === "submitting" ? copy.submitting : copy.submit}
              </button>
            </div>
          </div>

          <div className={ui.honeypot} aria-hidden="true">
            <label htmlFor="website">ウェブサイト</label>
            <input ref={honeypotRef} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <Script
            id="cloudflare-turnstile-contact"
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onReady={() => setTurnstileReady(true)}
            onError={showTurnstileFallback}
          />
        </div>
      </form>
    </section>
  );
}
