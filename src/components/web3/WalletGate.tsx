"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAccount } from "wagmi";
import WalletConnectModal from "./WalletConnectModal";

/// Gates the dashboard behind a wallet connection: until connected, the whole page is blurred +
/// non-interactive and a connect modal sits on top. Connected → renders the dashboard normally.
///
/// wagmi (ssr:true) reports disconnected on the server + first client paint, then reconnects async —
/// so the blur (no overlay) is rendered identically on both to avoid hydration mismatch; the overlay
/// only appears after mount.
export default function WalletGate({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const gated = !mounted || !isConnected;

  return (
    <div className="relative">
      <div className={gated ? "pointer-events-none select-none blur-[6px]" : ""} aria-hidden={gated}>
        {children}
      </div>

      {mounted && !isConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/50 p-4 backdrop-blur-sm">
          <WalletConnectModal />
        </div>
      )}
    </div>
  );
}
