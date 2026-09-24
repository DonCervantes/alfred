/** Encrypted VC blob storage — R2 when bound, else D1 (ALF-034). */

export async function putEncryptedBlob(
  env: { VC_BLOBS?: R2Bucket; DB: D1Database },
  key: string,
  bytes: Uint8Array,
): Promise<{ key: string; backend: "r2" | "d1" }> {
  if (env.VC_BLOBS) {
    await env.VC_BLOBS.put(key, bytes, {
      httpMetadata: { contentType: "application/octet-stream" },
    });
    return { key, backend: "r2" };
  }

  await env.DB.prepare(
    `INSERT INTO credential_blobs (r2_key, ciphertext) VALUES (?, ?)
     ON CONFLICT(r2_key) DO UPDATE SET ciphertext = excluded.ciphertext`,
  )
    .bind(key, bytes)
    .run();

  return { key, backend: "d1" };
}

export async function getEncryptedBlob(
  env: { VC_BLOBS?: R2Bucket; DB: D1Database },
  key: string,
): Promise<Uint8Array | null> {
  if (env.VC_BLOBS) {
    const obj = await env.VC_BLOBS.get(key);
    if (!obj) return null;
    return new Uint8Array(await obj.arrayBuffer());
  }

  const row = await env.DB.prepare(
    `SELECT ciphertext FROM credential_blobs WHERE r2_key = ?`,
  )
    .bind(key)
    .first<{ ciphertext: ArrayBuffer }>();

  if (!row?.ciphertext) return null;
  return new Uint8Array(row.ciphertext);
}
