"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Landmark,
  Lock,
  Scale,
  ShieldCheck,
  Snowflake,
  Users,
  ExternalLink,
} from "lucide-react";

/**
 * WhitepaperMain — the body of /whitepaper. A long-form, section-by-section
 * description of the protocol in the site's own visual language: alternating
 * lavender/white bands, mono kickers, display headings, rounded cards, and
 * scroll-linked reveals (reduced-motion aware).
 *
 * Honesty: everything here is present-tense FACT about the deployed system or
 * clearly labelled design intent. No audited claims (audits are "in the works,
 * published when complete"), no yield/APY, $MUSD stays volatile/unbacked, and
 * privacy is framed for normal users — complementary to compliance, never
 * evasion. Risks get their own section, stated plainly.
 */

const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

const ADDRESSES: { name: string; role: string; addr: string }[] = [
  { name: "USDM (ERC-20)", role: "The public dollar surface", addr: "0x09a4184daEdaCdcCcded6087f576E57a05950fef" },
  { name: "USDCVault", role: "Custodies the 1:1 native-USDC backing", addr: "0x7dD602d140C7f12591a9CcBF0d5300F566e36464" },
  { name: "MintRamp", role: "USDC in → USDM out (screening hook)", addr: "0x16154843AB66ca01CD14d6f36566479FAA2A3Df3" },
  { name: "RedeemRamp", role: "USDM in → USDC out (screening hook)", addr: "0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb" },
  { name: "ShieldedPool", role: "Commitment tree + nullifier set — the privacy core", addr: "0x0e694f3243a89a91597A35B188F91750b1F1CDe6" },
  { name: "NoteMemo", role: "Encrypted payment-notice channel for private sends", addr: "0xF276B64C7e4456fF072D787694c7615A0F62C941" },
];

/* ── shared building blocks ────────────────────────────────────────────────── */

function useReveal(): Variants {
  const reduce = useReducedMotion();
  return {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.7, ease: EASE_OUT },
    },
  };
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-deep">
      <span className="status-dot" aria-hidden="true" />
      {children}
    </span>
  );
}

function SectionHead({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  const reveal = useReveal();
  return (
    <motion.div
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      className="max-w-2xl"
    >
      <Kicker>{kicker}</Kicker>
      <h2 className="mt-5 font-display text-3xl font-bold leading-[1.06] tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {children && (
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">{children}</p>
      )}
    </motion.div>
  );
}

