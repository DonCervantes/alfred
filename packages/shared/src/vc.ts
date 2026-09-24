/** Canonical JSON + content-hash helpers for ALFRED VCs (ALF-034). */

/** Stable JSON: sorted object keys, arrays preserve order. */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    out[key] = sortKeys(obj[key]);
  }
  return out;
}

export type CredentialClaims = Record<string, unknown>;

export type CredentialPayload = {
  type: string;
  claims: CredentialClaims;
  issuedAt: string;
  holderAddress: string;
  issuerAddress: string;
};
