"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MaskIcon from "@/components/MaskIcon";
import ConnectButton from "@/components/web3/ConnectButton";
import NotificationsBell from "@/components/app/NotificationsBell";

/**
 * AppHeader — the shared dApp header: logo, center nav (Dashboard / History / $MASKED), wallet
 * control. $MASKED is greyed out (not yet live) — a label, not a link, so nothing dead to click.
 */

const NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/history", label: "History" },
] as const;

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="glass sticky top-0 z-40 border-b border-ink/5">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
        <a href="/" className="flex shrink-0 items-center gap-2">
          <MaskIcon width={26} className="shrink-0" />
          <span className="hidden font-display text-[1.05rem] font-semibold tracking-tight sm:inline">
            MaskedUSD
          </span>
        </a>

        <nav className="flex items-center gap-1" aria-label="App">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-[0.82rem] font-medium transition-colors ${
                  active
                    ? "bg-accent-soft text-accent-deep"
                    : "text-ink-muted hover:bg-ink/[0.05] hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <span
            aria-disabled="true"
            title="Coming soon"
            className="cursor-not-allowed select-none rounded-full px-3 py-1.5 text-[0.82rem] font-medium text-ink-dim/60"
          >
            $MASKED
          </span>
        </nav>

        <div className="flex items-center gap-1.5">
          <NotificationsBell />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
