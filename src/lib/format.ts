import { formatUnits, parseUnits } from "viem";
import { TOKEN_DECIMALS } from "./contracts";

/// Parse a human amount string ("12.5") into base units (6-decimals). Throws on invalid input.
export function toUnits(amount: string): bigint {
  return parseUnits(amount.trim() || "0", TOKEN_DECIMALS);
}

/// Format base units → a trimmed human string (e.g. 1500000n → "1.5").
export function fromUnits(value: bigint | undefined): string {
  if (value === undefined) return "0";
  return formatUnits(value, TOKEN_DECIMALS);
}

/// Format base units → a fixed-decimals display string with thousands separators.
export function displayUnits(value: bigint | undefined, maxFractionDigits = 2): string {
  if (value === undefined) return "—";
  const n = Number(formatUnits(value, TOKEN_DECIMALS));
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
}

/// True if `amount` is a valid, positive, parseable token amount.
export function isValidAmount(amount: string): boolean {
  const t = amount.trim();
  if (!t) return false;
  if (!/^\d*\.?\d*$/.test(t)) return false;
  try {
    return toUnits(t) > 0n;
  } catch {
    return false;
  }
}

/// 0x1234…abcd
export function truncateAddress(addr: string | undefined): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
