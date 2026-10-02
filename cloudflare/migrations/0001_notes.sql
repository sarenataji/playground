CREATE TABLE guest_notes (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL CHECK(length(trim(message)) BETWEEN 1 AND 1000),
  name TEXT NOT NULL DEFAULT '' CHECK(length(name) <= 50),
  color TEXT NOT NULL CHECK(color IN ('butter','rose','sage','sky')),
  stamp TEXT NOT NULL CHECK(stamp IN ('flower','star','heart','smile')),
  created_at TEXT NOT NULL,
  read_at TEXT,
  favorite INTEGER NOT NULL DEFAULT 0 CHECK(favorite IN (0,1)),
  archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1))
);
CREATE INDEX guest_notes_created_at ON guest_notes(created_at DESC, id);
CREATE TABLE guest_note_receipts (id TEXT PRIMARY KEY);
CREATE TABLE note_submissions (id TEXT PRIMARY KEY, visitor TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX note_submissions_visitor_time ON note_submissions(visitor, created_at);
CREATE TRIGGER note_rate_limit BEFORE INSERT ON note_submissions
BEGIN
  SELECT RAISE(ABORT, 'note_rate_limit') WHERE EXISTS (
    SELECT 1 FROM note_submissions WHERE visitor = NEW.visitor
      AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', NEW.created_at, '-1 minute')
  ) OR (SELECT count(*) FROM note_submissions WHERE visitor = NEW.visitor
      AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', NEW.created_at, '-1 hour')) >= 5;
END;
