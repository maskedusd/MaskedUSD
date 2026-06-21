//! BN254 scalar-field helpers shared by the note primitives.
//!
//! All shielded values (commitments, nullifiers, roots, keys) are elements of the BN254 scalar field
//! the Noir circuits + on-chain verifier operate over. We carry them as `bigint` and only render to
//! `0x`-padded 32-byte hex at the boundary (what the contracts' `uint256` public inputs expect).

/// BN254 scalar field modulus (a.k.a. `FIELD_SIZE` in `MerkleTreeWithHistory` / the circuits).
export const FIELD_SIZE =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/// True iff `x` is a canonical field element (`0 <= x < FIELD_SIZE`) — the same check the pool's
/// `_requireCanonical` enforces on every field-typed public input.
export function isCanonical(x: bigint): boolean {
  return x >= 0n && x < FIELD_SIZE;
}

/// Throw unless `x` is canonical. Mirrors the on-chain guard so the client never builds a public
/// input the contract would reject.
export function assertCanonical(x: bigint, label = "field element"): void {
  if (!isCanonical(x)) throw new RangeError(`${label} is not a canonical BN254 element: ${x}`);
}

/// Render a field element as a `0x`-prefixed, 32-byte (64 hex char) string — the exact form the
/// contracts expect for a `uint256`/`bytes32` public input.
export function toHex32(x: bigint): `0x${string}` {
  assertCanonical(x, "toHex32 input");
  return `0x${x.toString(16).padStart(64, "0")}`;
}

/// Parse a hex string (with or without `0x`) into a field element, asserting canonicity.
export function fromHex(s: string): bigint {
  const v = BigInt(s.startsWith("0x") ? s : `0x${s}`);
  assertCanonical(v, "fromHex value");
  return v;
}
