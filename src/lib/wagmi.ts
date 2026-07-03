import { createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { transports } from "./rpc";

// MaskedUSD is live on Base mainnet (contracts deployed 2026-06-29); Base Sepolia stays wired as
// the testnet. Base first in the list = the default chain the dApp prompts for.
//
// Exactly three connectors — MetaMask, Coinbase Wallet, Phantom — with EIP-6963 auto-discovery off
// so the connect modal shows only these (not every injected provider the browser happens to expose).
export const config = createConfig({
  chains: [base, baseSepolia],
  multiInjectedProviderDiscovery: false,
  connectors: [
    injected({ target: "metaMask" }),
    coinbaseWallet({ appName: "MaskedUSD", preference: "all" }),
    injected({ target: "phantom" }),
  ],
  transports,
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
