// The "MaskedUSD address" — a bech32m string a sender pastes to pay you privately (Stage F spec §2.2).
//
//   musd1<bech32m( version(1B=0x01) || encPub(32B) )>
//
// Carries ONLY the x25519 encryption pubkey (all a sender needs). bech32m checksum makes copy/paste +
// QR safe — a single transposed character fails the checksum. The version byte gates future schemes.

import { bech32m } from "@scure/base";

const HRP = "musd";
const VERSION = 0x01;
const LIMIT = 200; // 33-byte payload → ~60-char address; well under, but raise the default 90 cap

export function encodeAddress(encPub: Uint8Array): string {
  if (encPub.length !== 32) throw new Error("encodeAddress: encPub must be 32 bytes");
  const data = new Uint8Array(33);
  data[0] = VERSION;
  data.set(encPub, 1);
  return bech32m.encode(HRP, bech32m.toWords(data), LIMIT);
}

export interface DecodedAddress {
  version: number;
  encPub: Uint8Array;
}

export function decodeAddress(addr: string): DecodedAddress {
  const { prefix, words } = bech32m.decode(addr.trim() as `${string}1${string}`, LIMIT);
  if (prefix !== HRP) throw new Error(`decodeAddress: expected '${HRP}…', got '${prefix}…'`);
  const data = bech32m.fromWords(words);
  if (data.length !== 33) throw new Error("decodeAddress: bad payload length");
  if (data[0] !== VERSION) throw new Error(`decodeAddress: unsupported version ${data[0]}`);
  return { version: data[0], encPub: Uint8Array.from(data.slice(1)) };
}

/// True iff `s` parses as a valid v1 MaskedUSD address (for input validation).
export function isValidAddress(s: string): boolean {
  try {
    decodeAddress(s);
    return true;
  } catch {
    return false;
  }
}
