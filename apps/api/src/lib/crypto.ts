/** AES-256-GCM encrypt/decrypt for VC payloads (ALF-034). */

function parseKey(raw: string): Uint8Array {
  const trimmed = raw.trim();
  // hex (64 chars) or base64
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      out[i] = Number.parseInt(trimmed.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
  }
  const bin = atob(trimmed);
  if (bin.length !== 32) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY must be 32 bytes (hex or base64)");
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importKey(raw: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    parseKey(raw),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Returns iv(12) || ciphertext+tag as Uint8Array. */
export async function encryptAesGcm(
  plaintext: string,
  keyRaw: string,
): Promise<Uint8Array> {
  const key = await importKey(keyRaw);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc);
  const out = new Uint8Array(12 + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), 12);
  return out;
}

export async function decryptAesGcm(
  packed: Uint8Array,
  keyRaw: string,
): Promise<string> {
  if (packed.byteLength < 13) throw new Error("ciphertext too short");
  const key = await importKey(keyRaw);
  const iv = packed.slice(0, 12);
  const data = packed.slice(12);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  return new TextDecoder().decode(plain);
}

/**
 * Decrypt with current key, then optional previous key (ALF-102 rotation window).
 */
export async function decryptAesGcmWithFallback(
  packed: Uint8Array,
  currentKey: string,
  previousKey?: string | null,
): Promise<string> {
  try {
    return await decryptAesGcm(packed, currentKey);
  } catch (first) {
    if (!previousKey?.trim()) throw first;
    return decryptAesGcm(packed, previousKey);
  }
}

export async function sha256Hex(utf8: string): Promise<string> {
  const dig = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(utf8),
  );
  return [...new Uint8Array(dig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Bytes(utf8: string): Promise<Uint8Array> {
  const dig = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(utf8),
  );
  return new Uint8Array(dig);
}
