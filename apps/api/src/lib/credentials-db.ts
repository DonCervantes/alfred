/** D1 credentials_meta + presentation_links (ALF-034 / ALF-035). */

export type CredentialMetaRow = {
  id: string;
  vc_id: string;
  holder_user_id: string;
  issuer_user_id: string | null;
  type: string | null;
  content_hash: string;
  r2_key: string | null;
  status: string;
  network: string;
  created_at: string;
  updated_at: string;
  revoke_reason?: string | null;
};

function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function insertCredentialPending(
  db: D1Database,
  input: {
    vcIdHex: string;
    holderUserId: string;
    issuerUserId: string;
    type: string;
    contentHashHex: string;
    r2Key: string;
    network: string;
  },
): Promise<CredentialMetaRow> {
  const id = newId();
  await db
    .prepare(
      `INSERT INTO credentials_meta
        (id, vc_id, holder_user_id, issuer_user_id, type, content_hash, r2_key, status, network)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    )
    .bind(
      id,
      input.vcIdHex,
      input.holderUserId,
      input.issuerUserId,
      input.type,
      input.contentHashHex,
      input.r2Key,
      input.network,
    )
    .run();

  return {
    id,
    vc_id: input.vcIdHex,
    holder_user_id: input.holderUserId,
    issuer_user_id: input.issuerUserId,
    type: input.type,
    content_hash: input.contentHashHex,
    r2_key: input.r2Key,
    status: "pending",
    network: input.network,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function markCredentialValid(
  db: D1Database,
  vcIdHex: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE credentials_meta
       SET status = 'valid', updated_at = datetime('now')
       WHERE vc_id = ?`,
    )
    .bind(vcIdHex)
    .run();
}

export async function markCredentialRevoked(
  db: D1Database,
  vcIdHex: string,
  reason?: string | null,
): Promise<void> {
  await db
    .prepare(
      `UPDATE credentials_meta
       SET status = 'revoked',
           revoke_reason = ?,
           updated_at = datetime('now')
       WHERE vc_id = ?`,
    )
    .bind(reason?.trim() || null, vcIdHex)
    .run();
}

export async function insertAuditEvent(
  db: D1Database,
  input: {
    actorUserId?: string | null;
    actorAddress?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    detail?: string | null;
  },
): Promise<void> {
  const id = newId();
  await db
    .prepare(
      `INSERT INTO audit_events
        (id, actor_user_id, actor_address, action, entity_type, entity_id, detail)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.actorUserId ?? null,
      input.actorAddress ?? null,
      input.action,
      input.entityType ?? null,
      input.entityId ?? null,
      input.detail ?? null,
    )
    .run();
}

export async function listAuditEvents(
  db: D1Database,
  limit = 50,
): Promise<
  {
    id: string;
    actor_user_id: string | null;
    actor_address: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    detail: string | null;
    created_at: string;
  }[]
> {
  const res = await db
    .prepare(
      `SELECT id, actor_user_id, actor_address, action, entity_type, entity_id, detail, created_at
       FROM audit_events
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(Math.min(Math.max(limit, 1), 200))
    .all<{
      id: string;
      actor_user_id: string | null;
      actor_address: string | null;
      action: string;
      entity_type: string | null;
      entity_id: string | null;
      detail: string | null;
      created_at: string;
    }>();
  return res.results ?? [];
}

export async function getCredentialByVcId(
  db: D1Database,
  vcIdHex: string,
): Promise<CredentialMetaRow | null> {
  return (
    (await db
      .prepare(
        `SELECT id, vc_id, holder_user_id, issuer_user_id, type, content_hash,
                r2_key, status, network, created_at, updated_at, revoke_reason
         FROM credentials_meta WHERE vc_id = ?`,
      )
      .bind(vcIdHex)
      .first<CredentialMetaRow>()) ?? null
  );
}

export async function listCredentialsForHolder(
  db: D1Database,
  holderUserId: string,
): Promise<CredentialMetaRow[]> {
  const res = await db
    .prepare(
      `SELECT id, vc_id, holder_user_id, issuer_user_id, type, content_hash,
              r2_key, status, network, created_at, updated_at, revoke_reason
       FROM credentials_meta
       WHERE holder_user_id = ?
       ORDER BY created_at DESC`,
    )
    .bind(holderUserId)
    .all<CredentialMetaRow>();
  return res.results ?? [];
}

export async function listCredentialsForIssuer(
  db: D1Database,
  issuerUserId: string,
  filters?: {
    status?: string;
    type?: string;
    q?: string;
  },
): Promise<(CredentialMetaRow & { holder_address: string | null })[]> {
  const clauses = ["c.issuer_user_id = ?"];
  const binds: string[] = [issuerUserId];

  const status = filters?.status?.trim();
  if (status && status !== "all") {
    clauses.push("c.status = ?");
    binds.push(status);
  }

  const type = filters?.type?.trim();
  if (type && type !== "all") {
    clauses.push("c.type = ?");
    binds.push(type);
  }

  const q = filters?.q?.trim();
  if (q) {
    clauses.push(
      "(c.vc_id LIKE ? OR IFNULL(c.type, '') LIKE ? OR IFNULL(u.stellar_address, '') LIKE ?)",
    );
    const like = `%${q.replace(/%/g, "")}%`;
    binds.push(like, like, like);
  }

  const res = await db
    .prepare(
      `SELECT c.id, c.vc_id, c.holder_user_id, c.issuer_user_id, c.type,
              c.content_hash, c.r2_key, c.status, c.network, c.created_at, c.updated_at,
              c.revoke_reason,
              u.stellar_address AS holder_address
       FROM credentials_meta c
       LEFT JOIN users u ON u.id = c.holder_user_id
       WHERE ${clauses.join(" AND ")}
       ORDER BY c.created_at DESC
       LIMIT 200`,
    )
    .bind(...binds)
    .all<CredentialMetaRow & { holder_address: string | null }>();
  return res.results ?? [];
}

export async function createPresentationLink(
  db: D1Database,
  input: {
    token: string;
    vcIdHex: string;
    holderUserId: string;
    expiresAtIso: string | null;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO presentation_links (token, vc_id, holder_user_id, expires_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(
      input.token,
      input.vcIdHex,
      input.holderUserId,
      input.expiresAtIso,
    )
    .run();
}

export async function getPresentationLink(
  db: D1Database,
  token: string,
): Promise<{
  token: string;
  vc_id: string;
  holder_user_id: string;
  expires_at: string | null;
  revoked_at: string | null;
} | null> {
  return (
    (await db
      .prepare(
        `SELECT token, vc_id, holder_user_id, expires_at, revoked_at
         FROM presentation_links WHERE token = ?`,
      )
      .bind(token)
      .first<{
        token: string;
        vc_id: string;
        holder_user_id: string;
        expires_at: string | null;
        revoked_at: string | null;
      }>()) ?? null
  );
}
