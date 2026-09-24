-- ALF-063 / ALF-064: revoke reason + audit log

ALTER TABLE credentials_meta ADD COLUMN revoke_reason TEXT;

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  actor_user_id TEXT,
  actor_address TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events (actor_user_id);
