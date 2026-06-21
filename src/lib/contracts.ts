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

// ShieldedPool: shield public USDM into a private note commitment. Approve USDM to
// the POOL first, then shield(commitment, amount, proof). The Shield event carries
// the leaf index assigned to the commitment (needed later to spend/unshield it).
export const SHIELDED_POOL_ABI = parseAbi([
  "function shield(uint256 commitment, uint256 amount, bytes proof)",
  "function transfer(uint256 root, uint256 nullifierA, uint256 nullifierB, uint256 commitmentA, uint256 commitmentB, uint256 fee, address feeRecipient, bytes proof)",
  "function unshield(uint256 root, uint256 associationRoot, uint256 nullifier, address to, uint256 amount, uint256 fee, address feeRecipient, bytes proof)",
  "function currentRoot() view returns (uint256)",
  "function isKnownRoot(uint256 root) view returns (bool)",
  "function acceptedAssociationRoot(uint256 root) view returns (bool)",
  "function nullifierSpent(uint256 nullifier) view returns (bool)",
  "function acceptAssociationRoot(uint256 root)", // guardian-only
  "event Shield(uint256 indexed commitment, uint256 indexed leafIndex, uint256 amount)",
  "event PrivateTransfer(uint256 spentRoot, uint256 indexed nullifierA, uint256 indexed nullifierB, uint256 commitmentA, uint256 commitmentB, uint256 leafIndexA, uint256 leafIndexB, uint256 fee, address feeRecipient)",
]);

// NoteMemo: the permissionless encrypted note-discovery channel. A sender posts the recipient's
// output-note secret (encrypted to their viewing key) here, keyed by the output commitment; recipients
// scan Note events and trial-decrypt. Stateless/fund-less, decoupled from the pool's value transfer.
export const NOTE_MEMO_ABI = parseAbi([
  "function post(uint256 commitment, bytes ciphertext)",
  "function postMany(uint256[] commitments, bytes[] ciphertexts)",
  "event Note(uint256 indexed commitment, bytes ciphertext)",
]);

export interface Addresses {
  usdc: `0x${string}`;
  usdm: `0x${string}`;
  vault: `0x${string}`;
  mintRamp: `0x${string}`;
  redeemRamp: `0x${string}`;
  pool: `0x${string}`;
  noteMemo: `0x${string}`; // encrypted note-discovery channel for private transfers
  guardian: `0x${string}`; // can accept association roots (gates unshield) + pause
}

export const ZERO = "0x0000000000000000000000000000000000000000" as const;

// Block the pool was deployed at, per chain — the lower bound for scanning Shield/
// PrivateTransfer logs to rebuild the commitment tree (avoids scanning from genesis).
export const POOL_DEPLOY_BLOCK: Record<number, bigint> = {
  [baseSepolia.id]: 43104645n,
  [base.id]: 0n,
};

// Per-chain addresses. USDC is the canonical Circle address on each network; the MaskedUSD contracts
// are ZERO until deployed (the UI shows a "not yet deployed" state for that chain — see isDeployed).
export const ADDRESSES: Record<number, Addresses> = {
  [baseSepolia.id]: {
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC (Circle testnet)
    // Deployed 2026-06-20 (unaudited testnet bring-up). Guardian = deployer EOA bootstrap.
    usdm: "0x09a4184daEdaCdcCcded6087f576E57a05950fef",
    vault: "0x7dD602d140C7f12591a9CcBF0d5300F566e36464",
    mintRamp: "0x16154843AB66ca01CD14d6f36566479FAA2A3Df3",
    redeemRamp: "0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb",
    pool: "0x0e694f3243a89a91597A35B188F91750b1F1CDe6",
    noteMemo: "0xF276B64C7e4456fF072D787694c7615A0F62C941", // deployed 2026-06-21
    guardian: "0xd656427d14052adA99B238Fe868A76a15ebC99bE",
  },
  [base.id]: {
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base mainnet USDC (native)
    usdm: ZERO,
    vault: ZERO,
    mintRamp: ZERO,
    redeemRamp: ZERO,
    pool: ZERO,
    noteMemo: ZERO,
    guardian: ZERO,
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

/// Private transfers are available (pool + the NoteMemo discovery channel are both deployed).
export function transfersLive(a: Addresses | undefined): a is Addresses {
  return !!a && a.pool !== ZERO && a.noteMemo !== ZERO;
}
