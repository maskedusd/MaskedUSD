"use client";

// Holds the user's MaskedUSD identity for the tab session (Stage F spec §2). One wallet signature over
// a fixed, account-bound message derives a viewing key (decrypts incoming notes + forms the musd1…
// address) and a custody key (encrypts the at-rest note store). The identity is a BEARER SECRET: kept
// in memory only, never persisted, and dropped the instant the account or chain changes (or disconnect).

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
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { deriveIdentity, viewingKeyMessage, type Identity } from "@/lib/shielded/identity";

interface IdentityState {
  identity: Identity | null; // null = locked
  locked: boolean;
  unlocking: boolean;
  error: string | null;
  unlock: () => Promise<void>;
  lock: () => void;
}

const IdentityContext = createContext<IdentityState | null>(null);

// Tag an identity with the exact (chainId, address) it was derived for, so we never expose it for the
// wrong account — not even for a single render between an account switch and the auto-lock effect.
const bindingOf = (chainId: number, address?: string) =>
  address ? `${chainId}:${address.toLowerCase()}` : null;

export function IdentityProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  // The identity is stored WITH the binding it was derived for, so the render-time guard reads only
  // state (never a ref). `boundRef` mirrors that binding for the auto-lock effect's change detection
  // (reading a ref inside an effect is fine; reading one during render is not).
  const [session, setSession] = useState<{ identity: Identity; boundTo: string } | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boundRef = useRef<string | null>(null);

  const binding = bindingOf(chainId, address);

  // Auto-lock when the account/chain changes or disconnects — drop the now-foreign bearer secret.
  useEffect(() => {
    if (boundRef.current && boundRef.current !== binding) {
      boundRef.current = null;
      setSession(null);
      setError(null);
      setUnlocking(false);
    }
  }, [binding]);

  const unlock = useCallback(async () => {
    if (!address) {
      setError("Connect a wallet first.");
      return;
    }
    setUnlocking(true);
    setError(null);
    try {
      const signature = await signMessageAsync({ message: viewingKeyMessage(address, chainId) });
      const boundTo = bindingOf(chainId, address)!;
      boundRef.current = boundTo;
      setSession({ identity: deriveIdentity(signature), boundTo });
    } catch (e) {
      const msg = (e as { shortMessage?: string })?.shortMessage ?? "Signature request was rejected.";
      setError(/reject|denied|cancel/i.test(msg) ? "Signature rejected — keys stay locked." : msg);
    } finally {
      setUnlocking(false);
    }
  }, [address, chainId, signMessageAsync]);

  const lock = useCallback(() => {
    boundRef.current = null;
    setSession(null);
    setError(null);
  }, []);

  // Only expose the identity if it still matches the connected account/chain (render-time guard).
  const valid = session && session.boundTo === binding ? session.identity : null;

  const value = useMemo<IdentityState>(
    () => ({ identity: valid, locked: !valid, unlocking, error, unlock, lock }),
    [valid, unlocking, error, unlock, lock],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityState {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within <IdentityProvider>");
  return ctx;
}
