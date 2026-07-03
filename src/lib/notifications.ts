// Per-wallet notification store. Notifications can carry sensitive detail (e.g. a received amount), so
// — like the shielded note store — they are encrypted at rest (AES-256-GCM under the wallet-derived
// custodyKey), never plaintext. Own AAD domain ("notifs") so a blob can't be swapped with the notes
// blob, and pinned to (chainId, owner). A wrong key throws (caller shows nothing rather than clobber).

export type NotificationKind = "received" | "info";

export interface AppNotification {
  id: string; // stable dedup key, e.g. `recv:<commitment>` — prevents re-notifying the same event
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string; // optional link (e.g. an explorer tx)
  createdAt: number; // unix ms
  read: boolean;
}

const PREFIX = "maskedusd:notifs";
const MAX = 50; // cap the ring so storage can't grow unbounded
const keyOf = (chainId: number, owner: string) => `${PREFIX}:${chainId}:${owner.toLowerCase()}`;

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
const src = (u: Uint8Array): BufferSource => u as BufferSource;
const aad = (chainId: number, owner: string): Uint8Array =>
  new TextEncoder().encode(`maskedusd:notifs:v1:${chainId}:${owner.toLowerCase()}`);

function importKey(custodyKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", src(custodyKey), "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function seal(custodyKey: Uint8Array, chainId: number, owner: string, list: AppNotification[]): Promise<string> {
  const key = await importKey(custodyKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const pt = new TextEncoder().encode(JSON.stringify(list));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: src(aad(chainId, owner)) }, key, src(pt)),
  );
  return JSON.stringify({ v: 1, iv: toB64(iv), ct: toB64(ct) });
}

async function openEnvelope(custodyKey: Uint8Array, chainId: number, owner: string, raw: string): Promise<AppNotification[]> {
  const env = JSON.parse(raw) as { v: number; iv: string; ct: string };
  if (env.v !== 1 || typeof env.iv !== "string" || typeof env.ct !== "string") throw new Error("bad envelope");
  const key = await importKey(custodyKey);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: src(fromB64(env.iv)), additionalData: src(aad(chainId, owner)) },
    key,
    src(fromB64(env.ct)),
  );
  const list = JSON.parse(new TextDecoder().decode(new Uint8Array(pt))) as AppNotification[];
  return Array.isArray(list) ? list : [];
}

/// Decrypt and return this wallet's notifications (newest first). Returns [] when there's no store, but
/// THROWS when a store exists yet won't decrypt (wrong key / tamper / future version) — mirroring the
/// note store, so a caller doing load→modify→save can abort on the throw and never clobber the blob.
export async function loadNotifications(chainId: number, owner: string, custodyKey: Uint8Array): Promise<AppNotification[]> {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(keyOf(chainId, owner));
  if (!raw) return [];
  return openEnvelope(custodyKey, chainId, owner, raw); // throws on wrong key / tamper / version mismatch
}

/// Encrypt and persist (capped to MAX, newest first).
export async function saveNotifications(
  chainId: number,
  owner: string,
  custodyKey: Uint8Array,
  list: AppNotification[],
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyOf(chainId, owner), await seal(custodyKey, chainId, owner, list.slice(0, MAX)));
  } catch {
    /* quota / crypto unavailable — non-fatal */
  }
}
