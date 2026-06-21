// Browser-side shield helpers: generate a note secret, prove the shield circuit.
//
// notes/field are pure (poseidon-lite) and SSR-safe, so they're imported at top.
// prove.ts pulls bb.js (browser-only WASM + worker) — it is LAZY-imported inside
// proveShield so it never enters the SSR/module graph until proving actually runs.

import { FIELD_SIZE } from "./field";
import { commitment as noteCommitment, ownerPubKey } from "./notes";

export interface ShieldNote {
  value: bigint;
  ownerPriv: bigint;
  blinding: bigint;
  assetId: bigint;
  commitment: bigint;
}

/// A uniformly-random canonical BN254 field element (256 random bits reduced mod
/// FIELD_SIZE — negligible modulo bias). Used for the note's spending key + blinding.
export function randomFieldElement(): bigint {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let x = 0n;
  for (const b of bytes) x = (x << 8n) | BigInt(b);
  return x % FIELD_SIZE;
}

/// Build a fresh shielded note for `value` (6-dp base units). The ownerPriv IS the
/// spending authority — it must be persisted or the funds are unrecoverable.
export function createShieldNote(value: bigint, assetId = 0n): ShieldNote {
  const ownerPriv = randomFieldElement();
  const blinding = randomFieldElement();
  const ownerPub = ownerPubKey(ownerPriv);
  const commitment = noteCommitment(value, ownerPub, blinding, assetId);
  return { value, ownerPriv, blinding, assetId, commitment };
}

// fetch + cache the compiled shield ACIR once
let circuitPromise: Promise<unknown> | null = null;
function shieldCircuit(): Promise<unknown> {
  if (!circuitPromise) {
    circuitPromise = fetch("/circuits/shield.json").then((r) => {
      if (!r.ok) throw new Error(`failed to load shield circuit (${r.status})`);
      return r.json();
    });
  }
  return circuitPromise;
}

export interface ShieldProof {
  proof: Uint8Array;
  publicInputs: string[];
}

/// Prove the shield circuit for `note` entirely in-browser (NoirJS witness + bb.js
/// UltraHonk). Returns the proof bytes the on-chain `shield()` consumes. ~5-7s.
export async function proveShield(note: ShieldNote): Promise<ShieldProof> {
  const [{ generateHonkProof }, { toHex32 }] = await Promise.all([
    import("./prove"),
    import("./field"),
  ]);
  const circuit = (await shieldCircuit()) as Parameters<typeof generateHonkProof>[0];
  const ownerPub = ownerPubKey(note.ownerPriv);
  const inputs = {
    commitment: toHex32(note.commitment),
    value: note.value.toString(),
    asset_id: note.assetId.toString(),
    owner_pub: toHex32(ownerPub),
    blinding: note.blinding.toString(),
  };
  return generateHonkProof(circuit, inputs);
}
