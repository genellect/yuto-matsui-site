import {
  CONTACT_MAX_BODY_BYTES,
  CONTACT_TURNSTILE_ACTION,
  parseContactRequest,
  affiliationLabels,
  contactTopics,
  detailsLabels,
  type ContactRequest
} from "../../src/contact/schema.ts";

// The only Pages Function in this site (see public/_routes.json). It validates one
// message, records it in the inquiry history (D1, binding CONTACT_DB) and only then
// reports success. The e-mail notification to the fixed, verified inbox follows, and
// its outcome is written back to the same row, so a failed notification never loses
// the message. See docs/contact/inquiry-history.md.

const TURNSTILE_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TIMEOUT_MS = 8_000;
const DELIVERY_TIMEOUT_MS = 10_000;
/** Fixed prefix plus the chosen topic label; visitor-typed text never reaches the subject. */
export const notificationSubject = (topic: ContactRequest["topic"]) => `[yuto-matsui.com] ${contactTopics[topic]}`;

/** The part of the D1 binding this Function uses. */
export type ContactDatabase = {
  prepare(query: string): { bind(...values: unknown[]): { run(): Promise<{ meta?: { changes?: number } }> } };
};

export type ContactEnv = {
  CONTACT_DB?: ContactDatabase;
  CONTACT_MODE?: string;
  CONTACT_ALLOWED_HOST?: string;
  CONTACT_ACCOUNT_ID?: string;
  CONTACT_FROM?: string;
  CONTACT_TO?: string;
  CONTACT_EMAIL_API_TOKEN?: string;
  CONTACT_TURNSTILE_SECRET_KEY?: string;
};

type PagesContext = { env: ContactEnv; request: Request; waitUntil?: (promise: Promise<unknown>) => void };

type Config =
  | { mode: "mock"; turnstileSecret: string; db: ContactDatabase }
  | {
    mode: "send";
    db: ContactDatabase;
    allowedHost: string;
    accountId: string;
    from: string;
    to: string;
    apiToken: string;
    turnstileSecret: string;
  };

type Failure = { code: string; status: number; detail?: string };

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

const addressPattern = /^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;
const hostPattern = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

function respond(body: Record<string, unknown>, status: number, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...extra } });
}

/** Operational log without names, addresses, message text, IPs or tokens. */
function log(outcome: string, status: number, startedAt: number, detail?: string, id?: string) {
  const entry: Record<string, unknown> = { event: "contact", outcome, status, ms: Date.now() - startedAt };
  if (detail) entry.detail = detail;
  if (id) entry.id = id;
  console.log(JSON.stringify(entry));
}

export function readConfig(env: ContactEnv): Config | undefined {
  const turnstileSecret = env.CONTACT_TURNSTILE_SECRET_KEY?.trim();
  const db = env.CONTACT_DB;
  // Without the history there is nothing to confirm, so both modes refuse to accept.
  if (!turnstileSecret || typeof db?.prepare !== "function") return undefined;
  if (env.CONTACT_MODE === "mock") return { mode: "mock", turnstileSecret, db };
  if (env.CONTACT_MODE !== "send") return undefined;
  const allowedHost = env.CONTACT_ALLOWED_HOST?.trim().toLowerCase() ?? "";
  const accountId = env.CONTACT_ACCOUNT_ID?.trim() ?? "";
  const from = env.CONTACT_FROM?.trim() ?? "";
  const to = env.CONTACT_TO?.trim() ?? "";
  const apiToken = env.CONTACT_EMAIL_API_TOKEN?.trim() ?? "";
  if (
    !hostPattern.test(allowedHost) ||
    !/^[0-9a-f]{32}$/.test(accountId) ||
    !addressPattern.test(from) ||
    !addressPattern.test(to) ||
    apiToken.length < 20
  ) return undefined;
  return { mode: "send", db, allowedHost, accountId, from, to, apiToken, turnstileSecret };
}

function acceptsOrigin(request: Request, config: Config) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (config.mode === "mock") return origin === url.origin;
  // Production also answers on the pages.dev alias, which zone rules do not protect.
  return url.protocol === "https:" && url.hostname === config.allowedHost && origin === `https://${config.allowedHost}`;
}

