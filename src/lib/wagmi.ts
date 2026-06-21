import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";

// MaskedUSD launches on Base; Base Sepolia is the testnet target until mainnet contracts ship.
// Sepolia first in the list = the default chain the dApp prompts for while we're pre-mainnet.
//
// Exactly three connectors — MetaMask, Coinbase Wallet, Phantom — with EIP-6963 auto-discovery off
// so the connect modal shows only these (not every injected provider the browser happens to expose).
export const config = createConfig({
  chains: [baseSepolia, base],
  multiInjectedProviderDiscovery: false,
  connectors: [
    injected({ target: "metaMask" }),
    coinbaseWallet({ appName: "MaskedUSD", preference: "all" }),
    injected({ target: "phantom" }),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
