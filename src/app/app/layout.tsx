import type { Metadata } from "next";
import Web3Provider from "@/components/web3/Web3Provider";

export const metadata: Metadata = {
  title: "MaskedUSD — App",
  description: "Mint and redeem USDM 1:1 against USDC, and shield it privately on Base.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}