function Band({
  tone,
  children,
}: {
  tone: "wash" | "white";
  children: ReactNode;
}) {
  return (
    <section
      className={`relative w-full overflow-hidden py-20 md:py-28 ${
        tone === "white" ? "bg-surface" : "bg-bg"
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[820px] max-w-[120%] -translate-x-1/2 rounded-full blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgba(139,111,224,0.10) 0%, rgba(139,111,224,0) 72%)",
        }}
      />
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6">{children}</div>
    </section>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-[#1b1438] px-5 py-4">
      <pre className="font-mono text-[0.78rem] leading-relaxed text-[#cfc4f2]">{children}</pre>
    </div>
  );
}

/* ── page body ─────────────────────────────────────────────────────────────── */

export default function WhitepaperMain() {
  const reveal = useReveal();

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
  };

  return (
    <main className="w-full bg-bg text-ink">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden pb-16 pt-36 md:pb-24 md:pt-44">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-140px] -z-10 h-[560px] w-[900px] max-w-[130%] -translate-x-1/2 rounded-full blur-[150px]"
          style={{
            background:
              "radial-gradient(circle, rgba(139,111,224,0.20) 0%, rgba(139,111,224,0) 70%)",
          }}
        />
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-[1180px] px-5 sm:px-6"
        >
          <motion.div variants={reveal}>
            <Kicker>Whitepaper · v1.0 · July 2026 · living document</Kicker>
          </motion.div>
          <motion.h1
            variants={reveal}
            className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            The dollar that <span className="text-accent-deep">can be private.</span>
          </motion.h1>
          <motion.p
            variants={reveal}
            className="mt-6 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg"
          >
            MaskedUSD is privacy-stablecoin infrastructure on Base: $USDM, a dollar backed 1:1 by
            native USDC, with an opt-in shielded layer where balances and transfers are proven
            correct by zero-knowledge proofs instead of being broadcast to everyone. This document
            describes the system as deployed — its architecture, its privacy design, its compliance
            posture, and its risks.
          </motion.p>
          <motion.div variants={reveal} className="mt-8 flex flex-wrap items-center gap-2.5">
            {["Live on Base", "Immutable contracts", "1:1 native-USDC-backed", "Proofs in your browser"].map(
              (chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface/70 px-3.5 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-muted"
                >
                  {chip}
                </span>
              ),
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Abstract ─────────────────────────────────────────────────────── */}
      <Band tone="white">
        <SectionHead kicker="00 · Abstract" title="What this is." />
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-10 max-w-3xl rounded-3xl border border-ink/[0.08] bg-bg/60 p-7 shadow-[0_24px_60px_-46px_rgba(107,79,207,0.5)] sm:p-9"
        >
          <p className="text-[0.98rem] leading-relaxed text-ink-muted">
            On a public blockchain, every balance and every payment is visible to anyone, forever.
            That is a strange default for money. MaskedUSD keeps the part of a stablecoin that
            should be public — <span className="font-medium text-ink">that it is fully backed and that every
            transfer is valid</span> — public, and makes the part that should be personal —{" "}
            <span className="font-medium text-ink">who holds what and who pays whom</span> — private, at the
            holder&apos;s option. $USDM mints 1:1 against native USDC and redeems back at any time.
            An opt-in shielded pool turns dollars into private notes; zero-knowledge proofs
            generated in the user&apos;s own browser guarantee that no value is created, destroyed,
            or double-spent inside the pool. Screening lives at the public on- and off-ramps, and
            withdrawals prove membership in an association set — privacy designed to complement
            compliance, not to defeat it.
          </p>
        </motion.div>
      </Band>

      {/* ── 01 Motivation ────────────────────────────────────────────────── */}
      <Band tone="wash">
        <SectionHead kicker="01 · Motivation" title="Financial privacy for normal people.">
          Your salary, your savings, your rent — none of it should be a public broadcast. Today, a
          single payment reveals your entire financial history to the counterparty and to anyone
          watching the chain.
        </SectionHead>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          className="mt-12 grid gap-4 md:grid-cols-3"
        >
          {[
            {
              t: "The transparency problem",
              b: "Pay someone once and they can see your balance, your income, and everyone you've ever transacted with. Businesses leak payroll and supplier relationships. Individuals become targets.",
            },
            {
              t: "The wrong fixes",
              b: "Mixers hide provenance indiscriminately — which is exactly why they attract illicit flows and regulatory action. Opaque custodians ask you to trust them with both your money and your data.",
            },
            {
              t: "The MaskedUSD position",
              b: "Keep validity and backing publicly provable; make the transaction graph private by default inside an opt-in pool; screen at the legible fiat boundaries. Privacy and accountability, at the same time.",
            },
          ].map((c) => (
            <motion.div
              key={c.t}
              variants={reveal}
              className="rounded-3xl border border-ink/[0.08] bg-surface/70 p-6 shadow-[0_24px_60px_-46px_rgba(107,79,207,0.5)] backdrop-blur-[8px] sm:p-7"
            >
              <h3 className="font-display text-lg font-bold tracking-tight text-ink">{c.t}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{c.b}</p>
            </motion.div>
          ))}
        </motion.div>
      </Band>

      {/* ── 02 Design principles ─────────────────────────────────────────── */}
      <Band tone="white">
        <SectionHead kicker="02 · Design principles" title="Constraints, not slogans.">
          These principles decided the architecture — each one closes off a whole class of designs.
        </SectionHead>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[
            {
              icon: Lock,
              t: "Immutability is a feature",
              b: "The vault, ramps, and shielded pool are non-upgradeable. No proxies, no admin withdrawal path, no admin who can freeze your USDM, block your exit, or mint unbacked dollars. What you audit is what runs — forever.",
            },
            {
              icon: Users,
              t: "Privacy for normal users",
              b: "The design target is everyday financial privacy, not evasion. The system follows the Privacy Pools model: association sets and opt-in transparency instead of indiscriminate mixing.",
            },
            {
              icon: Scale,
              t: "Compliance in the architecture",
              b: "Screening is enforced by the mint and redeem ramps themselves — the boundary where dollars become legible. It is wired into the immutable contracts, not bolted on beside them.",
            },
            {
              icon: Snowflake,
              t: "The freeze is in the threat model",
              b: "The vault holds native USDC, which its issuer can freeze. We treat that as a real risk to design and communicate around — not something to pretend away.",
            },
            {
              icon: ShieldCheck,
              t: "No Ponzi surface",
              b: "No yield is promised anywhere in the system. $USDM pays nothing; it is a backed dollar. $MUSD pays nothing; it is a volatile utility token. Numbers that don't exist can't be faked.",
            },
            {
              icon: Landmark,
              t: "Name the trusted parties",
              b: "The remaining trust is explicit: a guardian that can pause entries and accept association roots — and nothing else. It cannot touch funds, mint, or upgrade anything.",
            },
          ].map((p) => (
            <motion.div
              key={p.t}
              variants={reveal}
              className="rounded-3xl border border-ink/[0.08] bg-bg/60 p-6 sm:p-7"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
                <p.icon className="h-5 w-5 text-accent-deep" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-[1.05rem] font-bold tracking-tight text-ink">
                {p.t}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.b}</p>
            </motion.div>
          ))}
        </motion.div>
      </Band>

      {/* ── 03 On-chain architecture ─────────────────────────────────────── */}
      <Band tone="wash">
        <SectionHead kicker="03 · Architecture" title="A deliberately small immutable core.">
          Every contract is non-upgradeable and verified on Basescan; the only privileged authority
          anywhere is pause + association-root acceptance, held by the guardian.
        </SectionHead>
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 overflow-x-auto rounded-3xl border border-ink/[0.08] bg-surface/70 shadow-[0_24px_60px_-46px_rgba(107,79,207,0.5)]"
        >
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-dim">
                <th className="px-6 py-4 font-medium">Contract</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Privileged authority</th>
              </tr>
            </thead>
            <tbody className="text-ink-muted">
              {[
                ["USDCVault", "Custodies the native USDC backing, 1:1 against all outstanding USDM.", "Pause only"],
                ["MintRamp", "USDC in → USDM out. Runs the sanctions-screening hook.", "Pause only"],
                ["RedeemRamp", "USDM in → USDC out. Same screening at the exit boundary.", "Pause only"],
                ["ShieldedPool", "The privacy core: a commitment Merkle tree + nullifier set.", "Pause + accept association roots"],
                ["Verifiers (×3) + adapter", "Immutable UltraHonk verification of every shield / transfer / unshield proof.", "None"],
                ["USDM", "Standard 6-decimal ERC-20; mint/burn callable only by the ramps.", "None"],
                ["NoteMemo", "Stateless encrypted payment-notice channel. Holds no funds; decoupled from the pool.", "None"],
              ].map(([c, r, a]) => (
                <tr key={c} className="border-b border-ink/[0.06] last:border-0">
                  <td className="px-6 py-4 font-mono text-[0.8rem] text-ink">{c}</td>
                  <td className="px-6 py-4 leading-relaxed">{r}</td>
                  <td className="px-6 py-4">{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="mt-6 rounded-3xl border border-accent/20 bg-accent-soft/60 p-6 sm:p-7"
        >
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-accent-deep">
            The solvency invariant
          </p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
            <span className="font-mono text-[0.85rem] text-ink">
              USDC in the vault ≥ public USDM supply + shielded value
            </span>{" "}
            — always. Minting increases both sides; redeeming decreases both. No path exists that
            creates USDM without locking USDC, and none that releases USDC without burning USDM.
            Pause halts entries during an incident, but exits keep working by design: a pause can
            never trap user funds.
          </p>
        </motion.div>
      </Band>

      {/* ── 04 The shielded pool ─────────────────────────────────────────── */}
      <Band tone="white">
        <SectionHead kicker="04 · The shielded pool" title="Notes, commitments, nullifiers.">
          Inside the pool, dollars are notes — UTXOs whose contents only their owner knows. The
          chain stores commitments; inside the pool, ownership and transfer amounts never appear on
          the public ledger. (Amounts entering and leaving the pool — shields and withdrawals — are
          public, like any on-chain transaction.)
        </SectionHead>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-4"
          >
            <Code>
              {`commitment = H(value, owner_pub, blinding, asset_id)
owner_pub  = H(owner_priv)
nullifier  = H(owner_priv, leaf_index)`}
            </Code>
            <p className="text-sm leading-relaxed text-ink-muted">
              A <span className="font-medium text-ink">note</span> commits to its value, its owner, and a
              random blinding factor with the Poseidon hash. Commitments are inserted into a
              depth-32 Merkle tree — the same tree the contracts, the circuits, and the client all
              compute identically. Spending a note reveals only its{" "}
              <span className="font-medium text-ink">nullifier</span>, which marks it spent without
              disclosing which commitment it was: double-spends are impossible, and on-chain
              unlinkability is preserved.
            </p>
            <p className="text-sm leading-relaxed text-ink-muted">
              Private transfers are <span className="font-medium text-ink">JoinSplit</span>: spend two input
              notes, create two output notes (payment + change), and prove in zero knowledge that{" "}
              <span className="font-mono text-[0.82rem] text-ink">Σ inputs = Σ outputs + fee</span> — value is
              conserved without revealing any amount.
            </p>
          </motion.div>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-4"
          >
            {[
              {
                t: "Recipient-controlled payments",
                b: "A MaskedUSD address (musd1…) packs an encryption key and a spending key. Output notes are bound to the recipient's spending key — only they can ever spend what they receive, and the sender cannot claw it back. Real payment finality, privately.",
              },
              {
                t: "Encrypted payment notices",
                b: "The sender posts the note's secrets — encrypted to the recipient — on the permissionless NoteMemo contract. The recipient's browser scans and trial-decrypts to discover incoming payments. NoteMemo holds no funds and can't affect the pool.",
              },
              {
                t: "Proofs in your browser",
                b: "Circuits are written in Noir and proven with UltraHonk over BN254 — entirely client-side, in WASM. Note secrets never leave the device; the chain's immutable verifier contracts check every proof. There is no trusted proving service.",
              },
              {
                t: "Encrypted custody",
                b: "Note secrets are encrypted at rest in the browser under a key derived from one wallet signature. Losing the secrets means losing the notes — users are told to back them up, plainly.",
              },
            ].map((c) => (
              <motion.div
                key={c.t}
                variants={reveal}
                className="rounded-3xl border border-ink/[0.08] bg-bg/60 p-6"
              >
                <h3 className="font-display text-[1rem] font-bold tracking-tight text-ink">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{c.b}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Band>

      {/* ── 05 Privacy that complements compliance ───────────────────────── */}
      <Band tone="wash">
        <SectionHead kicker="05 · Compliance posture" title="Not a mixer. By design.">
          The point is not to hide where money came from — it&apos;s that your finances shouldn&apos;t be a
          public feed. The design follows the Privacy Pools approach: keep the graph private inside
          the pool, screen at the boundaries, and let exits prove they belong to an honest set.
        </SectionHead>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid gap-4 md:grid-cols-3"
        >
          {[
            {
              t: "Screen where money is legible",
              b: "Every mint and every redemption passes an on-chain screening check at the ramp — the point where dollars touch the regulated world. Today that check is a guardian-managed blocklist oracle; a dedicated screening provider is the designed direction. The pool itself never needs to see identities.",
            },
            {
              t: "Association-set exits",
              b: "Every withdrawal proves membership in an association root accepted on-chain. The designed model derives that set from the full commitment stream minus a published exclusion ledger — so flagged funds can be excluded from exits without deanonymizing anyone else. Today the guardian accepts the pool's current root; the exclusion ledger is the designed direction and is not yet live.",
            },
            {
              t: "Validity is public",
              b: "Backing, supply, and every state transition are publicly verifiable at all times. Privacy applies to who and how much — never to whether the system is solvent and correct.",
            },
          ].map((c) => (
            <motion.div
              key={c.t}
              variants={reveal}
              className="rounded-3xl border border-ink/[0.08] bg-surface/70 p-6 shadow-[0_24px_60px_-46px_rgba(107,79,207,0.5)] sm:p-7"
            >
              <h3 className="font-display text-lg font-bold tracking-tight text-ink">{c.t}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{c.b}</p>
            </motion.div>
          ))}
        </motion.div>
        <motion.p
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="mt-8 text-center font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ink-dim"
        >
          Privacy for normal people — not a tool for evading the law
        </motion.p>
      </Band>

      {/* ── 06 Lifecycle ─────────────────────────────────────────────────── */}
      <Band tone="white">
        <SectionHead kicker="06 · Lifecycle" title="A dollar's round trip." />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-12 grid gap-4 md:grid-cols-5"
        >
          {[
            ["Mint", "Deposit USDC at the ramp; receive public USDM 1:1. Screening runs here."],
            ["Shield", "Prove a note commitment in-browser; USDM moves into the pool as a private note."],
            ["Send", "JoinSplit: pay any musd1… address privately. Amounts and recipients stay off the ledger."],
            ["Withdraw", "Prove ownership + association-set membership; the note returns to public USDM."],
            ["Redeem", "Burn USDM at the ramp; native USDC returns to your wallet. Screening runs again."],
          ].map(([t, b], i) => (
            <motion.div
              key={t}
              variants={reveal}
              className="relative rounded-3xl border border-ink/[0.08] bg-bg/60 p-5"
            >
              <span className="font-mono text-[0.7rem] font-medium text-accent-deep">
                0{i + 1}
              </span>
              <h3 className="mt-2 font-display text-[1rem] font-bold tracking-tight text-ink">{t}</h3>
              <p className="mt-1.5 text-[0.8rem] leading-relaxed text-ink-muted">{b}</p>
            </motion.div>
          ))}
        </motion.div>
      </Band>

      {/* ── 07 The two tokens ────────────────────────────────────────────── */}
      <Band tone="wash">
        <SectionHead kicker="07 · Tokens" title="$USDM is the product. $MUSD is not a dollar.">
          Two tokens, two jobs, kept deliberately distinct.
        </SectionHead>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          className="mt-12 grid gap-4 md:grid-cols-2"
        >
          <motion.div
            variants={reveal}
            className="rounded-3xl border border-ink/[0.08] bg-surface/70 p-7 shadow-[0_24px_60px_-46px_rgba(107,79,207,0.5)]"
          >
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-accent-deep">$USDM</p>
            <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-ink">
              The private dollar.
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
              Backed 1:1 by native USDC held in the immutable vault, redeemable at any time, with
              privacy as an opt-in property. It pays no yield — it is a dollar, not an investment.
            </p>
          </motion.div>
          <motion.div
            variants={reveal}
            className="rounded-3xl border border-accent/20 bg-accent-soft/50 p-7"
          >
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-accent-deep">$MUSD</p>
            <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-ink">
              The ecosystem token — volatile, not backed.
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
              A separate utility/access token launching on Clanker. It is NOT a stablecoin, NOT
              backed by anything, can go to zero, and pays no yield. Its role is utility, access,
              and community around the protocol. No $MUSD mechanism can ever touch $USDM&apos;s
              backing — the dollar stands on USDC alone.
            </p>
          </motion.div>
        </motion.div>
      </Band>

      {/* ── 08 Security & risks ──────────────────────────────────────────── */}
      <Band tone="white">
        <SectionHead kicker="08 · Security & risks" title="Stated plainly.">
          A privacy protocol earns trust by being explicit about what can go wrong — so here it is,
          without varnish.
        </SectionHead>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-3xl border border-ink/[0.08] bg-bg/60 p-7"
          >
            <h3 className="font-display text-lg font-bold tracking-tight text-ink">Posture</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-muted">
              {[
                "All contracts are immutable and source-verified on Basescan — anyone can review exactly what runs.",
                "Independent security review and audits are in the works; results will be published when complete. We won't claim an audit we don't have.",
                "A public bug bounty is planned.",
                "The guardian's authority is pause + association-root acceptance. It cannot move funds, mint, or upgrade anything, and a pause never blocks exits. Root acceptance is the one exit-side power it holds: which association roots are accepted determines which notes can withdraw — that is the compliance lever, named plainly.",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-3xl border border-amber-500/25 bg-amber-500/[0.04] p-7"
          >
            <h3 className="font-display text-lg font-bold tracking-tight text-ink">Known risks</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-muted">
              {[
                "Smart-contract and circuit risk: a flaw in the contracts or the zero-knowledge circuits could put funds at risk. Immutability means bugs cannot be patched in place.",
                "Issuer risk: the backing is native USDC; its issuer can freeze the vault's balance. This would halt redemptions while it lasted.",
                "Exit liveness: withdrawals require an association root accepted by the guardian. After new deposits, exits depend on the guardian accepting an updated root; if it stops doing so, withdrawals stall until it resumes.",
                "Privacy limits: privacy strengthens with pool usage. Early on, the anonymity set is small, and matching public shield/withdraw amounts or timing can narrow who paid whom. Network-level metadata (IP, RPC provider) is outside the protocol's protection.",
                "Key loss: shielded note secrets exist only client-side. If a user loses them (and any backup), the notes are unrecoverable by anyone — including us.",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </Band>

      {/* ── 09 Deployment ────────────────────────────────────────────────── */}
      <Band tone="wash">
        <SectionHead kicker="09 · Deployment" title="Live on Base.">
          The official addresses of the user-facing contracts. Verify by address, not by name or
          ticker — anything else claiming to be MaskedUSD is not us.
        </SectionHead>
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 overflow-x-auto rounded-3xl border border-ink/[0.08] bg-surface/70 shadow-[0_24px_60px_-46px_rgba(107,79,207,0.5)]"
        >
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-dim">
                <th className="px-6 py-4 font-medium">Contract</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Address · Base</th>
              </tr>
            </thead>
            <tbody className="text-ink-muted">
              {ADDRESSES.map((c) => (
                <tr key={c.addr} className="border-b border-ink/[0.06] last:border-0">
                  <td className="px-6 py-4 font-mono text-[0.8rem] text-ink">{c.name}</td>
                  <td className="px-6 py-4 leading-relaxed">{c.role}</td>
                  <td className="px-6 py-4">
                    <a
                      href={`https://basescan.org/address/${c.addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 font-mono text-[0.74rem] text-accent-deep hover:underline"
                    >
                      {c.addr.slice(0, 8)}…{c.addr.slice(-6)}
                      <ExternalLink size={11} className="opacity-60 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </Band>

      {/* ── Closing ──────────────────────────────────────────────────────── */}
      <Band tone="white">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2
            variants={reveal}
            className="font-display text-3xl font-bold leading-[1.08] tracking-tight text-ink sm:text-4xl"
          >
            Hold dollars. <span className="text-accent-deep">Keep them private.</span>
          </motion.h2>
          <motion.p variants={reveal} className="mt-4 text-base leading-relaxed text-ink-muted">
            The app is live on Base. Mint a dollar, shield it, send it privately — and verify every
            claim in this document on-chain.
          </motion.p>
          <motion.div variants={reveal} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/app"
              className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-white shadow-[0_10px_28px_-12px_rgba(27,20,56,0.5)] transition-transform hover:-translate-y-0.5"
            >
              Launch App
            </a>
            <Link
              href="/#faq"
              className="glass inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-accent"
            >
              Read the FAQ
            </Link>
          </motion.div>
          <motion.p
            variants={reveal}
            className="mt-10 font-mono text-[0.66rem] uppercase leading-relaxed tracking-[0.14em] text-ink-dim"
          >
            This document describes software, not an offer, solicitation, or financial advice. It
            is a living document and will be revised as the protocol evolves.
          </motion.p>
        </motion.div>
      </Band>
    </main>
  );
}
