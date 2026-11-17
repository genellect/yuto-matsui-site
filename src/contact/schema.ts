// Shared by the Contact form and functions/api/contact.ts. Keep this file free of
// browser- or Workers-only APIs so both runtimes validate with identical rules.

export const CONTACT_ENDPOINT = "/api/contact";
export const CONTACT_TURNSTILE_ACTION = "personal_contact";
export const CONTACT_FORM_ERROR_MESSAGE = "正しい形式で入力してください";
export const CONTACT_MAX_BODY_BYTES = 16 * 1024;

export const contactLimits = {
  name: { min: 2, max: 20 },
  affiliation: { min: 2, max: 20 },
  email: { min: 5, max: 50 },
  details: { min: 10, max: 1000 }
} as const;

export type ContactFieldName = keyof typeof contactLimits;
export type ContactFields = Record<ContactFieldName, string>;
export type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;

export type ContactRequest = ContactFields & {
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

function withinLength(value: string, field: ContactFieldName) {
  const { min, max } = contactLimits[field];
  return value.length >= min && value.length <= max;
}

/** Normalises one field exactly as the server will, or returns undefined when invalid. */
export function normaliseContactField(field: ContactFieldName, raw: string): string | undefined {
  if (field === "details") {
    const value = raw.replace(/\r\n?/g, "\n").trim();
    return withinLength(value, field) && !messageForbidden.test(value) ? value : undefined;
  }
  const value = raw.trim();
  if (singleLineForbidden.test(value)) return undefined;
  if (field === "affiliation" && value === "") return "";
  if (!withinLength(value, field)) return undefined;
  if (field === "email") return emailPattern.test(value) ? value.toLowerCase() : undefined;
  return value;
}

export function validateContactFields(form: ContactFields) {
  const data = {} as ContactFields;
  const fieldErrors: ContactFieldErrors = {};
  for (const field of Object.keys(contactLimits) as ContactFieldName[]) {
    const value = normaliseContactField(field, form[field]);
    if (value === undefined) fieldErrors[field] = CONTACT_FORM_ERROR_MESSAGE;
    else data[field] = value;
  }
  return Object.keys(fieldErrors).length ? { ok: false as const, fieldErrors } : { ok: true as const, data };
}

const requestKeys = new Set(["name", "affiliation", "email", "details", "requestId", "turnstileToken", "website"]);

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
  if (!fields.ok) return fields;
  const requestId = input.requestId as string;
  const turnstileToken = input.turnstileToken as string;
  const website = input.website as string;
  if (!uuidPattern.test(requestId) || turnstileToken.length < 1 || turnstileToken.length > 2048 || website.length > 200) {
    return { ok: false, fieldErrors: {} };
  }
  return { ok: true, data: { ...fields.data, requestId, turnstileToken, website } };
}
