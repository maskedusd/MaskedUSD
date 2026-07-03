import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { ADDRESSES, SHIELDED_POOL_ABI } from "@/lib/contracts";

/**
 * Guardian auto-accept: if the pool's current root isn't yet an accepted association root, accept
 * it as the guardian — this is what un-pauses withdrawals after a shield/transfer changes the tree.
 *
 * Called three ways: (1) fire-and-forget by the dApp right after a successful shield/transfer (the
 * only actions that change the root), (2) by a withdraw that finds its root unaccepted, and (3) a
 * daily Vercel cron as a backstop. GET and POST both work (Vercel cron uses GET).
 *
 * Deliberately UNauthenticated: the only thing this endpoint can do is accept the pool's OWN
 * current root — the exact action the operator wants performed as often as the root changes. It
 * never signs anything else, reads the target root from the chain itself, and no-ops (read-only)
 * when the root is already accepted, so spamming it costs us nothing but RPC reads. Worst-case
 * griefing (forcing accept txs by repeatedly shielding) costs the attacker far more in gas than
 * the guardian's ~$0.001 accept.
 *
 * Env:
 *  - GUARDIAN_KEY  guardian private key (0x…). Powers on-chain: pause + root acceptance ONLY —
 *                  it cannot move funds, mint, or upgrade. Without it → honest 503.
 *  - BASE_RPC_URL  optional RPC override (defaults to the public https://mainnet.base.org).
 */

export const maxDuration = 60; // wait out one Base receipt comfortably
export const dynamic = "force-dynamic";

const POOL = ADDRESSES[base.id]!.pool;

async function acceptCurrentRoot(): Promise<NextResponse> {
  const key = process.env.GUARDIAN_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GUARDIAN_KEY is not configured — root acceptance is manual until it is." },
      { status: 503 },
    );
  }

  const rpc = http(process.env.BASE_RPC_URL ?? "https://mainnet.base.org");
  const publicClient = createPublicClient({ chain: base, transport: rpc });

  const root = (await publicClient.readContract({
    address: POOL,
    abi: SHIELDED_POOL_ABI,
    functionName: "currentRoot",
  })) as bigint;

  const accepted = (await publicClient.readContract({
    address: POOL,
    abi: SHIELDED_POOL_ABI,
    functionName: "acceptedAssociationRoot",
    args: [root],
  })) as boolean;

  const rootHex = `0x${root.toString(16).padStart(64, "0")}`;
  if (accepted) {
    return NextResponse.json({ ok: true, status: "already-accepted", root: rootHex });
  }

  const account = privateKeyToAccount(key as `0x${string}`);
  const wallet = createWalletClient({ account, chain: base, transport: rpc });
  try {
    const hash = await wallet.writeContract({
      address: POOL,
      abi: SHIELDED_POOL_ABI,
      functionName: "acceptAssociationRoot",
      args: [root],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      return NextResponse.json({ error: "accept tx reverted", tx: hash }, { status: 502 });
    }
    return NextResponse.json({ ok: true, status: "accepted", root: rootHex, tx: hash });
  } catch (e) {
    // Most likely: wrong key (onlyGuardian) or RPC trouble. Log detail server-side only.
    console.error("accept-root error", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "could not accept the current root" }, { status: 502 });
  }
}

export async function GET() {
  return acceptCurrentRoot();
}

export async function POST() {
  return acceptCurrentRoot();
}
