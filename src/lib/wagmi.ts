import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";

// MaskedUSD launches on Base; Base Sepolia is the testnet target until mainnet contracts ship.
// Sepolia first in the list = the default chain the dApp prompts for while we're pre-mainnet.
export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "MaskedUSD", preference: "all" }),
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
