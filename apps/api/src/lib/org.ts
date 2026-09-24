/** Org members / issuer allowlist (ALF-062). */

export type OrgRole = "admin" | "issuer" | "viewer";

export type OrgMemberRow = {
  id: string;
  stellar_address: string;
  role: OrgRole;
  label: string | null;
  created_by_user_id: string | null;
  created_at: string;
};

const G_ADDR = /^G[A-Z0-9]{55}$/;

function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isValidGAddress(addr: string): boolean {
  return G_ADDR.test(addr);
}

export function isOrgRole(value: string): value is OrgRole {
  return value === "admin" || value === "issuer" || value === "viewer";
}

export async function countOrgMembers(db: D1Database): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM org_members`)
    .first<{ n: number }>();
  return Number(row?.n ?? 0);
}

/** Empty table = open mode (anyone may issue). */
export async function isAllowlistEnabled(db: D1Database): Promise<boolean> {
  return (await countOrgMembers(db)) > 0;
}

export async function getMemberByAddress(
  db: D1Database,
  stellarAddress: string,
): Promise<OrgMemberRow | null> {
  return (
    (await db
      .prepare(
        `SELECT id, stellar_address, role, label, created_by_user_id, created_at
         FROM org_members WHERE stellar_address = ?`,
      )
      .bind(stellarAddress)
      .first<OrgMemberRow>()) ?? null
  );
}

export async function listOrgMembers(
  db: D1Database,
): Promise<OrgMemberRow[]> {
  const res = await db
    .prepare(
      `SELECT id, stellar_address, role, label, created_by_user_id, created_at
       FROM org_members
       ORDER BY
         CASE role WHEN 'admin' THEN 0 WHEN 'issuer' THEN 1 ELSE 2 END,
         created_at ASC`,
    )
    .all<OrgMemberRow>();
  return res.results ?? [];
}

export async function addOrgMember(
  db: D1Database,
  input: {
    stellarAddress: string;
    role: OrgRole;
    label?: string | null;
    createdByUserId: string;
  },
): Promise<OrgMemberRow> {
  const id = newId();
  const label = input.label?.trim() || null;
  await db
    .prepare(
      `INSERT INTO org_members (id, stellar_address, role, label, created_by_user_id)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.stellarAddress,
      input.role,
      label,
      input.createdByUserId,
    )
    .run();
  return {
    id,
    stellar_address: input.stellarAddress,
    role: input.role,
    label,
    created_by_user_id: input.createdByUserId,
    created_at: new Date().toISOString(),
  };
}

export async function removeOrgMember(
  db: D1Database,
  stellarAddress: string,
): Promise<boolean> {
  const res = await db
    .prepare(`DELETE FROM org_members WHERE stellar_address = ?`)
    .bind(stellarAddress)
    .run();
  return (res.meta.changes ?? 0) > 0;
}

export async function countAdmins(db: D1Database): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM org_members WHERE role = 'admin'`)
    .first<{ n: number }>();
  return Number(row?.n ?? 0);
}

export async function canIssue(
  db: D1Database,
  stellarAddress: string,
): Promise<boolean> {
  if (!(await isAllowlistEnabled(db))) return true;
  const member = await getMemberByAddress(db, stellarAddress);
  return member?.role === "admin" || member?.role === "issuer";
}

export async function canManageOrg(
  db: D1Database,
  stellarAddress: string,
): Promise<boolean> {
  if (!(await isAllowlistEnabled(db))) return true;
  const member = await getMemberByAddress(db, stellarAddress);
  return member?.role === "admin";
}
