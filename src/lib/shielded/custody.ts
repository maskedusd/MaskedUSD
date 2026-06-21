// Encryption-at-rest for the shielded note store (Stage F spec §5).
//
// A note's ownerPriv + blinding ARE its spending authority, so the store must survive reloads — but
// plaintext localStorage means anyone with the device (or an XSS) reads your whole shielded history.
// Here the at-rest blob is AES-256-GCM-sealed under `custodyKey`, the per-wallet key derived from the
// one viewing-key signature (see identity.ts). The key lives only in tab memory; only the ciphertext
// touches disk. The GCM tag is authenticated with an AAD bound to (chainId, owner) so a blob can't be
// lifted to another account/chain, and a wrong key fails loudly (decrypt throws) rather than silently.

import type { StoredNote } from "./store";

const ENVELOPE_VERSION = 1;

export interface Envelope {
  v: number;
  iv: string; // base64, 12-byte GCM nonce (fresh per write)
  ct: string; // base64, ciphertext || 16-byte GCM tag
}

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// AAD = a fixed domain string bound to the storage slot. Re-deriving the same string is the only way
// the GCM tag verifies, so a ciphertext is cryptographically pinned to exactly one (chain, owner).
function aad(chainId: number, owner: string): Uint8Array {
  return new TextEncoder().encode(`maskedusd:notes:v1:${chainId}:${owner.toLowerCase()}`);
}

// WebCrypto types want Uint8Array<ArrayBuffer>; our byte arrays are Uint8Array<ArrayBufferLike>.
// They are structurally fine at runtime, so coerce at the call boundary.
const src = (u: Uint8Array): BufferSource => u as BufferSource;

function importKey(custodyKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", src(custodyKey), "AES-GCM", false, ["encrypt", "decrypt"]);
}

/// Seal `notes` into a self-describing JSON envelope (safe to store as a localStorage string).
export async function seal(
  custodyKey: Uint8Array,
  chainId: number,
  owner: string,
  notes: StoredNote[],
): Promise<string> {
  const key = await importKey(custodyKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const pt = new TextEncoder().encode(JSON.stringify(notes));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: src(aad(chainId, owner)) },
      key,
      src(pt),
    ),
  );
  const env: Envelope = { v: ENVELOPE_VERSION, iv: toB64(iv), ct: toB64(ct) };
  return JSON.stringify(env);
}

/// Open an envelope produced by `seal`. THROWS on a wrong key, tampering, or wrong (chain, owner) —
/// callers must treat a throw as "do not overwrite" so a bad key never clobbers good ciphertext.
export async function open(
  custodyKey: Uint8Array,
  chainId: number,
  owner: string,
  raw: string,
): Promise<StoredNote[]> {
  const env = JSON.parse(raw) as Envelope;
  if (env.v !== ENVELOPE_VERSION || typeof env.iv !== "string" || typeof env.ct !== "string") {
    throw new Error("custody: unrecognized envelope");
  }
  const key = await importKey(custodyKey);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: src(fromB64(env.iv)), additionalData: src(aad(chainId, owner)) },
    key,
    src(fromB64(env.ct)),
  );
  return JSON.parse(new TextDecoder().decode(new Uint8Array(pt))) as StoredNote[];
}

/// True if a raw localStorage value looks like a sealed envelope (vs the legacy plaintext array).
export function isEnvelope(raw: string): boolean {
  const t = raw.trimStart();
  return t.startsWith("{");
}
