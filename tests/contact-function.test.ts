import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { onRequest, readConfig, notificationText, formatReceivedAt, type ContactDatabase, type ContactEnv } from "../functions/api/contact.ts";
import { parseContactRequest, normaliseContactField, describeContactField, describeContactGrade, CONTACT_MAX_BODY_BYTES, CONTACT_TURNSTILE_ACTION } from "../src/contact/schema.ts";

// Every outbound request and the D1 history are mocked. No test reaches Turnstile, Cloudflare, D1 or a mailbox.
const HOST = "yuto-matsui.com";
const RECIPIENT = "inbox@example.test";
const SENDER = "contact@example.test";
const TOKEN = "test-token-not-a-real-credential";
const ACCOUNT = "0123456789abcdef0123456789abcdef";

/** In-memory stand-in for the D1 binding, following the two statements the Function issues. */
class FakeD1 implements ContactDatabase {
  rows = new Map<string, Record<string, unknown>>();
  failInsert = false;
  failUpdate = false;
  prepare(query: string) {
    return {
      bind: (...values: unknown[]) => ({
        run: async () => {
          if (query.startsWith("INSERT INTO inquiries")) {
            if (this.failInsert) throw new Error("D1_ERROR: storage unavailable");
            const [id, received_at, topic, grade, affiliation, name, email, details, disposition, notify_status] = values;
            if (this.rows.has(String(id))) return { meta: { changes: 0 } };
            this.rows.set(String(id), { id, received_at, topic, grade, affiliation, name, email, details, disposition, notify_status, notify_detail: null, notified_at: null });
            return { meta: { changes: 1 } };
          }
          if (query.startsWith("UPDATE inquiries")) {
            if (this.failUpdate) throw new Error("D1_ERROR: storage unavailable");
            const [notify_status, notify_detail, notified_at, id] = values;
            const row = this.rows.get(String(id));
            if (!row) return { meta: { changes: 0 } };
            Object.assign(row, { notify_status, notify_detail, notified_at });
            return { meta: { changes: 1 } };
          }
          throw new Error(`Unexpected statement: ${query}`);
        }
      })
    };
  }
}

let db = new FakeD1();
const sendEnv: ContactEnv = {
  CONTACT_MODE: "send",
  CONTACT_ALLOWED_HOST: HOST,
  CONTACT_ACCOUNT_ID: ACCOUNT,
  CONTACT_FROM: SENDER,
  CONTACT_TO: RECIPIENT,
  CONTACT_EMAIL_API_TOKEN: TOKEN,
  CONTACT_TURNSTILE_SECRET_KEY: "turnstile-secret"
};

const validPayload = () => ({
  topic: "work" as "work" | "student",
  grade: "" as "" | "3年",
  name: "山田 花子",
  affiliation: "株式会社サンプル 開発部",
  email: " Hanako@Example.COM ",
  details: "共同研究についてご相談させてください。",
  requestId: "3f1c2a4e-5b6d-4e7f-8a9b-0c1d2e3f4a5b",
  turnstileToken: "token",
  website: ""
});

type Call = { url: string; init?: RequestInit };
let calls: Call[] = [];
let turnstileReply: () => Response | Promise<Response>;
let emailReply: () => Response | Promise<Response>;
let logs: string[] = [];
const realFetch = globalThis.fetch;
const realLog = console.log;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const accepted = (result: Record<string, unknown> = { delivered: [RECIPIENT], queued: [], permanent_bounces: [] }) =>
  json({ success: true, errors: [], messages: [], result });

beforeEach(() => {
  db = new FakeD1();
  sendEnv.CONTACT_DB = db;
  calls = [];
  logs = [];
  turnstileReply = () => json({ success: true, hostname: HOST, action: CONTACT_TURNSTILE_ACTION });
  emailReply = () => accepted();
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    calls.push({ url, init });
    if (url.startsWith("https://challenges.cloudflare.com/")) return turnstileReply();
    if (url.startsWith("https://api.cloudflare.com/")) return emailReply();
    throw new Error(`Unexpected request to ${url}`);
  }) as typeof fetch;
  console.log = (...args: unknown[]) => { logs.push(args.join(" ")); };
});

