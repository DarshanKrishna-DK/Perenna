# Perenna

Business moves smarter.

A local English/Hindi procurement MVP with agent negotiation, exact purchase approvals, independent operating funds and bilaterally bounded standing agreements. All eight pages use a pitch-black, neon-green Three.js world, the supplied logo, robotic typography and accessible spatial controls. Verification passed 162 automated tests and 28 browser checks, with actual desktop/mobile WebGL rendering and focused final readability checks.

## Run locally

Use Node.js 24 and npm. Install dependencies with `npm ci`, copy the configuration names from `.env.example` into private `.env.local`, then run `npm run dev`. On Windows, use `npm.cmd` if PowerShell blocks npm.ps1. Open http://127.0.0.1:3000.

For a production preview, run `npm run build` followed by `npm run start`. Start `npm run worker` separately only when a fresh execution allowance and signed policies authorize work. Keep the server and worker on the same private SQLite database. Preserve that database because it contains authority, usage and reconciliation history.

Run `npm run typecheck`, `npm test` and `npm run build` for verification. With the server running, use `npx playwright test -c tests/browser/playwright.config.ts` for guarded desktop/mobile, accessibility and realtime checks. These tests block unmocked provider, payment and publication calls. They do not use a personal Chrome profile.

Private credentials, wallet material, SQLite state, generated builds and test artifacts are excluded from Git. The root [TODO.md](TODO.md) tracks one-line completed and remaining items. [DESIGN.md](DESIGN.md) defines the shared visual system. The single [manual guide](docs/04_Perenna_Manual_Setup_Guide.md) records remaining owner actions.

## Verified integration boundaries

- Real 0G inference completed English/Hindi parsing, public three-supplier negotiation and a private quote revision. All 20 authorized attempts used the user-confirmed mainnet API key and are consumed. Exact token cost and remaining balance are unknown. The output limit is now 512 tokens. Ten testnet 0G tokens are not API credit or additional authority.
- Hedera chain 296 testnet verified the protected service purchase, exact goods settlement, separate supplier fee, signed-review top-up, bilateral SPA activation, two autonomous purchases, dispute pause, revocation and withdrawal.
- Arkiv Rabdi chain 7794095 verified five public writes and readback. Retrieved bilateral positive and adverse simulated-outcome commitments changed eligibility on a future request.
- Sarvam passed four actual English/Hindi synthesis-to-transcription calls. Human microphone and listening acceptance remain unverified. No Groq inference ran.

New paid inference, public writes and testnet execution are paused after the authorized verification. Retained receipts remain available. Fresh execution needs a new explicit bounded allowance; do not reset usage records to regain authority. See [prize evidence](docs/prize-evidence.md) for public transaction references and limits.

## Product and custody scope

Goods, operating services and supplier fees have separate signing roles and ledgers. Quotes freeze integer INR terms and an explicit testnet demonstration denomination, not a live exchange rate. A goods payment does not create fee revenue; a separate supplier authorization and matching receipt are required. Unknown outcomes stay reserved until reconciliation.

Standing agreements freeze counterparties, asset, quantity, price, cadence, expiry, cumulative limits and execution gas bounds. Buyer funding and supplier acceptance activate the contract. Scheduled purchases execute under that prior authority. Physical fulfillment and disputes are explicitly simulated; signatures establish statements rather than physical truth.

This local operator-managed demo uses configured test wallets shared across its business workspaces. Tenant isolation protects records and approvals, while a global allowance protects shared funds. It does not claim production multi-customer custody, independent supplier identity or commercial adoption.

No automatic Hedera-fee conversion into 0G compute is established. Separate ledgers and human-funded credits implement the master prompt's permitted boundary. No automatic mainnet bridging, swaps, top-ups or paid fallback is enabled.

For native Hedera raw keys, set each role's key type to ecdsa or ed25519. DER carries its algorithm. EVM transactions require ECDSA. Keys remain server-side; browser wallet reviews and exact signatures remain explicit.

## Read-only deployment preparation

Run `node --env-file=.env.local scripts/prepare-spa-deployment.mjs PUBLIC_BUYER_EVM_ADDRESS` to compile the registry with its tested Paris settings and estimate chain, gas and fee scope without signing. Review the exact bytecode, sender and maximum fee before authorizing a deployment. Set the confirmed registry address and runtime hash separately. Deployment alone does not activate or fund an agreement.

## Review the demo

1. Review the business profile, English/Hindi interface and a corrected buying request.
2. Inspect its minimal Arkiv projection, versions, expiry and discovery evidence.
3. Compare retained real agent turns, private-room scope and immutable quote revisions.
4. Inspect the exact approval, one-off payment receipt and independently approved supplier fee.
5. Review simulated fulfillment, bilateral attestations and their measured effect on later screening.
6. Inspect the bilateral standing terms, two autonomous receipts, stopped dispute, revocation and withdrawal.
7. Compare actual wallet observations, reserved limits and collected revenue; unknown compute credit remains unknown.

## License and assets

Source is MIT licensed and was developed with AI assistance. The brand logo was supplied by the project owner and is used unchanged as the logo and favicon. The courier geometry and interface components are authored for Perenna. Orbitron, Rajdhani and Noto Sans Devanagari fonts are hosted locally with their included license files. Installed SDK packages retain their own licenses.
