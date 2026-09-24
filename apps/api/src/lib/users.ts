/** D1 user + session persistence (ALF-031). */

export type AlfredUser = {
  id: string;
  pollar_user_id: string;
  stellar_address: string | null;
  did: string | null;
  vault_address: string | null;
  locale: string;
};

function newUserId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function upsertUserByPollar(
  db: D1Database,
  input: {
    pollarUserId: string;
    stellarAddress: string;
    locale?: string;
  },
): Promise<AlfredUser> {
  const existing = await db
    .prepare(
      `SELECT id, pollar_user_id, stellar_address, did, vault_address, locale
       FROM users WHERE pollar_user_id = ?`,
    )
    .bind(input.pollarUserId)
    .first<AlfredUser>();

  if (existing) {
    await db
      .prepare(
        `UPDATE users
         SET stellar_address = ?, locale = COALESCE(?, locale), updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(input.stellarAddress, input.locale ?? null, existing.id)
      .run();
    return {
      ...existing,
      stellar_address: input.stellarAddress,
      locale: input.locale ?? existing.locale,
    };
  }

  const byAddr = await db
    .prepare(
      `SELECT id, pollar_user_id, stellar_address, did, vault_address, locale
       FROM users WHERE stellar_address = ?`,
    )
    .bind(input.stellarAddress)
    .first<AlfredUser>();

  if (byAddr) {
    await db
      .prepare(
        `UPDATE users
         SET pollar_user_id = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(input.pollarUserId, byAddr.id)
      .run();
    return { ...byAddr, pollar_user_id: input.pollarUserId };
  }

  const id = newUserId();
  const locale = input.locale ?? "es";
  await db
    .prepare(
      `INSERT INTO users (id, pollar_user_id, stellar_address, locale)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, input.pollarUserId, input.stellarAddress, locale)
    .run();

  return {
    id,
    pollar_user_id: input.pollarUserId,
    stellar_address: input.stellarAddress,
    did: null,
    vault_address: null,
    locale,
  };
}

export async function createSessionRow(
  db: D1Database,
  input: {
    sessionId: string;
    userId: string;
    stellarAddress: string;
    expiresAtIso: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, stellar_address, expires_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(
      input.sessionId,
      input.userId,
      input.stellarAddress,
      input.expiresAtIso,
    )
    .run();
}

export async function revokeSession(
  db: D1Database,
  sessionId: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE sessions SET revoked_at = datetime('now') WHERE id = ? AND revoked_at IS NULL`,
    )
    .bind(sessionId)
    .run();
}

export async function getValidSession(
  db: D1Database,
  sessionId: string,
): Promise<{ user_id: string; stellar_address: string } | null> {
  const row = await db
    .prepare(
      `SELECT user_id, stellar_address, expires_at, revoked_at
       FROM sessions WHERE id = ?`,
    )
    .bind(sessionId)
    .first<{
      user_id: string;
      stellar_address: string;
      expires_at: string;
      revoked_at: string | null;
    }>();

  if (!row || row.revoked_at) return null;
  if (Date.parse(row.expires_at) < Date.now()) return null;
  return { user_id: row.user_id, stellar_address: row.stellar_address };
}

export async function getUserById(
  db: D1Database,
  userId: string,
): Promise<AlfredUser | null> {
  return (
    (await db
      .prepare(
        `SELECT id, pollar_user_id, stellar_address, did, vault_address, locale
         FROM users WHERE id = ?`,
      )
      .bind(userId)
      .first<AlfredUser>()) ?? null
  );
}

export async function updateUserDid(
  db: D1Database,
  userId: string,
  did: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE users SET did = ?, updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(did, userId)
    .run();
}

export async function updateUserVault(
  db: D1Database,
  userId: string,
  vaultAddress: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE users SET vault_address = ?, updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(vaultAddress, userId)
    .run();
}
