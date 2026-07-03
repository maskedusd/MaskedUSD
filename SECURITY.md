<div align="center">

# MaskedUSD — Security Policy

**The dollar that can be private — secured by immutable, verifiable contracts.**

[![License](https://img.shields.io/badge/license-Apache--2.0-8B6FE0)](./LICENSE)
[![Live on Base](https://img.shields.io/badge/status-live%20on%20Base-8B6FE0)](https://www.maskedusd.com)
[![Chain](https://img.shields.io/badge/chain-Base%208453-0052FF)](https://basescan.org)
[![Non-custodial](https://img.shields.io/badge/custody-non--custodial-8B6FE0)](#trust-model)
[![Immutable](https://img.shields.io/badge/contracts-immutable-8B6FE0)](#trust-model)
[![Proofs](https://img.shields.io/badge/proofs-Noir%20%2F%20UltraHonk-6E56CF)](#the-cryptographic-core)
[![Verified](https://img.shields.io/badge/source-verified%20on%20Basescan-3AAE7C)](#official-contract-addresses)

</div>

---

## Overview

MaskedUSD is a privacy-stablecoin protocol **live on Base mainnet (chain `8453`)**. Its core contracts are **immutable** (non-upgradeable), **source-verified on Basescan**, and **non-custodial** — operators never hold user funds or keys, and users self-custody at all times.

We take the security of the protocol, its users, and their privacy seriously. This document explains how to report a vulnerability, what is in scope, our security posture, and the known risks we ask every user to understand.

> **Never disclose a suspected vulnerability publicly** (issues, pull requests, social media, chat) until it has been reviewed and, where necessary, remediated or mitigated. Because the contracts are immutable, coordinated handling is essential.

---

## Table of Contents

- [Reporting a Vulnerability](#reporting-a-vulnerability)
- [Scope](#scope)
- [Official Contract Addresses](#official-contract-addresses)
- [Trust Model](#trust-model)
- [The Cryptographic Core](#the-cryptographic-core)
- [Security Posture](#security-posture)
- [Known Risks](#known-risks)
- [Safe Harbor](#safe-harbor)
- [Contact](#contact)

---

## Reporting a Vulnerability

If you believe you have found a security vulnerability in MaskedUSD — in the smart contracts, the zero-knowledge circuits, the client SDK/proving stack, or the website — please report it **privately**.

**Email:** [support@maskedusd.com](mailto:support@maskedusd.com)

Please include, where possible:

- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction (proof-of-concept, transaction hashes, addresses, or code references).
- The affected component (contract, circuit, SDK, or frontend) and, if known, the relevant address or file.
- Any suggested remediation or mitigation.

**What to expect:**

| Stage | Target |
| --- | --- |
| Acknowledgement of your report | Within **3 business days** |
| Initial assessment & severity triage | Within **7 business days** |
| Ongoing status updates | At least every **7 days** until resolved |
| Coordinated disclosure | By mutual agreement, after a fix or mitigation is in place |

We are happy to credit reporters who follow coordinated disclosure. A public bug-bounty program is planned; until it launches, please report directly by email.

> **Please do not** run automated scanners against production infrastructure in a way that degrades service, attempt to access or exfiltrate other users' data, or execute exploits against real user funds. See [Safe Harbor](#safe-harbor).

---

## Scope

### In scope

- **Smart contracts** deployed at the [official addresses](#official-contract-addresses) on Base mainnet (chain `8453`) — the vault, mint/redeem ramps, shielded pool, proof verifiers, `$USDM` ERC-20, and the `NoteMemo` channel.
- **Zero-knowledge circuits** (Noir) and their generated on-chain verifiers — soundness, under-constrained-circuit, and proof-forgery issues.
- **Client SDK & in-browser proving stack** (NoirJS / bb.js note handling, witness construction, nullifier/commitment derivation).
- **Website and app** at [`https://www.maskedusd.com`](https://www.maskedusd.com) — including anything that could mislead users about official addresses, backing, or the shielded flow, or that could compromise client-side proving.

Vulnerabilities of particular interest:

- Any path that breaks the **solvency invariant** — `USDC in the vault ≥ public $USDM supply + shielded value` — or that mints unbacked `$USDM` or releases USDC without burning `$USDM`.
- **Double-spends** or nullifier/commitment forgery in the shielded pool.
- **Proof forgery** or circuit under-constraint that lets an invalid shield / transfer / unshield verify on-chain.
- **Fund theft or redirection** — e.g. redirecting a bound `payoutAddress` or `feeRecipient` on unshield/transfer.
- **Privacy breaks** — deanonymizing shielded balances, senders, or recipients beyond the protocol's stated limits.
- Any action letting the **guardian role exceed its documented authority** (see [Trust Model](#trust-model)).

### Out of scope

- The immutability of the contracts themselves is by design — "the contract cannot be upgraded to fix a bug" is a known property, not a vulnerability.
- The `$MUSD` token. `$MUSD` is a **separate, volatile, unbacked ecosystem/utility token** (launching via Clanker) — it is not a stablecoin, is not backed by anything, pays no yield, can go to zero, and is not an investment or security. Its price behavior is not a protocol security issue.
- Native USDC issuer behavior (e.g. Circle freezing the vault's USDC balance) — a known, documented risk (see [Known Risks](#known-risks)), not a protocol bug.
- Loss of user-held note secrets or wallet keys (self-custody; unrecoverable by anyone, including us).
- Best-practice or informational findings with no demonstrated security impact (e.g. missing headers, theoretical gas concerns), third-party infrastructure we do not control, and social-engineering or physical attacks.

---

## Official Contract Addresses

Always verify by **address**, not by name or ticker. Anything else claiming to be MaskedUSD is not us. These are the deployed, source-verified contracts on **Base mainnet (chain `8453`)**:

| Contract | Role | Address (Base) |
| --- | --- | --- |
| **USDM** (ERC-20) | The public dollar surface; mint/burn callable only by the ramps | [`0x09a4184daEdaCdcCcded6087f576E57a05950fef`](https://basescan.org/address/0x09a4184daEdaCdcCcded6087f576E57a05950fef) |
| **USDCVault** | Custodies the native-USDC backing, 1:1 against all outstanding `$USDM` | [`0x7dD602d140C7f12591a9CcBF0d5300F566e36464`](https://basescan.org/address/0x7dD602d140C7f12591a9CcBF0d5300F566e36464) |
| **MintRamp** | USDC in → `$USDM` out; runs the sanctions-screening hook | [`0x16154843AB66ca01CD14d6f36566479FAA2A3Df3`](https://basescan.org/address/0x16154843AB66ca01CD14d6f36566479FAA2A3Df3) |
| **RedeemRamp** | `$USDM` in → USDC out; screening at the exit boundary | [`0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb`](https://basescan.org/address/0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb) |
| **ShieldedPool** | The privacy core: Poseidon commitment tree + nullifier set | [`0x0e694f3243a89a91597A35B188F91750b1F1CDe6`](https://basescan.org/address/0x0e694f3243a89a91597A35B188F91750b1F1CDe6) |
| **NoteMemo** | Stateless encrypted payment-notice channel; holds no funds | [`0xF276B64C7e4456fF072D787694c7615A0F62C941`](https://basescan.org/address/0xF276B64C7e4456fF072D787694c7615A0F62C941) |

The **guardian** role is held on-chain by [`0xd656427d14052adA99B238Fe868A76a15ebC99bE`](https://basescan.org/address/0xd656427d14052adA99B238Fe868A76a15ebC99bE). Its authority is strictly limited — see below.

---

## Trust Model

Understanding what is and is not trusted is central to assessing MaskedUSD's security.

- **Non-custodial.** Operators never hold user funds or private keys. Users self-custody, and shielded note secrets never leave the user's device.
- **Immutable.** The vault, ramps, shielded pool, and verifiers are non-upgradeable. There are no proxies on the core, no admin withdrawal path, and no ability to mint unbacked `$USDM`, freeze balances, or change a deployed circuit's verifying key. What you audit is what runs.
- **Client-side proofs.** Zero-knowledge proofs are generated entirely in the user's own browser (WASM). There is no trusted proving service that sees spend secrets.
- **The guardian is limited and named.** A single on-chain guardian role exists. It can do **exactly two things and nothing more**:
  1. **Pause** entry points (mint / redeem / shield / transfer) as an incident circuit-breaker. A pause **never traps user funds** — the unshield exit path remains available by design.
  2. **Accept association-set roots**, which gate the unshield (withdrawal) path. This is the compliance lever, named plainly: which association roots are accepted determines which notes may withdraw.

> The guardian **cannot** move, mint, freeze, or access user funds; it cannot upgrade any contract or touch any user's keys. MaskedUSD is **not** "fully autonomous / zero-admin" — this limited, transparent guardian is the one remaining trusted role, disclosed here honestly.

**Off-chain services** (indexer, optional relayer, RPC) are liveness/UX infrastructure only. They cannot move user funds — payout and fee-recipient addresses are bound inside each proof, so a relayer or front-runner cannot redirect funds; they can at worst censor or serve stale data, which users can route around by self-submitting.

---

## The Cryptographic Core

- **Notes as UTXOs.** Shielded funds are notes committed with the **Poseidon** hash: `commitment = H(value, owner_pub, blinding, asset_id)`. Spending a note reveals only its **nullifier** (`H(owner_priv, leaf_index)`), marking it spent without revealing which commitment it was — preventing double-spends while preserving on-chain unlinkability.
- **Merkle tree.** Commitments append to an incremental, depth-32 Poseidon Merkle tree, computed bit-identically by the contracts, circuits, and client.
- **JoinSplit transfers.** Private transfers consume input notes and produce output notes, proving `Σ inputs = Σ outputs + fee` in zero knowledge — value is conserved without revealing any amount.
- **Proving stack.** Circuits are written in **Noir** and proven with **UltraHonk** (Barretenberg / bb.js) over the **BN254** curve, entirely client-side. The chain's immutable verifier contracts check every shield / transfer / unshield proof.
- **Privacy that complements compliance.** Screening runs at the legible mint/redeem ramps; withdrawals prove membership in an association set accepted on-chain (a Privacy-Pools-style model). MaskedUSD is explicitly **not** a mixer or tumbler — privacy is opt-in and for lawful use only.

---

## Security Posture

- All contracts are **immutable** and **source-verified on Basescan** — anyone can review exactly what runs, and it cannot be silently changed.
- **Independent security review and audits are in progress**; results will be published when complete. **We do not claim an audit we do not have.**
- A **public bug-bounty program is planned**; until then, report privately by email.
- The protocol is exercised by an extensive **Foundry test suite** (unit, end-to-end, and invariant/fuzz testing) that holds the core safety promises — solvency, value conservation, no double-spend, no trapped funds under pause, and proof-bound payout/fee routing.
- **Coordinated disclosure** is our standing expectation. Because the contracts cannot be patched in place, some issues may require user-facing mitigations (e.g. pausing entries) rather than a code fix.

---

## Known Risks

We ask every user to understand these plainly:

- **Smart-contract & circuit risk.** A flaw in the contracts or the zero-knowledge circuits could put funds at risk. Because the contracts are immutable, bugs cannot be patched in place.
- **Issuer risk.** The backing is native USDC; its issuer can freeze the vault's balance, which would halt redemptions while it lasted.
- **Exit liveness.** Withdrawals require an association root accepted by the guardian. If the guardian stops accepting updated roots, withdrawals for newly deposited notes can stall until it resumes.
- **Privacy limits.** Privacy strengthens with pool usage; early on the anonymity set is small, and matching public shield/withdraw amounts or timing can narrow who paid whom. Network-level metadata (IP, RPC provider) is outside the protocol's protection.
- **Key loss.** Shielded note secrets exist only client-side. If a user loses them (and any backup), the notes are unrecoverable by anyone — including us.

---

## Safe Harbor

We will not pursue or support legal action against security researchers who, in good faith:

- Make a genuine effort to avoid privacy violations, data destruction, service degradation, and interruption to production users;
- Do not access, modify, or exfiltrate data or funds beyond the minimum necessary to demonstrate a vulnerability;
- Report promptly and privately via [support@maskedusd.com](mailto:support@maskedusd.com); and
- Give us reasonable time to remediate or mitigate before any public disclosure.

Testing against production must never target other users' funds or data. When in doubt, contact us first.

---

## Contact

| Channel | Link |
| --- | --- |
| Security & general contact | [support@maskedusd.com](mailto:support@maskedusd.com) |
| Website | [https://www.maskedusd.com](https://www.maskedusd.com) |
| App | [https://www.maskedusd.com/app](https://www.maskedusd.com/app) |
| Whitepaper | [https://www.maskedusd.com/whitepaper](https://www.maskedusd.com/whitepaper) |
| X | [https://x.com/MaskedUSD](https://x.com/MaskedUSD) |
| Telegram | [https://t.me/maskedusd](https://t.me/maskedusd) |
| GitHub | [https://github.com/maskedusd](https://github.com/maskedusd) |

---

<div align="center">

Licensed under **Apache-2.0**. Privacy for normal people — not a tool for evading the law.

</div>
