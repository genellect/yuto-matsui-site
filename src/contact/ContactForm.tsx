"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONTACT_RETURN_TO_ENTRANCE } from "./contact-entry-events";
import { ContactEntrance } from "./ContactEntrance";
import { contactCopy as copy } from "./copy";
import {
  CONTACT_ENDPOINT,
  CONTACT_FORM_ERROR_MESSAGE,
  CONTACT_TURNSTILE_ACTION,
  contactLimits,
  normaliseContactField,
  validateContactFields,
  type ContactFieldErrors,
  type ContactFieldName,
  type ContactFields
} from "./schema";
import styles from "./contact.module.css";

type SubmissionState = "idle" | "submitting" | "success";
type Notice = "" | "failure" | "rateLimited" | "turnstile" | "validation";

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

// Preview builds use Cloudflare's public test key; production must provide its own.
const turnstileSiteKey = process.env.NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY?.trim() || "1x00000000000000000000AA";

function Badge({ optional = false }: { optional?: boolean }) {
  return <span className={optional ? `${styles.required} ${styles.optional}` : styles.required}>{optional ? copy.optional : copy.required}</span>;
}

function FieldError({ id, visible }: { id: string; visible: boolean }) {
  if (!visible) return null;
  return <p className={styles.fieldError} id={id} role="alert">{CONTACT_FORM_ERROR_MESSAGE}</p>;
}

function FieldValid({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span className={styles.fieldValid} aria-label={copy.valid}>
      <span aria-hidden="true">✓</span>
    </span>
  );
}

