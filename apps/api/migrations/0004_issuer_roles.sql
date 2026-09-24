-- ALF-062: org issuer allowlist / roles

CREATE TABLE IF NOT EXISTS org_members (
  id TEXT PRIMARY KEY NOT NULL,
  stellar_address TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'issuer', 'viewer')),
  label TEXT,
  created_by_user_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_org_members_role ON org_members (role);
