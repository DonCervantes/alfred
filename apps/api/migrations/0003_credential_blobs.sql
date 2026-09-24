-- Encrypted VC ciphertext fallback when R2 is not enabled (ALF-034).
-- Prefer R2 (VC_BLOBS) when available; D1 holds ciphertext until then.

CREATE TABLE IF NOT EXISTS credential_blobs (
  r2_key TEXT PRIMARY KEY NOT NULL,
  ciphertext BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
