// Local persistence for shielded notes. The note's ownerPriv + blinding ARE the
// spending authority — without them the shielded funds are unrecoverable — so they
// must survive reloads. Stored per (chainId, owner) in localStorage.
//
// Notes are ENCRYPTED AT REST (AES-256-GCM under the wallet-derived `custodyKey`; see
// custody.ts + identity.ts). Every read/write takes the custodyKey, so the dashboard must
// be "unlocked" (one wallet signature) before the shielded store is usable. A wrong key
// makes reads THROW (never silently return empty), so a bad key can't clobber good notes.

import type { ShieldNote } from "./client";
import type { DiscoveredNote } from "./discovery";
import { isEnvelope, open, seal } from "./custody";

export type NoteStatus = "shielding" | "shielded" | "spent";

export interface StoredNote {
  value: string; // decimal base units
  ownerPriv: string; // decimal
  blinding: string; // decimal
  assetId: string; // decimal
  commitment: string; // 0x hex
  status: NoteStatus;
  received?: boolean; // true if discovered via a NoteMemo (paid to us), vs self-shielded
  txHash?: string;
  leafIndex?: number;
  createdAt: number;
}

/// Convert a discovered (received) note into a stored, spendable note.
export function discoveredToStored(d: DiscoveredNote): StoredNote {
  return {
    value: d.value.toString(),
    ownerPriv: d.ownerPriv.toString(),
    blinding: d.blinding.toString(),
    assetId: d.assetId.toString(),
    commitment: `0x${d.commitment.toString(16).padStart(64, "0")}`,
    status: "shielded",
    received: true,
    leafIndex: d.leafIndex,
    createdAt: Date.now(),
  };
}

const PREFIX = "maskedusd:notes";
const key = (chainId: number, owner: string) => `${PREFIX}:${chainId}:${owner.toLowerCase()}`;

export function toStored(note: ShieldNote, extra: Partial<StoredNote> = {}): StoredNote {
  return {
    value: note.value.toString(),
    ownerPriv: note.ownerPriv.toString(),
    blinding: note.blinding.toString(),
    assetId: note.assetId.toString(),
    commitment: `0x${note.commitment.toString(16).padStart(64, "0")}`,
    status: "shielding",
    createdAt: Date.now(),
    ...extra,
  };
}

/// Best-effort migration of a legacy plaintext array to a sealed envelope. Round-trips the freshly
/// sealed blob and byte-compares it to the originals BEFORE overwriting — so if anything is off we
/// leave the plaintext untouched (and retry next load) rather than ever dropping a note.
async function migrateLegacy(
  chainId: number,
  owner: string,
  custodyKey: Uint8Array,
  notes: StoredNote[],
): Promise<void> {
  try {
    const envelope = await seal(custodyKey, chainId, owner, notes);
    const roundTrip = await open(custodyKey, chainId, owner, envelope);
    if (JSON.stringify(roundTrip) !== JSON.stringify(notes)) return; // verify failed — keep legacy
    window.localStorage.setItem(key(chainId, owner), envelope);
  } catch {
    /* keep the legacy plaintext intact; notes were already returned to the caller */
  }
}

/// Decrypt and return the notes for (chainId, owner). Empty store → []. A sealed blob that won't open
/// with `custodyKey` THROWS (caller must not overwrite). Legacy plaintext is read and transparently
/// upgraded to a sealed envelope.
export async function loadNotes(
  chainId: number,
  owner: string,
  custodyKey: Uint8Array,
): Promise<StoredNote[]> {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key(chainId, owner));
  if (!raw) return [];
  if (isEnvelope(raw)) {
    return open(custodyKey, chainId, owner, raw); // throws on wrong key / tamper — intentional
  }
  // legacy plaintext array
  const notes = JSON.parse(raw) as StoredNote[];
  await migrateLegacy(chainId, owner, custodyKey, notes);
  return notes;
}

async function writeNotes(
  chainId: number,
  owner: string,
  custodyKey: Uint8Array,
  notes: StoredNote[],
): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(chainId, owner), await seal(custodyKey, chainId, owner, notes));
}

/// Append a note (de-duped by commitment) and return the full list. If the existing store can't be
/// decrypted, loadNotes throws and we never write — so a key mismatch can't erase prior notes.
export async function addNote(
  chainId: number,
  owner: string,
  custodyKey: Uint8Array,
  note: StoredNote,
): Promise<StoredNote[]> {
  const notes = (await loadNotes(chainId, owner, custodyKey)).filter(
    (n) => n.commitment !== note.commitment,
  );
  notes.push(note);
  await writeNotes(chainId, owner, custodyKey, notes);
  return notes;
}

/// Remove the note with `commitment` and return the full list. Used to purge a phantom note left by
/// a shield that never landed on-chain (reverted / rejected), so it can't inflate the balance.
export async function removeNote(
  chainId: number,
  owner: string,
  custodyKey: Uint8Array,
  commitment: string,
): Promise<StoredNote[]> {
  const notes = (await loadNotes(chainId, owner, custodyKey)).filter((n) => n.commitment !== commitment);
  await writeNotes(chainId, owner, custodyKey, notes);
  return notes;
}

/// Patch the note with `commitment` and return the full list.
export async function updateNote(
  chainId: number,
  owner: string,
  custodyKey: Uint8Array,
  commitment: string,
  patch: Partial<StoredNote>,
): Promise<StoredNote[]> {
  const notes = (await loadNotes(chainId, owner, custodyKey)).map((n) =>
    n.commitment === commitment ? { ...n, ...patch } : n,
  );
  await writeNotes(chainId, owner, custodyKey, notes);
  return notes;
}
