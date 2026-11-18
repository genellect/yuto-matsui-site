-- Contact inquiry history (Cloudflare D1, binding CONTACT_DB).
-- A row is written before the visitor sees the success screen; the e-mail
-- notification result is recorded on the same row afterwards.
CREATE TABLE IF NOT EXISTS inquiries (
  id            TEXT PRIMARY KEY,
  received_at   TEXT NOT NULL,
  topic         TEXT NOT NULL CHECK (topic IN ('work', 'student')),
  grade         TEXT NOT NULL DEFAULT '',
  affiliation   TEXT NOT NULL,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  details       TEXT NOT NULL,
  disposition   TEXT NOT NULL CHECK (disposition IN ('accepted', 'spam')),
  notify_status TEXT NOT NULL CHECK (notify_status IN ('pending', 'sent', 'failed', 'skipped')),
  notify_detail TEXT,
  notified_at   TEXT
);
CREATE INDEX IF NOT EXISTS inquiries_received_at ON inquiries (received_at DESC);
