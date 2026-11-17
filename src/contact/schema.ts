// Shared by the Contact form and functions/api/contact.ts. Keep this file free of
// browser- or Workers-only APIs so both runtimes validate with identical rules.

export const CONTACT_ENDPOINT = "/api/contact";
export const CONTACT_TURNSTILE_ACTION = "personal_contact";
export const CONTACT_FORM_ERROR_MESSAGE = "入力内容を確認してください";
export const CONTACT_MAX_BODY_BYTES = 16 * 1024;

// Limits only guard against abuse; they should never refuse an ordinary message.
export const contactLimits = {
  name: { min: 1, max: 50 },
  affiliation: { min: 0, max: 50 },
  email: { min: 3, max: 254 },
  details: { min: 1, max: 1000 }
} as const;

/** What the visitor is writing about. The label also becomes the notification subject. */
export const contactTopics = {
  work: "お仕事のご相談",
  media: "取材・講演",
  student: "学生の方"
} as const;

export type ContactTopic = keyof typeof contactTopics;
export type ContactFieldName = keyof typeof contactLimits;
export type ContactFields = Record<ContactFieldName, string>;
export type ContactFieldErrors = Partial<Record<ContactFieldName | "topic", string>>;

export type ContactRequest = ContactFields & {
  topic: ContactTopic;
  requestId: string;
  turnstileToken: string;
  website: string;
};

// Single-line fields never carry control characters, line separators or bidi controls.
const singleLineForbidden = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/;
// The message may contain line breaks and tabs, nothing else from the control ranges.
const messageForbidden = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/;
const emailPattern = /^(?!\.)(?!.*\.\.)[A-Za-z0-9_'+\-.]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const emptyMessages: Record<ContactFieldName, string> = {
  name: "お名前を入力してください",
  affiliation: "",
  email: "メールアドレスを入力してください",
  details: "メッセージを入力してください"
};

function clean(field: ContactFieldName, raw: string) {
  return field === "details" ? raw.replace(/\r\n?/g, "\n").trim() : raw.trim();
}

/** The specific problem with one field, in words the visitor can act on, or undefined. */
export function describeContactField(field: ContactFieldName, raw: string): string | undefined {
  const value = clean(field, raw);
  const { min, max } = contactLimits[field];
  if (value.length < Math.max(min, 1)) return field === "affiliation" ? undefined : emptyMessages[field];
  if ((field === "details" ? messageForbidden : singleLineForbidden).test(value)) return "使用できない文字が含まれています";
  if (field === "email") return value.length > max || !emailPattern.test(value) ? "メールアドレスの形式を確認してください" : undefined;
  if (value.length > max) return `${max}文字以内で入力してください`;
  return undefined;
}

export function describeContactTopic(topic: string): string | undefined {
  return Object.hasOwn(contactTopics, topic) ? undefined : "ご用件を選んでください";
}

/** Normalises one field exactly as the server will, or returns undefined when invalid. */
export function normaliseContactField(field: ContactFieldName, raw: string): string | undefined {
  if (describeContactField(field, raw)) return undefined;
  const value = clean(field, raw);
  return field === "email" ? value.toLowerCase() : value;
}

export function validateContactFields(form: ContactFields) {
  const data = {} as ContactFields;
  const fieldErrors: ContactFieldErrors = {};
  for (const field of Object.keys(contactLimits) as ContactFieldName[]) {
    const problem = describeContactField(field, form[field]);
    if (problem) fieldErrors[field] = problem;
    else data[field] = normaliseContactField(field, form[field]) as string;
  }
  return Object.keys(fieldErrors).length ? { ok: false as const, fieldErrors } : { ok: true as const, data };
}

const requestKeys = new Set(["topic", "name", "affiliation", "email", "details", "requestId", "turnstileToken", "website"]);

/** Strict request parser: unknown keys, non-string values and missing fields are rejected. */
export function parseContactRequest(raw: unknown):
  | { ok: true; data: ContactRequest }
  | { ok: false; fieldErrors: ContactFieldErrors } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, fieldErrors: {} };
  const input = raw as Record<string, unknown>;
  if (Object.keys(input).some((key) => !requestKeys.has(key))) return { ok: false, fieldErrors: {} };
  for (const key of requestKeys) {
    if (key === "affiliation" && input[key] === undefined) continue;
    if (typeof input[key] !== "string") return { ok: false, fieldErrors: {} };
  }
  const fields = validateContactFields({
    name: input.name as string,
    affiliation: (input.affiliation as string | undefined) ?? "",
    email: input.email as string,
    details: input.details as string
  });
  const topicProblem = describeContactTopic(input.topic as string);
  if (!fields.ok || topicProblem) {
    return { ok: false, fieldErrors: { ...(fields.ok ? {} : fields.fieldErrors), ...(topicProblem ? { topic: topicProblem } : {}) } };
  }
  const requestId = input.requestId as string;
  const turnstileToken = input.turnstileToken as string;
  const website = input.website as string;
  if (!uuidPattern.test(requestId) || turnstileToken.length < 1 || turnstileToken.length > 2048 || website.length > 200) {
    return { ok: false, fieldErrors: {} };
  }
  return { ok: true, data: { ...fields.data, topic: input.topic as ContactTopic, requestId, turnstileToken, website } };
}