afterEach(() => {
  globalThis.fetch = realFetch;
  console.log = realLog;
});

function request(body: unknown, options: { origin?: string | null; url?: string; method?: string; contentType?: string; raw?: string; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.contentType !== "") headers["Content-Type"] = options.contentType ?? "application/json";
  const origin = options.origin === undefined ? `https://${HOST}` : options.origin;
  if (origin) headers.Origin = origin;
  const method = options.method ?? "POST";
  return new Request(options.url ?? `https://${HOST}/api/contact`, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : options.raw ?? JSON.stringify(body)
  });
}

function streamedRequest(body: ReadableStream<Uint8Array>) {
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: `https://${HOST}` },
    body,
    duplex: "half"
  };
  return new Request(`https://${HOST}/api/contact`, init);
}

async function call(req: Request, env: ContactEnv = sendEnv, waitUntil?: (promise: Promise<unknown>) => void) {
  const response = await onRequest({ request: req, env, waitUntil });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}

const emailCalls = () => calls.filter((item) => item.url.startsWith("https://api.cloudflare.com/"));
const onlyRow = () => {
  assert.equal(db.rows.size, 1);
  return [...db.rows.values()][0];
};

describe("request boundary", () => {
  test("rejects non-POST methods", async () => {
    const { response } = await call(request(null, { method: "GET" }));
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "POST");
  });

  test("rejects non-JSON content", async () => {
    const { response, body } = await call(request(validPayload(), { contentType: "text/plain" }));
    assert.equal(response.status, 415);
    assert.equal(body.code, "content_type");
  });

  test("fails closed when configuration is incomplete", async () => {
    for (const env of [{}, { ...sendEnv, CONTACT_MODE: undefined }, { ...sendEnv, CONTACT_EMAIL_API_TOKEN: "" }, { ...sendEnv, CONTACT_ALLOWED_HOST: "" }, { ...sendEnv, CONTACT_TO: "not-an-address" }, { ...sendEnv, CONTACT_TURNSTILE_SECRET_KEY: "" }, { ...sendEnv, CONTACT_DB: undefined }, { CONTACT_MODE: "mock", CONTACT_TURNSTILE_SECRET_KEY: "s" }]) {
      const { response, body } = await call(request(validPayload()), env as ContactEnv);
      assert.equal(response.status, 503);
      assert.equal(body.code, "configuration");
    }
    assert.equal(calls.length, 0);
    assert.equal(db.rows.size, 0);
  });

  test("rejects a foreign or missing Origin", async () => {
    for (const origin of ["https://evil.example", null, `http://${HOST}`, "https://yuto-matsui-site.pages.dev"]) {
      const { response, body } = await call(request(validPayload(), { origin }));
      assert.equal(response.status, 403);
      assert.equal(body.code, "origin");
    }
    assert.equal(calls.length, 0);
  });

  test("rejects the pages.dev alias in production even with a matching Origin", async () => {
    const alias = "https://yuto-matsui-site.pages.dev";
    const { response } = await call(request(validPayload(), { url: `${alias}/api/contact`, origin: alias }));
    assert.equal(response.status, 403);
    assert.equal(calls.length, 0);
  });

  test("rejects oversized bodies by header and by actual size", async () => {
    const declared = await call(request(validPayload(), { headers: { "Content-Length": String(20_000) } }));
    assert.equal(declared.response.status, 413);
    const actual = await call(request(null, { raw: JSON.stringify({ ...validPayload(), details: "あ".repeat(6000) }) }));
    assert.equal(actual.response.status, 413);
  });

  test("cancels an oversized stream without reading the remaining body", async () => {
    let pulls = 0;
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls++;
        if (pulls === 1) controller.enqueue(new Uint8Array(CONTACT_MAX_BODY_BYTES));
        else if (pulls === 2) controller.enqueue(new Uint8Array([32]));
        else controller.error(new Error("remaining body should not be read"));
      },
      cancel() { cancelled = true; }
    }, { highWaterMark: 0 });
    const req = streamedRequest(stream);
    assert.equal(req.headers.has("Content-Length"), false);
    const { response, body } = await call(req);
    assert.equal(response.status, 413);
    assert.equal(body.code, "body_too_large");
    assert.equal(pulls, 2);
    assert.equal(cancelled, true);
    assert.equal(calls.length, 0);
  });

  test("decodes Japanese input split inside a UTF-8 character at the body limit", async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ ...validPayload(), name: "山田 花子" }));
    const split = data.indexOf(encoder.encode("山")[0]) + 1;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(data.subarray(0, split));
        controller.enqueue(data.subarray(split));
        controller.enqueue(new Uint8Array(CONTACT_MAX_BODY_BYTES - data.length).fill(32));
        controller.close();
      }
    });
    const { response } = await call(streamedRequest(stream));
    assert.equal(response.status, 200);
    assert.match(JSON.parse(String(emailCalls()[0].init?.body)).text, /山田 花子/);
  });

  test("rejects malformed JSON and schema violations", async () => {
    assert.equal((await call(request(null, { raw: "{" }))).response.status, 400);
    const unknownKey = await call(request({ ...validPayload(), target: "compass" }));
    assert.equal(unknownKey.response.status, 422);
    const invalid = await call(request({ ...validPayload(), email: "invalid" }));
    assert.equal(invalid.response.status, 422);
    assert.deepEqual(invalid.body.fieldErrors, { email: "メールアドレスの形式を確認してください" });
    const noTopic = await call(request({ ...validPayload(), topic: "other" }));
    assert.equal(noTopic.response.status, 422);
    assert.deepEqual(noTopic.body.fieldErrors, { topic: "お問い合わせの種類を選んでください" });
    const noAffiliation = await call(request({ ...validPayload(), affiliation: " " }));
    assert.deepEqual(noAffiliation.body.fieldErrors, { affiliation: "会社名・所属を入力してください" });
    const noGrade = await call(request({ ...validPayload(), topic: "student", affiliation: "北里大学" }));
    assert.deepEqual(noGrade.body.fieldErrors, { grade: "学年を選んでください" });
    assert.equal(calls.length, 0);
  });
});

