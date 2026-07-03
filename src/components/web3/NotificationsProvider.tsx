"use client";

// App-wide notification store. Received payments are discovered asynchronously (the shielded panel's
// background scan), so the user needs a persistent signal they can see later — that's this. Encrypted
// at rest per wallet (see lib/notifications). All mutations are serialized through one promise chain
// and read fresh from storage, so a notify() that fires before the initial load can never clobber the
// persisted list (the race that would otherwise drop notifications).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAccount, useChainId } from "wagmi";
import { useIdentity } from "./IdentityProvider";
import { loadNotifications, saveNotifications, type AppNotification, type NotificationKind } from "@/lib/notifications";

interface NotifyInput {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
}

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  notify: (n: NotifyInput) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const Ctx = createContext<NotificationsState | null>(null);

export function useNotifications(): NotificationsState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useNotifications must be used within NotificationsProvider");
  return c;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { identity } = useIdentity();
  const custodyKey = identity?.custodyKey;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // The account this provider's in-memory state currently belongs to. An async load/mutate that was
  // started for account A must NEVER setState after the user has switched to account B (that would
  // surface A's private notifications — amounts included — under B's session). Every setNotifications
  // is gated on this matching the value captured when the work began.
  const bindingRef = useRef<string | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const bindingOf = (owner: string) => `${chainId}:${owner.toLowerCase()}`;

  // Load (decrypt) when the wallet unlocks / the account changes. Locked or disconnected → nothing.
  useEffect(() => {
    const binding = address && custodyKey ? bindingOf(address) : null;
    bindingRef.current = binding;
    chainRef.current = Promise.resolve(); // new account → fresh mutation queue (don't queue behind the old one)
    let stale = false;
    (async () => {
      if (!address || !custodyKey) {
        setNotifications([]);
        return;
      }
      try {
        const list = await loadNotifications(chainId, address, custodyKey);
        if (!stale) setNotifications(list);
      } catch {
        // present-but-undecryptable (tamper/corruption/version) — show nothing; the blob is left intact.
        if (!stale) setNotifications([]);
      }
    })();
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId, custodyKey]);

  // Serialize every storage mutation, and always read the latest persisted list first, so concurrent
  // notify()/markAllRead() calls (or one landing before the initial load) can't lose data. Writes go to
  // the CAPTURED account's slot; setState only runs if that account is still active (cross-account guard).
  const mutate = useCallback(
    (fn: (current: AppNotification[]) => AppNotification[] | null) => {
      if (!address || !custodyKey) return;
      const owner = address;
      const key = custodyKey;
      const myBinding = bindingOf(owner);
      chainRef.current = chainRef.current
        .then(async () => {
          const current = await loadNotifications(chainId, owner, key); // throws if undecryptable → catch below, no clobber
          const next = fn(current);
          if (!next) return; // no-op (e.g. duplicate)
          await saveNotifications(chainId, owner, key, next);
          if (bindingRef.current === myBinding) setNotifications(next); // skip if the account switched mid-flight
        })
        .catch(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [address, chainId, custodyKey],
  );

  const notify = useCallback(
    (n: NotifyInput) => {
      mutate((current) => {
        if (current.some((x) => x.id === n.id)) return null; // dedup by stable id
        return [{ ...n, createdAt: Date.now(), read: false }, ...current].slice(0, 50);
      });
    },
    [mutate],
  );

  const markAllRead = useCallback(() => {
    mutate((current) => (current.every((x) => x.read) ? null : current.map((x) => ({ ...x, read: true }))));
  }, [mutate]);

  const clearAll = useCallback(() => {
    mutate(() => []);
  }, [mutate]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({ notifications, unreadCount, notify, markAllRead, clearAll }),
    [notifications, unreadCount, notify, markAllRead, clearAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
