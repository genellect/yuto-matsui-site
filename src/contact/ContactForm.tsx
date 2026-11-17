"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { ContactEntrance } from "./ContactEntrance";
import { contactCopy as copy } from "./copy";
import {
  CONTACT_ENDPOINT,
  CONTACT_TURNSTILE_ACTION,
  contactLimits,
  contactTopics,
  describeContactField,
  describeContactTopic,
  validateContactFields,
  type ContactFieldErrors,
  type ContactFieldName,
  type ContactFields,
  type ContactTopic
} from "./schema";
import styles from "./contact.module.css";
import sheet from "./contact-sheet.module.css";

type SubmissionState = "idle" | "submitting" | "success";
type Notice = "" | "failure" | "rateLimited" | "turnstile" | "turnstilePending" | "validation";
type Receipt = ContactFields & { topic: ContactTopic };

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

const initialForm: ContactFields = { name: "", affiliation: "", email: "", details: "" };
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
  const [entryComplete, setEntryComplete] = useState(false);
  const [topic, setTopic] = useState<ContactTopic | "">("");
  const [form, setForm] = useState<ContactFields>(initialForm);
  const [touched, setTouched] = useState<Partial<Record<ContactFieldName, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<SubmissionState>("idle");
  const [notice, setNotice] = useState<Notice>("");
  const [failures, setFailures] = useState(0);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileUnavailable, setTurnstileUnavailable] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetRef = useRef<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const finishEntry = useCallback(() => {
    // Move focus only when the visitor acted inside the entrance (Skip). When the film
    // ends on its own, focus stays where it was, as it did when the page opened.
    const active = document.activeElement;
    const focusForm = active instanceof HTMLElement && Boolean(active.closest("[data-contact-entrance]"));
    setEntryComplete(true);
    requestAnimationFrame(() => {
      if (!focusForm) return;
      document.getElementById("form-title")?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }, []);

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
    if (!entryComplete || turnstileToken || turnstileUnavailable || status !== "idle") return;
    const deadline = window.setTimeout(() => setTurnstileUnavailable(true), TURNSTILE_WAIT_MS);
    return () => window.clearTimeout(deadline);
  }, [entryComplete, turnstileToken, turnstileUnavailable, status]);

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

  const updateField = (field: ContactFieldName, value: string) => {
    if (status !== "idle") return;
    setForm((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => ({ ...current, [field]: undefined }));
    if (notice === "validation") setNotice("");
  };

  const markTouched = (field: ContactFieldName) => setTouched((current) => ({ ...current, [field]: true }));

  const fieldError = (field: ContactFieldName) => {
    if (!attempted && !touched[field]) return undefined;
    return describeContactField(field, form[field]) ?? serverErrors[field];
  };
  const topicError = attempted ? describeContactTopic(topic) ?? serverErrors.topic : undefined;
  const describedBy = (field: ContactFieldName, helperId?: string) => (
    [helperId, fieldError(field) ? `${field}-error` : undefined].filter(Boolean).join(" ") || undefined
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status !== "idle") return;
    setAttempted(true);
    const parsed = validateContactFields(form);
    const topicProblem = describeContactTopic(topic);
    if (!parsed.ok || topicProblem || !topic) {
      // Take the visitor straight to the first thing to fix.
      const first = topicProblem ? "topic-work" : (["name", "email", "affiliation", "details"] as const).find((field) => !parsed.ok && parsed.fieldErrors[field]);
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
          ...parsed.data,
          requestId: crypto.randomUUID(),
          turnstileToken,
          website: honeypotRef.current?.value ?? ""
        })
      });
      const result = await readResult(response);
      if (response.ok && result.ok === true) {
        setReceipt({ topic, ...parsed.data });
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
      <section className={`${styles.contactSurface} ${styles.successCard}`} aria-labelledby="success-title">
        <div className={styles.successIcon} aria-hidden="true">✓</div>
        <h1 id="success-title" ref={successHeadingRef} tabIndex={-1}>{copy.successTitle}</h1>
        <p>{copy.successBefore}<span>{receipt.email}</span>{copy.successAfter}</p>
        <section className={sheet.receipt} aria-labelledby="receipt-title">
          <h2 id="receipt-title">{copy.receiptTitle}</h2>
          <dl>
            <div><dt>{copy.receiptTopic}</dt><dd>{contactTopics[receipt.topic]}</dd></div>
            <div><dt>{copy.receiptName}</dt><dd>{receipt.name}</dd></div>
            <div><dt>{copy.receiptEmail}</dt><dd>{receipt.email}</dd></div>
            {receipt.affiliation ? <div><dt>{copy.receiptAffiliation}</dt><dd>{receipt.affiliation}</dd></div> : null}
            <div><dt>{copy.receiptMessage}</dt><dd className={sheet.receiptMessage}>{receipt.details}</dd></div>
          </dl>
        </section>
        <a className={sheet.homeLink} href="/">{copy.home}</a>
      </section>
    );
  }

  const showEmailFallback = turnstileUnavailable && !turnstileToken;
  const noticeText = showEmailFallback ? copy.turnstileUnavailable : notice ? copy[notice] : "";
  const remaining = contactLimits.details.max - form.details.length;

  const textField = (field: "name" | "email" | "affiliation", label: string, props: React.InputHTMLAttributes<HTMLInputElement>, optional = false) => {
    const error = fieldError(field);
    return (
      <div className={`${sheet.field} ${field === "affiliation" ? sheet.wide : ""}`}>
        <label htmlFor={field}>{label}{optional ? <span className={sheet.optional}>（{copy.optional}）</span> : null}</label>
        <input id={field} name={field} value={form[field]} maxLength={contactLimits[field].max} aria-invalid={Boolean(error)} aria-describedby={describedBy(field)} onBlur={() => markTouched(field)} onChange={(event) => updateField(field, event.target.value)} {...props} />
        {error ? <p className={sheet.error} id={`${field}-error`}>{error}</p> : null}
      </div>
    );
  };

  const detailsError = fieldError("details");

  return (
    <section className={styles.contactSurface} aria-labelledby="form-title" data-entry-complete={entryComplete}>
      <form id="contact-form" noValidate aria-busy={status !== "idle"} onSubmit={handleSubmit}>
        <div className={styles.introStage}>
          <div className={styles.formHeading}>
            <h1 id="form-title" tabIndex={-1}>{copy.title}</h1>
          </div>
          {!entryComplete ? <ContactEntrance onComplete={finishEntry} /> : null}
        </div>

        <div className={sheet.flow} id="contact-flow" hidden={!entryComplete}>
          <div className={sheet.sheet}>
            <fieldset className={sheet.topics} aria-describedby={topicError ? "topic-error" : undefined}>
              <legend>{copy.topicLegend}</legend>
              <div className={sheet.segments}>
                {topicEntries.map(([value, label]) => (
                  <label key={value} className={sheet.segment} data-checked={topic === value}>
                    <input id={`topic-${value}`} type="radio" name="topic" value={value} checked={topic === value} aria-invalid={Boolean(topicError)} onChange={() => { if (status === "idle") { setTopic(value); setServerErrors((current) => ({ ...current, topic: undefined })); } }} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {topicError ? <p className={sheet.error} id="topic-error">{topicError}</p> : null}
            </fieldset>

            <div className={sheet.grid}>
              {textField("name", copy.name, { type: "text", autoComplete: "name", required: true })}
              {textField("email", copy.email, { type: "email", autoComplete: "email", inputMode: "email", required: true })}
              {textField("affiliation", copy.affiliation, { type: "text", autoComplete: "organization" }, true)}
            </div>

            <div className={`${sheet.field} ${sheet.message}`}>
              <label htmlFor="details">{copy.message}</label>
              <p className={sheet.hint} id="details-hint" aria-live="polite">{topic ? copy.topicHints[topic] : null}</p>
              <textarea id="details" name="details" rows={9} maxLength={contactLimits.details.max} required value={form.details} aria-invalid={Boolean(detailsError)} aria-describedby={describedBy("details", "details-hint")} onBlur={() => markTouched("details")} onChange={(event) => updateField("details", event.target.value)} />
              <div className={sheet.messageMeta}>
                {detailsError ? <p className={sheet.error} id="details-error">{detailsError}</p> : <span />}
                {form.details.length >= COUNTER_FROM ? <span className={sheet.counter}>残り{remaining}文字</span> : null}
              </div>
            </div>

            <div className={sheet.verify} ref={turnstileContainerRef} />

            {noticeText ? (
              <div className={sheet.notice} role="alert">
                <p>{noticeText}</p>
                {showEmailFallback || (failures >= 2 && (notice === "failure" || notice === "rateLimited")) ? (
                  <p>{copy.fallbackBefore}<a href="/#contact-cta" target="_blank" rel="noopener">{copy.fallbackLink}</a>{copy.fallbackAfter}</p>
                ) : null}
              </div>
            ) : null}

            <div className={sheet.footer}>
              <p className={sheet.note}>{copy.handlingNote}</p>
              <button className={sheet.submit} type="submit" disabled={status === "submitting"}>
                {status === "submitting" ? copy.submitting : copy.submit}
              </button>
            </div>
          </div>

          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor="website">ウェブサイト</label>
            <input ref={honeypotRef} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          {entryComplete ? (
            <Script
              id="cloudflare-turnstile-contact"
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              strategy="afterInteractive"
              onReady={() => setTurnstileReady(true)}
              onError={showTurnstileFallback}
            />
          ) : null}
        </div>
      </form>
    </section>
  );
}
