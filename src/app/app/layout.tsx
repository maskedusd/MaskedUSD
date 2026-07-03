import type { Metadata } from "next";
import Web3Provider from "@/components/web3/Web3Provider";
import { ToastProvider } from "@/components/web3/Toaster";
import { IdentityProvider } from "@/components/web3/IdentityProvider";

export const metadata: Metadata = {
  // The root layout's template prefixes "MaskedUSD // " onto this segment's default; re-declaring
  // the same template here keeps the prefix for nested pages (/app/history), which would otherwise
  // lose the root template when this layout sets a title of its own.
  title: {
    default: "Dashboard",
    template: "MaskedUSD // %s",
  },
  description: "Mint and redeem USDM 1:1 against USDC, and shield it privately on Base.",
  openGraph: {
    title: "MaskedUSD // Dashboard",
    description: "Mint and redeem USDM 1:1 against USDC, and shield it privately on Base.",
    type: "website",
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <ToastProvider>
        <IdentityProvider>{children}</IdentityProvider>
      </ToastProvider>
    </Web3Provider>
  );
}