describe("verification", () => {
  test("a filled honeypot is recorded as spam and never notified", async () => {
    const { response, body } = await call(request({ ...validPayload(), website: "https://spam.example" }));
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(emailCalls().length, 0);
    const row = onlyRow();
    assert.equal(row.disposition, "spam");
    assert.equal(row.notify_status, "skipped");
    assert.equal(row.name, "山田 花子");
  });

  test("a filled honeypot still needs Turnstile and is not recorded without it", async () => {
    turnstileReply = () => json({ success: false });
    const { response } = await call(request({ ...validPayload(), website: "https://spam.example" }));
    assert.equal(response.status, 422);
    assert.equal(db.rows.size, 0);
  });

  test("Turnstile rejection, outage and context mismatch never send mail", async () => {
    const replies = [
      () => json({ success: false }),
      () => json({}, 500),
      () => { throw new Error("network"); },
      () => json({ success: true, hostname: "yuto-matsui-site.pages.dev", action: CONTACT_TURNSTILE_ACTION }),
      () => json({ success: true, hostname: HOST, action: "contact_verification" })
    ];
    for (const reply of replies) {
      turnstileReply = reply;
      const { response, body } = await call(request(validPayload()));
      assert.equal(response.status, 422);
      assert.equal(body.code, "turnstile");
    }
    assert.equal(emailCalls().length, 0);
    assert.equal(db.rows.size, 0);
  });

  test("Turnstile receives the secret, token and idempotency key", async () => {
    await call(request(validPayload(), { headers: { "CF-Connecting-IP": "192.0.2.1" } }));
    const form = calls[0].init?.body as FormData;
    assert.equal(form.get("secret"), "turnstile-secret");
    assert.equal(form.get("response"), "token");
    assert.equal(form.get("idempotency_key"), validPayload().requestId);
    assert.equal(form.get("remoteip"), "192.0.2.1");
  });
});

