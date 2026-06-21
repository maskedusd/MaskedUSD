// Deterministic MaskedUSD identity from ONE wallet signature (Stage F spec §2).
//
// The user signs a fixed, account-bound, NO-nonce domain string once; SHA-512 of the signature seeds
// HKDF branches: an x25519 viewing/encryption keypair (decrypts incoming note memos + is packed into
// the user's MaskedUSD address), an AES-256-GCM custody key (encrypts the at-rest note store), and a
// reserved BN254 spend root (unused in v1). Same account + same message → same identity on any device,
// so it's recoverable from just the wallet — no separate seed.
//
// The signature and every derived key are BEARER SECRETS: cache in memory for the tab session only,
// never persist, and re-derive (fresh user-gesture signature) after disconnect / account change.

import { hexToBytes } from "viem";
import { x25519 } from "@noble/curves/ed25519.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256, sha512 } from "@noble/hashes/sha2.js";
import { FIELD_SIZE } from "./field";

const te = new TextEncoder();
const info = (s: string) => te.encode(s);
const EMPTY = new Uint8Array(0);

export interface Identity {
  encPriv: Uint8Array; // x25519 viewing/decryption key (bearer secret)
  encPub: Uint8Array; // x25519 public — packed into the MaskedUSD address (musd1…)
  custodyKey: Uint8Array; // 32B raw AES-256-GCM key for the at-rest note store
  spendRoot: bigint; // canonical BN254 — RESERVED, unused in v1
}

/// The exact message the user signs. Fixed + account-bound + chain-namespaced + NO nonce/timestamp, so
/// it is byte-reproducible on any device. Never add a nonce — it would make the identity unrecoverable.
export function viewingKeyMessage(address: string, chainId: number): string {
  return [
    "MaskedUSD viewing key",
    "v1",
    `chain:${chainId}`,
    `address:${address.toLowerCase()}`,
    "Do not sign this message on any other site.",
  ].join("\n");
}

/// Reject-and-rehash an HKDF stream into a canonical BN254 element (no modulo bias). Reserved for v1.
function fieldFromSeed(seed: Uint8Array, label: string): bigint {
  for (let i = 0; i < 256; i++) {
    const out = hkdf(sha256, seed, EMPTY, info(`${label}/${i}`), 32);
    let x = 0n;
    for (const b of out) x = (x << 8n) | BigInt(b);
    if (x < FIELD_SIZE) return x;
  }
  throw new Error("fieldFromSeed: exhausted (unreachable)");
}

/// Derive the identity from a 65-byte secp256k1 signature (hex from personal_sign).
export function deriveIdentity(signatureHex: `0x${string}` | string): Identity {
  const hex = (signatureHex.startsWith("0x") ? signatureHex : `0x${signatureHex}`) as `0x${string}`;
  const rootSecret = sha512(hexToBytes(hex)); // 64-byte seed
  const encPriv = hkdf(sha256, rootSecret, EMPTY, info("maskedusd/v1/enc"), 32);
  const encPub = x25519.getPublicKey(encPriv);
  const custodyKey = hkdf(sha256, rootSecret, EMPTY, info("maskedusd/v1/custody-aes"), 32);
  const spendRoot = fieldFromSeed(rootSecret, "maskedusd/v1/spend");
  return { encPriv, encPub, custodyKey, spendRoot };
}
