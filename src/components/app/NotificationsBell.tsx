"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, Inbox } from "lucide-react";
import { useNotifications } from "@/components/web3/NotificationsProvider";

/// Header notifications bell: a red dot + count when there are unread items, and a dropdown that lists
/// them. Opening marks everything read (so the dot clears). Times render relative. Notifications live
/// only after the wallet is unlocked (they're encrypted per wallet), so this is quietly empty until then.

function relativeTime(ms: number): string {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export default function NotificationsBell() {
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    setOpen((v) => {
      const next = !v;
      if (next && unreadCount > 0) markAllRead(); // opening clears the unread badge
      return next;
    });
  }

  return (
    // Not a positioning context itself — the dropdown anchors to the header's right cluster (marked
    // `relative` in AppHeader) so it opens flush with the right edge, under the wallet button, instead
    // of spilling left from the bell. The ref still wraps button + panel for outside-click detection.
    <div ref={ref} className="flex">
      <button
        type="button"
        onClick={toggle}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[0.6rem] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="glass absolute right-0 top-full z-50 mt-2 w-[320px] origin-top-right overflow-hidden rounded-2xl shadow-[0_18px_50px_-22px_rgba(27,20,56,0.4)]">
          <div className="flex items-center justify-between border-b border-ink/[0.06] px-4 py-2.5">
            <p className="text-[0.82rem] font-semibold text-ink">Notifications</p>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[0.72rem] font-medium text-ink-dim transition-colors hover:text-ink"
              >
                Clear all
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <Inbox className="h-6 w-6 text-ink-dim" aria-hidden="true" />
              <p className="text-[0.8rem] text-ink-muted">You&apos;re all caught up.</p>
              <p className="text-[0.7rem] text-ink-dim">
                Received payments and updates show up here.
              </p>
            </div>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="border-b border-ink/[0.04] px-4 py-3 last:border-0">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        n.kind === "received" ? "bg-accent-soft text-accent-deep" : "bg-ink/[0.06] text-ink-muted"
                      }`}
                    >
                      <Check size={13} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.82rem] font-medium leading-snug text-ink">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-[0.74rem] leading-snug text-ink-muted">{n.body}</p>}
                      <p className="mt-1 text-[0.66rem] text-ink-dim">{relativeTime(n.createdAt)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