describe("history", () => {
  test("records the normalised inquiry before reporting success", async () => {
    const { response } = await call(request(validPayload()));
    assert.equal(response.status, 200);
    const row = onlyRow();
    assert.equal(row.id, validPayload().requestId);
    assert.match(String(row.received_at), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    assert.equal(row.topic, "work");
    assert.equal(row.grade, "");
    assert.equal(row.affiliation, "株式会社サンプル 開発部");
    assert.equal(row.name, "山田 花子");
    assert.equal(row.email, "hanako@example.com");
    assert.equal(row.details, "共同研究についてご相談させてください。");
    assert.equal(row.disposition, "accepted");
    assert.equal(row.notify_status, "sent");
    assert.equal(row.notify_detail, null);
    assert.ok(row.notified_at);
  });

  test("a storage failure is not reported as received and sends nothing", async () => {
    db.failInsert = true;
    const { response, body } = await call(request(validPayload()));
    assert.equal(response.status, 503);
    assert.deepEqual(body, { ok: false, code: "storage" });
    assert.equal(emailCalls().length, 0);
    assert.ok(logs.some((line) => line.includes('"outcome":"storage"')));
  });

  test("the same submission is recorded and notified once", async () => {
    assert.equal((await call(request(validPayload()))).response.status, 200);
    const again = await call(request(validPayload()));
    assert.equal(again.response.status, 200);
    assert.equal(db.rows.size, 1);
    assert.equal(emailCalls().length, 1);
    assert.ok(logs.some((line) => line.includes('"outcome":"duplicate"')));
  });

  test("the notification runs after the response through waitUntil", async () => {
    const tasks: Promise<unknown>[] = [];
    const { response } = await call(request(validPayload()), sendEnv, (task) => { tasks.push(task); });
    assert.equal(response.status, 200);
    assert.equal(tasks.length, 1);
    await Promise.all(tasks);
    assert.equal(onlyRow().notify_status, "sent");
  });

  test("a failed write of the notification outcome keeps the inquiry and the success", async () => {
    db.failUpdate = true;
    const { response } = await call(request(validPayload()));
    assert.equal(response.status, 200);
    assert.equal(onlyRow().notify_status, "pending");
    assert.ok(logs.some((line) => line.includes('"outcome":"notify_record_failed"')));
  });

  test("the history row for a student keeps the grade", async () => {
    await call(request({ ...validPayload(), topic: "student", affiliation: "北里大学", grade: "3年" }));
    const row = onlyRow();
    assert.equal(row.topic, "student");
    assert.equal(row.grade, "3年");
  });
});

describe("delivery", () => {
  test("sends one plain-text notification to the fixed recipient with Reply-To", async () => {
    const { response, body } = await call(request(validPayload()));
    assert.equal(response.status, 200);
    assert.deepEqual(body, { ok: true });
    const sent = emailCalls();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].url, `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/email/sending/send`);
    assert.equal((sent[0].init?.headers as Record<string, string>).Authorization, `Bearer ${TOKEN}`);
    const message = JSON.parse(String(sent[0].init?.body));
    assert.deepEqual(Object.keys(message).sort(), ["from", "reply_to", "subject", "text", "to"]);
    assert.deepEqual(message.to, [RECIPIENT]);
    assert.equal(message.from, SENDER);
    assert.equal(message.reply_to, "hanako@example.com");
    assert.equal(message.subject, "[yuto-matsui.com] お仕事のご依頼");
    assert.match(message.text, /種類: お仕事のご依頼/);
    assert.match(message.text, /会社名・所属: 株式会社サンプル 開発部/);
    assert.doesNotMatch(message.text, /学年:/);
    assert.match(message.text, /お名前: 山田 花子/);
    assert.match(message.text, /共同研究についてご相談させてください。/);
  });

  test("queued delivery is accepted", async () => {
    emailReply = () => accepted({ delivered: [], queued: [RECIPIENT], permanent_bounces: [] });
    assert.equal((await call(request(validPayload()))).response.status, 200);
  });

  test("bounced, suppressed, missing and failed deliveries keep the inquiry and are recorded as failed", async () => {
    const replies = [
      () => accepted({ delivered: [], queued: [], permanent_bounces: [RECIPIENT] }),
      () => accepted({ delivered: [RECIPIENT], queued: [], permanent_bounces: [], suppressed_recipients: [RECIPIENT] }),
      () => accepted({ delivered: ["other@example.test"], queued: [], permanent_bounces: [] }),
      () => json({ success: false, errors: [{ code: 10102, message: "forbidden" }], result: null }, 403),
      () => json({ success: true, result: null }),
      () => new Response("<html>bad gateway</html>", { status: 502 }),
      () => { throw new Error("network"); },
      () => { const error = new Error("timeout"); error.name = "TimeoutError"; throw error; }
    ];
    const details = [
      "recipient_rejected",
      "recipient_rejected",
      "recipient_not_accepted",
      "http_403_errors_10102",
      "http_200",
      "http_502_invalid_json",
      "unreachable",
      "timeout"
    ];
    for (const [index, reply] of replies.entries()) {
      db = new FakeD1();
      emailReply = reply;
      const { response, body } = await call(request(validPayload()), { ...sendEnv, CONTACT_DB: db });
      assert.equal(response.status, 200);
      assert.deepEqual(body, { ok: true });
      const row = onlyRow();
      assert.equal(row.disposition, "accepted");
      assert.equal(row.notify_status, "failed");
      assert.equal(row.notify_detail, details[index]);
    }
    assert.ok(logs.some((line) => line.includes('"outcome":"notify_failed"')));
  });

  test("no automatic retry after a failure", async () => {
    emailReply = () => json({}, 500);
    await call(request(validPayload()));
    assert.equal(emailCalls().length, 1);
  });

  test("user input never reaches subject or headers and logs stay free of personal data", async () => {
    const payload = { ...validPayload(), name: "Name Bcc", details: "Subject: injected\nBcc: other@example.test\n本文です。" };
    await call(request(payload));
    const message = JSON.parse(String(emailCalls()[0].init?.body));
    assert.equal(message.subject, "[yuto-matsui.com] お仕事のご依頼");
    const joined = logs.join("\n");
    for (const secret of ["山田", "Name Bcc", "hanako", "injected", "本文", "株式会社", TOKEN, RECIPIENT, "192.0.2"]) assert.ok(!joined.includes(secret), secret);
    assert.ok(joined.includes(validPayload().requestId), "logs carry the history id");
  });

  test("mock mode accepts same-origin Preview requests without contacting the mail API", async () => {
    const preview = "https://claude-branch.yuto-matsui-site.pages.dev";
    turnstileReply = () => json({ success: true, hostname: "example.com", action: "" });
    const env: ContactEnv = { CONTACT_MODE: "mock", CONTACT_TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA", CONTACT_DB: db };
    const { response } = await call(request(validPayload(), { url: `${preview}/api/contact`, origin: preview }), env);
    assert.equal(response.status, 200);
    assert.equal(emailCalls().length, 0);
    const row = onlyRow();
    assert.equal(row.disposition, "accepted");
    assert.equal(row.notify_status, "skipped");
    const foreign = await call(request(validPayload(), { url: `${preview}/api/contact`, origin: `https://${HOST}` }), env);
    assert.equal(foreign.response.status, 403);
  });
});