async function verifyTurnstile(request: Request, config: Config, payload: ContactRequest): Promise<Failure | undefined> {
  const form = new FormData();
  form.set("secret", config.turnstileSecret);
  form.set("response", payload.turnstileToken);
  form.set("idempotency_key", payload.requestId);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) form.set("remoteip", remoteIp);
  let result: { success?: unknown; hostname?: unknown; action?: unknown };
  try {
    const response = await fetch(TURNSTILE_ENDPOINT, { method: "POST", body: form, signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS) });
    if (!response.ok) return { code: "turnstile", status: 422, detail: `siteverify_${response.status}` };
    result = await response.json();
  } catch {
    return { code: "turnstile", status: 422, detail: "siteverify_unavailable" };
  }
  if (result.success !== true) return { code: "turnstile", status: 422, detail: "rejected" };
  // Test keys used by Preview do not report the real hostname or action.
  if (config.mode === "send" && (result.hostname !== config.allowedHost || result.action !== CONTACT_TURNSTILE_ACTION)) {
    return { code: "turnstile", status: 422, detail: "context_mismatch" };
  }
  return undefined;
}

export function formatReceivedAt(date: Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}/${part("month")}/${part("day")} ${part("hour")}:${part("minute")} (JST)`;
}

export function notificationText(payload: ContactRequest, receivedAt: Date) {
  return [
    "yuto-matsui.com のContactからメッセージが届きました。",
    "",
    `受信日時: ${formatReceivedAt(receivedAt)}`,
    `種類: ${contactTopics[payload.topic]}`,
    `${affiliationLabels[payload.topic]}: ${payload.affiliation}`,
    ...(payload.topic === "student" ? [`学年: ${payload.grade}`] : []),
    `お名前: ${payload.name}`,
    `メールアドレス: ${payload.email}`,
    "",
    `${detailsLabels[payload.topic]}:`,
    payload.details,
    "",
    "このメールに返信すると、送信者のメールアドレス宛に届きます。"
  ].join("\n");
}

type Disposition = "accepted" | "spam";
type NotifyStatus = "pending" | "sent" | "failed" | "skipped";

const INSERT_INQUIRY = `INSERT INTO inquiries
  (id, received_at, topic, grade, affiliation, name, email, details, disposition, notify_status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO NOTHING`;
const RECORD_NOTIFICATION = "UPDATE inquiries SET notify_status = ?, notify_detail = ?, notified_at = ? WHERE id = ?";

/** Writes the inquiry. Returns false when the same requestId was already recorded. */
async function recordInquiry(db: ContactDatabase, payload: ContactRequest, receivedAt: Date, disposition: Disposition, notifyStatus: NotifyStatus) {
  const result = await db.prepare(INSERT_INQUIRY).bind(
    payload.requestId,
    receivedAt.toISOString(),
    payload.topic,
    payload.grade,
    payload.affiliation,
    payload.name,
    payload.email,
    payload.details,
    disposition,
    notifyStatus
  ).run();
  return result.meta?.changes !== 0;
}

async function deliver(config: Extract<Config, { mode: "send" }>, payload: ContactRequest, receivedAt: Date): Promise<Failure | undefined> {
  let response: Response;
  try {
    response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/email/sending/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        reply_to: payload.email,
        subject: notificationSubject(payload.topic),
        text: notificationText(payload, receivedAt)
      }),
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS)
    });
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    return { code: "delivery", status: 502, detail: timeout ? "timeout" : "unreachable" };
  }
  let body: {
    success?: unknown;
    errors?: Array<{ code?: unknown }>;
    result?: { delivered?: unknown; queued?: unknown; permanent_bounces?: unknown; suppressed_recipients?: unknown } | null;
  };
  try {
    body = await response.json();
  } catch {
    return { code: "delivery", status: 502, detail: `http_${response.status}_invalid_json` };
  }
  if (!response.ok || body.success !== true || !body.result) {
    const codes = Array.isArray(body.errors)
      ? body.errors.map((error) => (typeof error?.code === "number" ? error.code : "?")).join(",")
      : "";
    return { code: "delivery", status: 502, detail: `http_${response.status}${codes ? `_errors_${codes}` : ""}` };
  }
  const includes = (list: unknown) => Array.isArray(list) && list.some((item) => typeof item === "string" && item.toLowerCase() === config.to.toLowerCase());
  if (includes(body.result.permanent_bounces) || includes(body.result.suppressed_recipients)) {
    return { code: "delivery", status: 502, detail: "recipient_rejected" };
  }
  if (!includes(body.result.delivered) && !includes(body.result.queued)) {
    return { code: "delivery", status: 502, detail: "recipient_not_accepted" };
  }
  return undefined;
}

/** Sends the notification and writes its outcome to the inquiry row. Never throws. */
async function notifyAndRecord(config: Extract<Config, { mode: "send" }>, payload: ContactRequest, receivedAt: Date, startedAt: number) {
  const failure = await deliver(config, payload, receivedAt);
  const status: NotifyStatus = failure ? "failed" : "sent";
  try {
    await config.db.prepare(RECORD_NOTIFICATION).bind(status, failure?.detail ?? null, new Date().toISOString(), payload.requestId).run();
  } catch {
    log("notify_record_failed", 200, startedAt, status, payload.requestId);
    return;
  }
  log(failure ? "notify_failed" : "notify_sent", 200, startedAt, failure?.detail, payload.requestId);
}

export async function onRequest({ request, env, waitUntil }: PagesContext): Promise<Response> {
  const startedAt = Date.now();
  const fail = ({ code, status, detail }: Failure, extra: Record<string, unknown> = {}) => {
    log(code, status, startedAt, detail);
    return respond({ ok: false, code, ...extra }, status);
  };

  if (request.method !== "POST") {
    log("method", 405, startedAt);
    return new Response(null, { status: 405, headers: { ...jsonHeaders, Allow: "POST" } });
  }
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return fail({ code: "content_type", status: 415 });
  }

  const config = readConfig(env);
  if (!config) return fail({ code: "configuration", status: 503 });
  if (!acceptsOrigin(request, config)) return fail({ code: "origin", status: 403 });

  const declaredLength = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > CONTACT_MAX_BODY_BYTES) {
    return fail({ code: "body_too_large", status: 413 });
  }
  let bodyText = "";
  const reader = request.body?.getReader();
  try {
    if (reader) {
      const decoder = new TextDecoder();
      let bytesRead = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.byteLength;
        if (bytesRead > CONTACT_MAX_BODY_BYTES) {
          // Stop consuming the body without waiting for upstream cancellation.
          void reader.cancel().catch(() => {});
          return fail({ code: "body_too_large", status: 413 });
        }
        bodyText += decoder.decode(value, { stream: true });
      }
      bodyText += decoder.decode();
    }
  } catch {
    return fail({ code: "body", status: 400 });
  } finally {
    reader?.releaseLock();
  }

  let raw: unknown;
  try {
    raw = JSON.parse(bodyText);
  } catch {
    return fail({ code: "json", status: 400 });
  }
  const parsed = parseContactRequest(raw);
  if (!parsed.ok) return fail({ code: "validation", status: 422 }, { fieldErrors: parsed.fieldErrors });

  const turnstileFailure = await verifyTurnstile(request, config, parsed.data);
  if (turnstileFailure) return fail(turnstileFailure);

  const payload = parsed.data;
  const id = payload.requestId;
  const receivedAt = new Date();
  // A filled honeypot is kept, marked as spam, so a person caught by autofill is not lost.
  const disposition: Disposition = payload.website !== "" ? "spam" : "accepted";
  const notifies = config.mode === "send" && disposition === "accepted";
  let inserted: boolean;
  try {
    inserted = await recordInquiry(config.db, payload, receivedAt, disposition, notifies ? "pending" : "skipped");
  } catch {
    log("storage", 503, startedAt, "insert_failed", id);
    return respond({ ok: false, code: "storage" }, 503);
  }
  if (!inserted) {
    // The same submission arrived again: it is already in the history and was notified once.
    log("duplicate", 200, startedAt, undefined, id);
    return respond({ ok: true }, 200);
  }
  log(disposition === "spam" ? "stored_spam" : "stored", 200, startedAt, config.mode === "mock" ? "mock" : undefined, id);

  if (notifies && config.mode === "send") {
    const task = notifyAndRecord(config, payload, receivedAt, startedAt);
    if (waitUntil) waitUntil(task);
    else await task;
  }
  return respond({ ok: true }, 200);
}