function AudiencePanel() {
  return (
    <section className={styles.audiencePanel} aria-labelledby="audience-title">
      <div className={styles.sectionHeading}>
        <p>{copy.audienceKicker}</p>
        <h2 id="audience-title">{copy.audienceTitle}</h2>
      </div>
      <div className={styles.audienceGrid}>
        {copy.audience.map((entry) => (
          <article className={styles.audienceCard} key={entry.audience}>
            <h3>{entry.audience}</h3>
            <p>{entry.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

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
  const [form, setForm] = useState<ContactFields>(initialForm);
  const [touched, setTouched] = useState<Partial<Record<ContactFieldName, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<SubmissionState>("idle");
  const [notice, setNotice] = useState<Notice>("");
  const [failures, setFailures] = useState(0);
  const [submittedEmail, setSubmittedEmail] = useState("");
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
    let focusFrame = 0;
    const returnToForm = (event: Event) => {
      // After a completed message, the ordinary link starts a fresh visit.
      if (status === "success") return;
      // Otherwise the header returns to the top of the form; the draft stays.
      event.preventDefault();
      setEntryComplete(true);
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => {
        document.getElementById("form-title")?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: "instant" });
      });
    };
    window.addEventListener(CONTACT_RETURN_TO_ENTRANCE, returnToForm);
    return () => {
      window.removeEventListener(CONTACT_RETURN_TO_ENTRANCE, returnToForm);
      cancelAnimationFrame(focusFrame);
    };
  }, [status]);

  useEffect(() => {
    if (status !== "success") return;
    successHeadingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [status]);

  const validation = useMemo(() => validateContactFields(form), [form]);
  const clientErrors: ContactFieldErrors = validation.ok ? {} : validation.fieldErrors;
  // Cleared server errors are stored as undefined; they must not hide a client error.
  const visibleErrors: ContactFieldErrors = { ...clientErrors };
  for (const [field, message] of Object.entries(serverErrors)) if (message) visibleErrors[field as ContactFieldName] = message;
  const canSubmit = validation.ok && Boolean(turnstileToken) && status === "idle";

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
        appearance: "always",
        language: "ja",
        size: "flexible",
        theme: "light",
        callback: (token: string) => {
          setTurnstileToken(token);
          setTurnstileUnavailable(false);
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

  const hasError = (field: ContactFieldName) => Boolean(visibleErrors[field] && (touched[field] || form[field].length > 0));
  const hasValidValue = (field: ContactFieldName) => (
    form[field].trim().length > 0 && normaliseContactField(field, form[field]) !== undefined && !visibleErrors[field]
  );
  const describedBy = (field: ContactFieldName, helperId?: string) => (
    [helperId, hasError(field) ? `${field}-error` : undefined].filter(Boolean).join(" ") || undefined
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status !== "idle") return;
    const parsed = validateContactFields(form);
    if (!parsed.ok) {
      setTouched({ name: true, affiliation: true, email: true, details: true });
      setNotice("validation");
      return;
    }
    if (!turnstileToken) {
      setNotice("turnstile");
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
          ...parsed.data,
          requestId: crypto.randomUUID(),
          turnstileToken,
          website: honeypotRef.current?.value ?? ""
        })
      });
      const result = await readResult(response);
      if (response.ok && result.ok === true) {
        setSubmittedEmail(parsed.data.email);
        setStatus("success");
        return;
      }
      if (response.status === 429) outcome = "rateLimited";
      else if (result.code === "turnstile") outcome = "turnstile";
      else if (result.code === "validation") {
        outcome = "validation";
        if (result.fieldErrors && typeof result.fieldErrors === "object") setServerErrors(result.fieldErrors as ContactFieldErrors);
        setTouched({ name: true, affiliation: true, email: true, details: true });
      }
    } catch {
      outcome = "failure";
    }
    setStatus("idle");
    setNotice(outcome);
    if (outcome === "failure" || outcome === "rateLimited") setFailures((count) => count + 1);
    resetTurnstile();
  };

  if (status === "success") {
    return (
      <section className={`${styles.contactSurface} ${styles.successCard}`} aria-labelledby="success-title">
        <div className={styles.successIcon} aria-hidden="true">✓</div>
        <p className={styles.formKicker}>{copy.successKicker}</p>
        <h1 id="success-title" ref={successHeadingRef} tabIndex={-1}>{copy.successTitle}</h1>
        <p>{copy.successBefore}<span>{submittedEmail}</span>{copy.successAfter}</p>
        <a className={styles.homeButton} href="/">{copy.home}</a>
      </section>
    );
  }

  const showEmailFallback = turnstileUnavailable && !turnstileToken;
  const noticeText = showEmailFallback
    ? copy.turnstileUnavailable
    : notice === "validation" ? CONTACT_FORM_ERROR_MESSAGE : notice ? copy[notice] : "";

  return (
    <section className={styles.contactSurface} aria-labelledby="form-title" data-entry-complete={entryComplete}>
      <form id="contact-form" noValidate aria-busy={status !== "idle"} onSubmit={handleSubmit}>
        <div className={styles.introStage}>
          <div className={styles.formHeading}>
            <p className={styles.formKicker}>{copy.kicker}</p>
            <h1 id="form-title" tabIndex={-1}>{copy.title}</h1>
            <p className={styles.formIntro}>{copy.intro}</p>
            <p>{copy.intro2}</p>
          </div>
          {!entryComplete ? <ContactEntrance onComplete={finishEntry} /> : null}
        </div>

        <div className={styles.revealedFlow} id="contact-flow" hidden={!entryComplete}>
          <AudiencePanel />

          <div className={styles.formColumns}>
            <section className={styles.formStage} aria-labelledby="identity-title">
              <div className={styles.sectionHeading}>
                <p>{copy.identityKicker}</p>
                <h2 id="identity-title">{copy.identityTitle}</h2>
              </div>
              <div className={styles.identityFields}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="name">{copy.name} <Badge /></label>
                  <div className={styles.inputWrap}>
                    <input id="name" name="name" type="text" autoComplete="name" minLength={contactLimits.name.min} maxLength={contactLimits.name.max} required value={form.name} aria-invalid={hasError("name")} aria-describedby={describedBy("name")} onBlur={() => markTouched("name")} onChange={(event) => updateField("name", event.target.value)} />
                    <FieldValid visible={hasValidValue("name")} />
                  </div>
                  <FieldError id="name-error" visible={hasError("name")} />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="affiliation">{copy.affiliation} <Badge optional /></label>
                  <div className={styles.inputWrap}>
                    <input id="affiliation" name="affiliation" type="text" autoComplete="organization" maxLength={contactLimits.affiliation.max} value={form.affiliation} aria-invalid={hasError("affiliation")} aria-describedby={describedBy("affiliation", "affiliation-helper")} onBlur={() => markTouched("affiliation")} onChange={(event) => updateField("affiliation", event.target.value)} />
                    <FieldValid visible={hasValidValue("affiliation")} />
                  </div>
                  <p className={styles.helper} id="affiliation-helper">{copy.affiliationHelper}</p>
                  <FieldError id="affiliation-error" visible={hasError("affiliation")} />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="email">{copy.email} <Badge /></label>
                  <div className={styles.inputWrap}>
                    <input id="email" name="email" type="email" autoComplete="email" inputMode="email" minLength={contactLimits.email.min} maxLength={contactLimits.email.max} required value={form.email} aria-invalid={hasError("email")} aria-describedby={describedBy("email")} onBlur={() => markTouched("email")} onChange={(event) => updateField("email", event.target.value)} />
                    <FieldValid visible={hasValidValue("email")} />
                  </div>
                  <FieldError id="email-error" visible={hasError("email")} />
                </div>
              </div>
            </section>

            <section className={`${styles.formStage} ${styles.messageStage}`} aria-labelledby="message-title">
              <div className={styles.sectionHeading}>
                <p>{copy.messageKicker}</p>
                <h2 id="message-title">{copy.messageTitle}</h2>
              </div>
              <p className={styles.helper} id="details-helper">{copy.messageHelper}</p>
              <label className={styles.srOnly} htmlFor="details">{copy.messageLabel}</label>
              <div className={`${styles.inputWrap} ${styles.textareaWrap}`}>
                <textarea id="details" name="details" rows={10} minLength={contactLimits.details.min} maxLength={contactLimits.details.max} required value={form.details} aria-invalid={hasError("details")} aria-describedby={describedBy("details", "details-helper")} onBlur={() => markTouched("details")} onChange={(event) => updateField("details", event.target.value)} />
                <FieldValid visible={hasValidValue("details")} />
              </div>
              <div className={styles.textareaMeta}>
                <FieldError id="details-error" visible={hasError("details")} />
                <span>{form.details.length} / {contactLimits.details.max}</span>
              </div>
            </section>
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

          <section className={styles.submitStage} aria-label={copy.submitLabel}>
            <p className={styles.handlingNote}>{copy.handlingNote}</p>
            <div className={styles.securityBox}><div ref={turnstileContainerRef} className={styles.turnstile} /></div>
            {noticeText ? (
              <div className={styles.statusError} role="alert">
                <p>{noticeText}</p>
                {showEmailFallback || (failures >= 2 && (notice === "failure" || notice === "rateLimited")) ? (
                  <p>{copy.fallbackBefore}<a href="/#contact-cta">{copy.fallbackLink}</a>{copy.fallbackAfter}</p>
                ) : null}
              </div>
            ) : null}
            <button className={styles.submitButton} type="submit" disabled={!canSubmit}>
              <span>{status === "submitting" ? copy.submitting : copy.submit}</span>
              <span aria-hidden="true">→</span>
            </button>
          </section>
        </div>
      </form>
    </section>
  );
}
