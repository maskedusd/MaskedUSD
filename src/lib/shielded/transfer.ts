// Browser-side private transfer — the 2-in/2-out JoinSplit (Stage F).
//
// The deployed transfer circuit has NO dummy-input path: both inputs must be real, unspent notes that
// are members of the tree at the proven root. So a transfer spends exactly TWO of the sender's notes
// and creates TWO outputs: one owned by the RECIPIENT (the sender sets its owner to the recipient's
// spendPub from their MaskedUSD address — only the recipient's spendPriv can spend it) and one CHANGE
// note owned by the sender. The recipient's note secret is delivered via an encrypted NoteMemo
// (noteCrypto + discovery). prove.ts (bb.js WASM) is lazy-imported so it never enters the SSR graph.

import type { PoolIndexer, LocatedNote } from "./indexer";
import { commitment as noteCommitment, ownerPubKey } from "./notes";
import { randomFieldElement } from "./client";

const ASSET_ID = 0n;
const MAX_NOTE_VALUE = 1n << 128n;

let circuitPromise: Promise<unknown> | null = null;
function transferCircuit(): Promise<unknown> {
  if (!circuitPromise) {
    circuitPromise = fetch("/circuits/transfer.json").then((r) => {
      if (!r.ok) throw new Error(`failed to load transfer circuit (${r.status})`);
      return r.json();
    });
  }
  return circuitPromise;
}

/// Pick exactly two spendable notes whose combined value covers `need` (amount + fee). Greedy on the
/// two largest — if ANY 2-note subset covers `need`, the two largest do. Returns null if none can.
export function selectTwoInputs(
  spendable: LocatedNote[],
  need: bigint,
): [LocatedNote, LocatedNote] | null {
  if (spendable.length < 2) return null;
  const sorted = spendable
    .slice()
    .sort((a, b) => (a.note.value < b.note.value ? 1 : a.note.value > b.note.value ? -1 : 0));
  const pair: [LocatedNote, LocatedNote] = [sorted[0], sorted[1]];
  return pair[0].note.value + pair[1].note.value >= need ? pair : null;
}

export interface TransferOutputPlan {
  recipient: { value: bigint; ownerPub: bigint; blinding: bigint; commitment: bigint };
  change: { value: bigint; ownerPriv: bigint; blinding: bigint; commitment: bigint };
}

/// Build the two output notes: `amount` to `recipientSpendPub`, the rest as change to a fresh
/// sender-owned key. Blindings are fresh canonical field elements. Conservation (inSum == out + fee)
/// holds by construction (change = inSum - amount - fee).
export function buildOutputs(
  inSum: bigint,
  amount: bigint,
  fee: bigint,
  recipientSpendPub: bigint,
): TransferOutputPlan {
  if (amount <= 0n || amount >= MAX_NOTE_VALUE) throw new Error("amount out of range");
  const change = inSum - amount - fee;
  if (change < 0n) throw new Error("inputs do not cover amount + fee");

  const rBlind = randomFieldElement();
  const recipientCommitment = noteCommitment(amount, recipientSpendPub, rBlind, ASSET_ID);

  const changeOwnerPriv = randomFieldElement();
  const cBlind = randomFieldElement();
  const changeCommitment = noteCommitment(change, ownerPubKey(changeOwnerPriv), cBlind, ASSET_ID);

  return {
    recipient: { value: amount, ownerPub: recipientSpendPub, blinding: rBlind, commitment: recipientCommitment },
    change: { value: change, ownerPriv: changeOwnerPriv, blinding: cBlind, commitment: changeCommitment },
  };
}

export interface TransferProof {
  proof: Uint8Array;
  root: bigint;
  nullifiers: [bigint, bigint];
  outCommitments: [bigint, bigint]; // [recipient, change] — same order as the circuit's out_commitments
}

/// Prove the transfer circuit in-browser for two located+unspent `inputs` and an output `plan`
/// (recipient first, change second). ~10s. The returned values feed the on-chain `transfer()` call.
export async function proveTransfer(
  ix: PoolIndexer,
  inputs: [LocatedNote, LocatedNote],
  plan: TransferOutputPlan,
  fee: bigint,
  feeRecipient: `0x${string}`,
): Promise<TransferProof> {
  const [{ generateHonkProof }, { toHex32 }] = await Promise.all([import("./prove"), import("./field")]);
  const circuit = (await transferCircuit()) as Parameters<typeof generateHonkProof>[0];

  const w0 = ix.witness(inputs[0].leafIndex);
  const w1 = ix.witness(inputs[1].leafIndex);
  const root = w0.root;
  if (w1.root !== root) throw new Error("input witnesses disagree on root");

  const nullifiers: [bigint, bigint] = [inputs[0].nullifier, inputs[1].nullifier];
  const outCommitments: [bigint, bigint] = [plan.recipient.commitment, plan.change.commitment];

  const witness = {
    merkle_root_pub: toHex32(root),
    nullifiers: nullifiers.map(toHex32),
    out_commitments: outCommitments.map(toHex32),
    fee: toHex32(fee),
    fee_recipient: toHex32(BigInt(feeRecipient)),
    asset_id: toHex32(ASSET_ID),
    in_values: [inputs[0].note.value, inputs[1].note.value].map(toHex32),
    owner_privs: [inputs[0].note.ownerPriv, inputs[1].note.ownerPriv].map(toHex32),
    in_blindings: [inputs[0].note.blinding, inputs[1].note.blinding].map(toHex32),
    leaf_indices: [BigInt(inputs[0].leafIndex), BigInt(inputs[1].leafIndex)].map(toHex32),
    paths: [w0.path.map(toHex32), w1.path.map(toHex32)],
    out_values: [plan.recipient.value, plan.change.value].map(toHex32),
    recipient_pubs: [plan.recipient.ownerPub, ownerPubKey(plan.change.ownerPriv)].map(toHex32),
    out_blindings: [plan.recipient.blinding, plan.change.blinding].map(toHex32),
  };

  const { proof } = await generateHonkProof(circuit, witness);
  return { proof, root, nullifiers, outCommitments };
}
