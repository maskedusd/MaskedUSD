<div align="center">

<img src="https://raw.githubusercontent.com/maskedusd/.github/main/hero-lavender.png" alt="MaskedUSD" width="640" />

# Contributing to MaskedUSD

**Privacy stablecoin infrastructure, live on Base.**

[![License](https://img.shields.io/badge/License-Apache_2.0-8B6FE0?style=flat-square)](./LICENSE)
[![Live on Base](https://img.shields.io/badge/Live_on-Base_mainnet-8B6FE0?style=flat-square)](https://basescan.org/address/0x09a4184daEdaCdcCcded6087f576E57a05950fef)
[![Chain](https://img.shields.io/badge/Chain-Base_8453-0052FF?style=flat-square)](https://base.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Noir](https://img.shields.io/badge/Proofs-Noir_%2B_UltraHonk-8B6FE0?style=flat-square)](https://noir-lang.org)
[![Non-custodial](https://img.shields.io/badge/Non--custodial-Yes-8B6FE0?style=flat-square)](#security--responsible-disclosure)
[![Immutable](https://img.shields.io/badge/Contracts-Immutable-8B6FE0?style=flat-square)](https://basescan.org/address/0x09a4184daEdaCdcCcded6087f576E57a05950fef)

</div>

---

Thanks for your interest in contributing. MaskedUSD is a privacy stablecoin protocol **live on Base mainnet** (chain `8453`). This repository is the [maskedusd.com](https://www.maskedusd.com) frontend — a Next.js application that talks to the deployed, immutable on-chain contracts. This guide covers how to set up your environment, the standards we hold code to, and how to report problems responsibly.

> By participating in this project you agree to abide by our expectations for respectful, professional collaboration. Be kind, assume good faith, and keep discussion technical.

## Table of Contents

- [Before you start](#before-you-start)
- [Ways to contribute](#ways-to-contribute)
- [Local development](#local-development)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Deployed contracts](#deployed-contracts)
- [Coding standards](#coding-standards)
- [Commit & pull-request workflow](#commit--pull-request-workflow)
- [Positioning & accuracy guardrails](#positioning--accuracy-guardrails)
- [Security & responsible disclosure](#security--responsible-disclosure)
- [License](#license)
- [Contact](#contact)

## Before you start

A few facts to keep every contribution accurate:

- **$USDM is a live, public ERC-20 dollar.** It is minted 1:1 against native USDC and is redeemable 1:1 at any time. Backing USDC is held in an immutable `USDCVault`.
- **Privacy is opt-in.** $USDM can be *shielded* into a private balance through an opt-in, zero-knowledge shielded pool with **in-browser (client-side) proving**. Users who never shield use $USDM as an ordinary transparent token.
- **The protocol is non-custodial and immutable.** Operators never hold user funds or keys — users self-custody. Contracts are **not upgradeable** and are verified on Basescan.
- **A limited guardian role exists.** It can **pause** the system and **accept association-set roots** only. It **cannot** move, mint, freeze, or otherwise access user funds or keys. Please describe it accurately in code, comments, and copy — do not overclaim "zero admin" or "fully autonomous."
- **MaskedUSD is not a mixer or tumbler.** It is privacy infrastructure for lawful, everyday dollars; unshielding is gated by Privacy-Pools-style association sets so privacy complements compliance.
- **$MUSD is a separate token.** It is a volatile, unbacked community/access token launching on Clanker — not a stablecoin, not an investment or security, no yield. This repo is about the protocol and site, not $MUSD; if you reference it, keep that framing exact.

## Ways to contribute

- **Bug reports** — open an issue describing what you expected, what happened, and repro steps (browser, wallet, chain).
- **Frontend improvements** — UI/UX polish, accessibility, performance, animation, responsiveness.
- **Documentation** — clarify copy, fix typos, improve developer docs.
- **On-chain integration** — refine wagmi/viem hooks, proof generation flows, or note-discovery logic.

For anything larger than a small fix, please open an issue first so we can align on approach before you invest time.

## Local development

**Prerequisites:** Node.js 20+ and npm.

```bash
git clone https://github.com/maskedusd/masked-fe.git
cd masked-fe
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build (type-check + compile)
npm run start        # serve the production build
npm run lint         # eslint
```

The app runs against the live Base mainnet contracts by default. You will need a browser wallet (e.g. Coinbase Wallet or an injected connector) to exercise mint, redeem, shield, and transfer flows.

## Project structure

```
src/
├── app/           Next.js App Router routes (landing, /app, /whitepaper)
├── components/    React components (sections, app UI, whitepaper)
└── lib/           on-chain wiring — contracts.ts (addresses + ABIs), proving helpers
public/            static assets (hero, circuit artifacts, token/wallet icons)
docs/              architecture and design documentation
```

`src/lib/contracts.ts` is the **authoritative source** of deployed addresses and ABIs. If an address or ABI changes on-chain, update it there and nowhere else first.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | framer-motion, three.js (interactive lavender hero) |
| On-chain | wagmi + viem |
| Proving | Noir (`@noir-lang/noir_js`) + UltraHonk via Barretenberg (`@aztec/bb.js`), BN254 |
| Crypto | `poseidon-lite`, `@noble/curves`, `@noble/hashes`, `@noble/ciphers` |
| Hosting | Vercel |

## Deployed contracts

All contracts are **live and immutable on Base mainnet (chain 8453)** and verified on Basescan. Use these addresses verbatim; do not hard-code addresses elsewhere in the codebase.

| Contract | Address |
| --- | --- |
| $USDM (ERC-20) | [`0x09a4184daEdaCdcCcded6087f576E57a05950fef`](https://basescan.org/address/0x09a4184daEdaCdcCcded6087f576E57a05950fef) |
| USDCVault | [`0x7dD602d140C7f12591a9CcBF0d5300F566e36464`](https://basescan.org/address/0x7dD602d140C7f12591a9CcBF0d5300F566e36464) |
| MintRamp | [`0x16154843AB66ca01CD14d6f36566479FAA2A3Df3`](https://basescan.org/address/0x16154843AB66ca01CD14d6f36566479FAA2A3Df3) |
| RedeemRamp | [`0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb`](https://basescan.org/address/0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb) |
| ShieldedPool | [`0x0e694f3243a89a91597A35B188F91750b1F1CDe6`](https://basescan.org/address/0x0e694f3243a89a91597A35B188F91750b1F1CDe6) |
| NoteMemo | [`0xF276B64C7e4456fF072D787694c7615A0F62C941`](https://basescan.org/address/0xF276B64C7e4456fF072D787694c7615A0F62C941) |
| Native USDC | [`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913) |

**Architecture at a glance:** a public $USDM ERC-20; mint/redeem ramps (`USDCVault`, `MintRamp`, `RedeemRamp`) with sanctions-screening hooks; an opt-in `ShieldedPool` (Poseidon commitment tree, nullifier set, UTXO/JoinSplit notes, depth-32 Merkle); a proving layer using Noir + UltraHonk with client-side browser proofs; and an encrypted `NoteMemo` channel for private payment discovery. Privacy-Pools-style association sets gate unshield so privacy complements compliance.

## Coding standards

- **TypeScript everywhere.** No `any` unless truly unavoidable and commented.
- **Lint clean.** Run `npm run lint` and `npm run build` before opening a PR; both must pass.
- **Match existing style.** Follow the conventions already in the file you are editing (naming, imports, Tailwind class ordering).
- **Accessibility.** Preserve semantic HTML, keyboard navigation, and reduced-motion behavior (`useReducedMotion`).
- **No secrets.** Never commit private keys, deployer keys, API keys, `.env` values, or mnemonics. Public contract addresses are fine; private material is not.
- **Small, focused PRs.** Keep each PR to a single concern with a clear description.

## Commit & pull-request workflow

1. Fork the repo and create a branch from `main`: `git checkout -b feature/short-description`.
2. Make your changes with clear, conventional commit messages (e.g. `feat(app): …`, `fix(shielded): …`, `docs: …`).
3. Ensure `npm run lint` and `npm run build` pass.
4. Open a pull request against `main` describing **what** changed and **why**. Link any related issue.
5. Be responsive to review feedback. A maintainer will merge once checks pass and the change is approved.

## Positioning & accuracy guardrails

Because MaskedUSD sits at the intersection of privacy and compliance, copy and code comments must stay factual:

- Describe the system as **live** and **immutable** — never "pre-launch," "coming soon," or "design-stage."
- **Do not claim a completed audit.** An independent security review and audit are planned; results will be published when available. Never assert an audit that does not exist.
- Describe the guardian role honestly: **pause + accept association roots only** — it cannot move, mint, or freeze funds.
- MaskedUSD is **not a mixer/tumbler**; privacy is **opt-in and lawful-use-only**.
- Keep **$MUSD** framed as volatile, unbacked, no-yield, and not an investment.

## Security & responsible disclosure

The protocol is **non-custodial** (operators never hold user funds or keys) and its contracts are **immutable** and verified on Basescan.

If you discover a security vulnerability, **please do not open a public issue.** Email **[support@maskedusd.com](mailto:support@maskedusd.com)** with details and reproduction steps, and give us a reasonable window to respond before any public disclosure. We appreciate responsible disclosure and will credit reporters who wish to be named.

## License

This project is licensed under the **[Apache License 2.0](./LICENSE)**. By contributing, you agree that your contributions will be licensed under the same terms.

## Contact

<div align="center">

[![Website](https://img.shields.io/badge/Website-maskedusd.com-8B6FE0?style=flat-square)](https://www.maskedusd.com)
[![X](https://img.shields.io/badge/X-@MaskedUSD-000000?style=flat-square&logo=x)](https://x.com/MaskedUSD)
[![Telegram](https://img.shields.io/badge/Telegram-maskedusd-229ED9?style=flat-square&logo=telegram&logoColor=white)](https://t.me/maskedusd)
[![GitHub](https://img.shields.io/badge/GitHub-maskedusd-181717?style=flat-square&logo=github)](https://github.com/maskedusd)

**Whitepaper:** [maskedusd.com/whitepaper](https://www.maskedusd.com/whitepaper) · **App:** [maskedusd.com/app](https://www.maskedusd.com/app)

</div>
