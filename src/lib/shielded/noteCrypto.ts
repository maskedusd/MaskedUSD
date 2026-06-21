// Encrypt a shielded-note secret to a recipient's MaskedUSD address (Stage F spec §4).
//
// Ephemeral-static x25519 ECIES + XChaCha20-Poly1305 AEAD + HKDF-SHA256, with a 1-byte blake2s
// view-tag so a recipient skips ~255/256 foreign memos with a cheap compare before trial-decrypting.
// The AEAD's AAD binds the ciphertext to its output commitment (anti-replay / anti-graft). The sender's
// ephemeral key is FRESH per note (unlinkability). The recipient learns the full note tuple — including
// `ownerPriv` (its spend authority) — and nothing about the sender.
//
// Wire: version(1) || viewTag(1) || ephPub(32) || nonce(24) || aeadCtAndTag(N)
// Payload: value(16) || blinding(32) || assetId(32) = 80 bytes
//          The recipient OWNS the note via their own spendPriv (the sender set the note's owner to the
//          recipient's spendPub), so ownerPriv is NOT transmitted — the recipient reconstructs the
//          commitment with H(value, Poseidon1(spendPriv), blinding, assetId) and matches it against the
//          pool's PrivateTransfer event to recover the leaf index.

import { x25519 } from "@noble/curves/ed25519.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { blake2s } from "@noble/hashes/blake2.js";
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";

const VERSION = 0x01;
const INFO = new TextEncoder().encode("MaskedUSD-note-v1");
const EPH_OFF = 2;
const NONCE_OFF = 34;
const CT_OFF = 58;

export interface NotePayload {
  value: bigint;
  blinding: bigint;
  assetId: bigint;
}

function writeUint(out: Uint8Array, off: number, len: number, x: bigint): void {
  for (let i = len - 1; i >= 0; i--) {
    out[off + i] = Number(x & 0xffn);
    x >>= 8n;
  }
}
function readUint(b: Uint8Array, off: number, len: number): bigint {
  let x = 0n;
  for (let i = 0; i < len; i++) x = (x << 8n) | BigInt(b[off + i]);
  return x;
}

function encodePayload(p: NotePayload): Uint8Array {
  const out = new Uint8Array(80);
  writeUint(out, 0, 16, p.value); // 128-bit value
  writeUint(out, 16, 32, p.blinding);
  writeUint(out, 48, 32, p.assetId);
  return out;
}
function decodePayload(b: Uint8Array): NotePayload {
  return {
    value: readUint(b, 0, 16),
    blinding: readUint(b, 16, 32),
    assetId: readUint(b, 48, 32),
  };
}

// AAD = version(1) || commitment(32) — binds the memo to exactly one output commitment.
function aad(commitment: bigint): Uint8Array {
  const a = new Uint8Array(33);
  a[0] = VERSION;
  writeUint(a, 1, 32, commitment);
  return a;
}

/// Encrypt `payload` to `recipientEncPub` (from their decoded MaskedUSD address), bound to `commitment`.
export function encryptNote(
  recipientEncPub: Uint8Array,
  payload: NotePayload,
  commitment: bigint,
): Uint8Array {
  const ephPriv = x25519.utils.randomSecretKey();
  const ephPub = x25519.getPublicKey(ephPriv);
  const shared = x25519.getSharedSecret(ephPriv, recipientEncPub);
  const viewTag = blake2s(shared, { dkLen: 1 })[0];
  const key = hkdf(sha256, shared, ephPub, INFO, 32); // salt = ephPub
  const nonce = crypto.getRandomValues(new Uint8Array(24));
  const ct = xchacha20poly1305(key, nonce, aad(commitment)).encrypt(encodePayload(payload));

  const wire = new Uint8Array(CT_OFF + ct.length);
  wire[0] = VERSION;
  wire[1] = viewTag;
  wire.set(ephPub, EPH_OFF);
  wire.set(nonce, NONCE_OFF);
  wire.set(ct, CT_OFF);
  return wire;
}

/// Try to decrypt `wire` (a NoteMemo ciphertext) with our viewing key, bound to `commitment`. Returns
/// the note payload if it's ours, or null (cheap view-tag miss, or AEAD auth fail = not ours/tampered).
export function tryDecryptNote(
  encPriv: Uint8Array,
  wire: Uint8Array,
  commitment: bigint,
): NotePayload | null {
  if (wire.length <= CT_OFF || wire[0] !== VERSION) return null;
  const viewTag = wire[1];
  const ephPub = wire.slice(EPH_OFF, NONCE_OFF);
  const nonce = wire.slice(NONCE_OFF, CT_OFF);
  const ct = wire.slice(CT_OFF);

  const shared = x25519.getSharedSecret(encPriv, ephPub);
  if (blake2s(shared, { dkLen: 1 })[0] !== viewTag) return null; // fast reject ~255/256
  const key = hkdf(sha256, shared, ephPub, INFO, 32);
  try {
    return decodePayload(xchacha20poly1305(key, nonce, aad(commitment)).decrypt(ct));
  } catch {
    return null; // AEAD auth failed
  }
}
