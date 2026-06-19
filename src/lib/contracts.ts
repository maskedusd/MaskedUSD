import { parseAbi } from "viem";
import { base, baseSepolia } from "wagmi/chains";

// USDM and USDC are both 6-decimal ERC-20s (USDM is backed 1:1 by USDC).
export const TOKEN_DECIMALS = 6;

export const ERC20_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

// MintRamp: deposit USDC (approve the VAULT first) → receive USDM 1:1.
export const MINT_RAMP_ABI = parseAbi(["function mint(uint256 amount)"]);
// RedeemRamp: burn the caller's USDM → release USDC to `to` (no approval needed; burn is role-gated).
export const REDEEM_RAMP_ABI = parseAbi(["function redeem(uint256 amount, address to)"]);
export const VAULT_ABI = parseAbi(["function totalBacking() view returns (uint256)"]);

export interface Addresses {
  usdc: `0x${string}`;
  usdm: `0x${string}`;
  vault: `0x${string}`;
  mintRamp: `0x${string}`;
  redeemRamp: `0x${string}`;
  pool: `0x${string}`;
}

export const ZERO = "0x0000000000000000000000000000000000000000" as const;

// Per-chain addresses. USDC is the canonical Circle address on each network; the MaskedUSD contracts
// are ZERO until deployed (the UI shows a "not yet deployed" state for that chain — see isDeployed).
export const ADDRESSES: Record<number, Addresses> = {
  [baseSepolia.id]: {
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC (Circle testnet)
    usdm: ZERO,
    vault: ZERO,
    mintRamp: ZERO,
    redeemRamp: ZERO,
    pool: ZERO,
  },
  [base.id]: {
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base mainnet USDC (native)
    usdm: ZERO,
    vault: ZERO,
    mintRamp: ZERO,
    redeemRamp: ZERO,
    pool: ZERO,
  },
};

export function addressesFor(chainId: number | undefined): Addresses | undefined {
  return chainId === undefined ? undefined : ADDRESSES[chainId];
}

/// The public mint/redeem ramps are live on this chain (contracts deployed).
export function rampsLive(a: Addresses | undefined): a is Addresses {
  return !!a && a.usdm !== ZERO && a.mintRamp !== ZERO && a.redeemRamp !== ZERO && a.vault !== ZERO;
}

/// The shielded pool is live on this chain.
export function poolLive(a: Addresses | undefined): a is Addresses {
  return !!a && a.pool !== ZERO;
}
