-- ALF-011: D1 schema v0
-- Apply: wrangler d1 migrations apply alfred-db --local|--remote

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  pollar_user_id TEXT NOT NULL UNIQUE,
  stellar_address TEXT,
  did TEXT,
  vault_address TEXT,
  locale TEXT NOT NULL DEFAULT 'es',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_stellar ON users (stellar_address);

CREATE TABLE IF NOT EXISTS credentials_meta (
  id TEXT PRIMARY KEY NOT NULL,
  vc_id TEXT NOT NULL UNIQUE,
  holder_user_id TEXT NOT NULL,
  issuer_user_id TEXT,
  type TEXT,
  content_hash TEXT NOT NULL,
  r2_key TEXT,
  status TEXT NOT NULL DEFAULT 'valid',
  network TEXT NOT NULL DEFAULT 'testnet',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (holder_user_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_credentials_holder ON credentials_meta (holder_user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON credentials_meta (status);

CREATE TABLE IF NOT EXISTS presentation_links (
  token TEXT PRIMARY KEY NOT NULL,
  vc_id TEXT NOT NULL,
  holder_user_id TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (holder_user_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_presentation_vc ON presentation_links (vc_id);
