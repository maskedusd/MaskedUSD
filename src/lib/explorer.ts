import { base, baseSepolia } from "wagmi/chains";

const EXPLORERS: Record<number, string> = {
  [base.id]: "https://basescan.org",
  [baseSepolia.id]: "https://sepolia.basescan.org",
};

export function explorerTxUrl(chainId: number | undefined, hash: string | undefined): string | undefined {
  if (!chainId || !hash) return undefined;
  const base = EXPLORERS[chainId];
  return base ? `${base}/tx/${hash}` : undefined;
}

export function explorerAddressUrl(chainId: number | undefined, address: string | undefined): string | undefined {
  if (!chainId || !address) return undefined;
  const base = EXPLORERS[chainId];
  return base ? `${base}/address/${address}` : undefined;
}
