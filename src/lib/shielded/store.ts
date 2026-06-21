// Local persistence for shielded notes. The note's ownerPriv + blinding ARE the
// spending authority — without them the shielded funds are unrecoverable — so they
// must survive reloads. Stored per (chainId, owner) in localStorage as decimal/hex
// strings (JSON can't carry bigint).
//
// TESTNET NOTE: this is plaintext localStorage. Before any real-value (mainnet)
// flow this must become encrypted-at-rest (wallet-signature- or passkey-derived
// key) — see the shielded-flow plan. Fine for the unaudited Base Sepolia preview.

import type { ShieldNote } from "./client";

export type NoteStatus = "shielding" | "shielded" | "spent";

export interface StoredNote {
  value: string; // decimal base units
  ownerPriv: string; // decimal
  blinding: string; // decimal
  assetId: string; // decimal
  commitment: string; // 0x hex
  status: NoteStatus;
  txHash?: string;
  leafIndex?: number;
  createdAt: number;
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

export function loadNotes(chainId: number, owner: string): StoredNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(chainId, owner));
    return raw ? (JSON.parse(raw) as StoredNote[]) : [];
  } catch {
    return [];
  }
}

function writeNotes(chainId: number, owner: string, notes: StoredNote[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(chainId, owner), JSON.stringify(notes));
}

/// Append a note (de-duped by commitment) and return the full list.
export function addNote(chainId: number, owner: string, note: StoredNote): StoredNote[] {
  const notes = loadNotes(chainId, owner).filter((n) => n.commitment !== note.commitment);
  notes.push(note);
  writeNotes(chainId, owner, notes);
  return notes;
}

/// Patch the note with `commitment` and return the full list.
export function updateNote(
  chainId: number,
  owner: string,
  commitment: string,
  patch: Partial<StoredNote>,
): StoredNote[] {
  const notes = loadNotes(chainId, owner).map((n) =>
    n.commitment === commitment ? { ...n, ...patch } : n,
  );
  writeNotes(chainId, owner, notes);
  return notes;
}