describe("schema", () => {
  test("normalises fields like the form", () => {
    assert.equal(normaliseContactField("email", " A@B.CO "), "a@b.co");
    assert.equal(normaliseContactField("affiliation", "  "), undefined);
    assert.equal(normaliseContactField("affiliation", "A"), "A");
    assert.equal(normaliseContactField("affiliation", "a".repeat(51)), undefined);
    assert.equal(normaliseContactField("name", "名"), "名");
    assert.equal(normaliseContactField("name", "a".repeat(50)), "a".repeat(50));
    assert.equal(normaliseContactField("name", "a".repeat(51)), undefined);
    assert.equal(normaliseContactField("name", "   "), undefined);
    assert.equal(normaliseContactField("email", `${"a".repeat(60)}@example.co.jp`), `${"a".repeat(60)}@example.co.jp`);
    assert.equal(normaliseContactField("details", "了解"), "了解");
    assert.equal(normaliseContactField("name", "山田\n花子"), undefined);
    assert.equal(normaliseContactField("email", "a@b.co\r\nBcc: x@y.z"), undefined);
    assert.equal(normaliseContactField("details", "改行を\r\n含む本文です。"), "改行を\n含む本文です。");
    assert.equal(normaliseContactField("details", "a".repeat(1000))?.length, 1000);
    assert.equal(normaliseContactField("details", "a".repeat(1001)), undefined);
    assert.equal(normaliseContactField("details", "制御\u0007文字を含む本文"), undefined);
  });

  test("request parser is strict", () => {
    assert.equal(parseContactRequest(validPayload()).ok, true);
    const { affiliation: _omitted, ...withoutAffiliation } = validPayload();
    assert.equal(parseContactRequest(withoutAffiliation).ok, false);
    const { grade: _noGrade, ...withoutGrade } = validPayload();
    assert.equal(parseContactRequest(withoutGrade).ok, false);
    assert.equal(parseContactRequest({ ...validPayload(), topic: "student", affiliation: "北里大学", grade: "3年" }).ok, true);
    assert.equal(parseContactRequest({ ...validPayload(), topic: "student", affiliation: "北里大学", grade: "7年" }).ok, false);
    assert.equal(parseContactRequest({ ...validPayload(), grade: "3年" }).ok, false);
    assert.equal(parseContactRequest({ ...validPayload(), topic: "media" }).ok, false);
    assert.equal(parseContactRequest({ ...validPayload(), requestId: "x" }).ok, false);
    assert.equal(parseContactRequest({ ...validPayload(), turnstileToken: "" }).ok, false);
    assert.equal(parseContactRequest({ ...validPayload(), name: 1 }).ok, false);
    assert.equal(parseContactRequest([]).ok, false);
    assert.equal(parseContactRequest({ ...validPayload(), topic: "toString" }).ok, false);
    const { topic: _noTopic, ...withoutTopic } = validPayload();
    assert.equal(parseContactRequest(withoutTopic).ok, false);
  });

  test("field problems are described specifically", () => {
    assert.equal(describeContactField("name", ""), "お名前を入力してください");
    assert.equal(describeContactField("email", ""), "メールアドレスを入力してください");
    assert.equal(describeContactField("email", "hanako@"), "メールアドレスの形式を確認してください");
    assert.equal(describeContactField("details", " \n "), "メッセージを入力してください");
    assert.equal(describeContactField("details", "", "work"), "ご用件を入力してください");
    assert.equal(describeContactField("details", "", "student"), "ご相談内容を入力してください");
    assert.equal(describeContactField("details", "a".repeat(1001)), "1000文字以内で入力してください");
    assert.equal(describeContactField("affiliation", "", "work"), "会社名・所属を入力してください");
    assert.equal(describeContactField("affiliation", "", "student"), "大学名を入力してください");
    assert.equal(describeContactGrade("student", ""), "学年を選んでください");
    assert.equal(describeContactGrade("student", "大学院"), undefined);
    assert.equal(describeContactGrade("work", ""), undefined);
  });

  test("configuration reader", () => {
    assert.equal(readConfig(sendEnv)?.mode, "send");
    assert.equal(readConfig({ CONTACT_MODE: "mock", CONTACT_TURNSTILE_SECRET_KEY: "s", CONTACT_DB: db })?.mode, "mock");
    assert.equal(readConfig({ CONTACT_MODE: "mock", CONTACT_TURNSTILE_SECRET_KEY: "s" }), undefined);
    assert.equal(readConfig({ ...sendEnv, CONTACT_DB: undefined }), undefined);
    assert.equal(readConfig({ CONTACT_MODE: "Send", CONTACT_TURNSTILE_SECRET_KEY: "s", CONTACT_DB: db }), undefined);
  });

  test("notification text", () => {
    const text = notificationText({ ...validPayload(), topic: "student", affiliation: "北里大学", grade: "3年", email: "a@b.co" }, new Date("2026-11-17T05:00:00Z"));
    assert.match(text, /受信日時: 2026\/11\/17 14:00 \(JST\)/);
    assert.match(text, /種類: 学生からの相談\n大学名: 北里大学\n学年: 3年\nお名前: 山田 花子[\s\S]*\nご相談内容:\n共同研究/);
    assert.equal(formatReceivedAt(new Date("2026-01-01T15:30:00Z")), "2026/01/02 00:30 (JST)");
  });
});
