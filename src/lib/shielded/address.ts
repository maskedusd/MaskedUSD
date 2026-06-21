// The "MaskedUSD address" — a bech32m string a sender pastes to pay you privately (Stage F spec §2.2).
//
//   musd1<bech32m( version(1B=0x02) || encPub(32B) || spendPub(32B) )>
//
// Carries BOTH public keys a sender needs: the x25519 ENCRYPTION key (to seal the note memo to you)
// and the BN254 SPEND key (Poseidon1(spendPriv); the sender sets it as the output note's owner so only
// your spendPriv can spend what you're paid). The bech32m checksum makes copy/paste + QR safe — a
// single transposed character fails the checksum. The version byte gates future schemes.

import { bech32m } from "@scure/base";

const HRP = "musd";
const VERSION = 0x02;
const LIMIT = 256; // 65-byte payload → ~110-char address; raise the default 90 cap

function toBytes32(x: bigint): Uint8Array {
  if (x < 0n || x >= 1n << 256n) throw new Error("encodeAddress: field element out of 32-byte range");
  const out = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}
function fromBytes32(b: Uint8Array): bigint {
  let x = 0n;
  for (const byte of b) x = (x << 8n) | BigInt(byte);
  return x;
}

export function encodeAddress(encPub: Uint8Array, spendPub: bigint): string {
  if (encPub.length !== 32) throw new Error("encodeAddress: encPub must be 32 bytes");
  const data = new Uint8Array(65);
  data[0] = VERSION;
  data.set(encPub, 1);
  data.set(toBytes32(spendPub), 33);
  return bech32m.encode(HRP, bech32m.toWords(data), LIMIT);
}

export interface DecodedAddress {
  version: number;
  encPub: Uint8Array; // x25519 (32B)
  spendPub: bigint; // BN254 field element
}

export function decodeAddress(addr: string): DecodedAddress {
  const { prefix, words } = bech32m.decode(addr.trim() as `${string}1${string}`, LIMIT);
  if (prefix !== HRP) throw new Error(`decodeAddress: expected '${HRP}…', got '${prefix}…'`);
  const data = bech32m.fromWords(words);
  if (data.length !== 65) throw new Error("decodeAddress: bad payload length");
  if (data[0] !== VERSION) throw new Error(`decodeAddress: unsupported version ${data[0]}`);
  return {
    version: data[0],
    encPub: Uint8Array.from(data.slice(1, 33)),
    spendPub: fromBytes32(Uint8Array.from(data.slice(33, 65))),
  };
}

/// True iff `s` parses as a valid v2 MaskedUSD address (for input validation).
export function isValidAddress(s: string): boolean {
  try {
    decodeAddress(s);
    return true;
  } catch {
    return false;
  }
}
