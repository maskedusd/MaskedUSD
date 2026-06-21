# Vendored proving modules

`prove.ts`, `field.ts`, `notes.ts` are vendored **verbatim** from the private
protocol repo `maskedusd-protocol/sdk/src` (the only change: `notes.ts`'s
`./field.js` import → `./field` for Next/TS resolution). They are the JS mirror of
the Noir circuits + on-chain Poseidon and MUST stay bit-exact with them, or
client-built proofs won't verify on-chain.

**Do not edit here.** Re-sync from the SDK on any change. The protocol repo's
`test/BrowserProof.t.sol` (a real browser-built shield proof checked against the
deployed `ShieldHonkVerifier`) is the drift guard. Pins that must match the
deployed verifier VK: `@aztec/bb.js 5.0.0-nightly.20260522`,
`@noir-lang/noir_js 1.0.0-beta.22`, `poseidon-lite ^0.3.0`.

Circuit ACIR is served from `public/circuits/<name>.json` (built via
`nargo compile` in the protocol repo).
