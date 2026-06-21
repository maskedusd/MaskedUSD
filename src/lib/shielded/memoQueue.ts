// A small durable queue of note memos awaiting on-chain posting (Stage F, C3).
//
// The transfer and the memo are DECOUPLED: the value transfer settles on-chain on its own, then the
// sender posts the recipient's encrypted note secret to NoteMemo as a SEPARATE tx. If that post fails
// (reject, gas, reload), the payment is already final but the recipient can't auto-discover the note —
// so we persist the pending memo and let the sender re-post until it lands. Safe to store in plaintext:
// the ciphertext is already encrypted to the recipient and the commitment is public on-chain.

const PREFIX = "maskedusd:pendingmemos";
const key = (chainId: number, owner: string) => `${PREFIX}:${chainId}:${owner.toLowerCase()}`;

export interface PendingMemo {
  commitment: string; // 0x hex (the recipient output commitment; NoteMemo's indexed key)
  ciphertext: string; // 0x hex (the encrypted note wire)
  createdAt: number;
}

export function loadPendingMemos(chainId: number, owner: string): PendingMemo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(chainId, owner));
    return raw ? (JSON.parse(raw) as PendingMemo[]) : [];
  } catch {
    return [];
  }
}

function write(chainId: number, owner: string, memos: PendingMemo[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(chainId, owner), JSON.stringify(memos));
}

export function addPendingMemo(
  chainId: number,
  owner: string,
  memo: Omit<PendingMemo, "createdAt">,
): PendingMemo[] {
  const memos = loadPendingMemos(chainId, owner).filter((m) => m.commitment !== memo.commitment);
  memos.push({ ...memo, createdAt: Date.now() });
  write(chainId, owner, memos);
  return memos;
}

export function removePendingMemo(chainId: number, owner: string, commitment: string): PendingMemo[] {
  const memos = loadPendingMemos(chainId, owner).filter((m) => m.commitment !== commitment);
  write(chainId, owner, memos);
  return memos;
}
