# Perenna

### Prepare an unsigned SPA deployment

Run `node --env-file=.env.local scripts/prepare-spa-deployment.mjs PUBLIC_BUYER_EVM_ADDRESS` after selecting the actual Hedera testnet buyer address. This compiles the agreement with the same Paris-targeted settings used by its local bytecode tests and performs read-only chain-ID, gas and fee estimation. No key is read, transaction signed, funds deposited or contract deployed. The result is written to ignored `artifacts/spa-deployment-preparation.json` with its bytecode hash, unsigned transaction and a fee ceiling. If estimation fails, do not sign. After reviewing a successful result, obtain explicit approval for the actual network, sender, bytecode and maximum testnet fee before wallet deployment. Record the confirmed contract address as `HEDERA_SPA_CONTRACT`; deployment does not activate or fund any agreement.

Business moves smarter.

A local English/Hindi procurement workspace with separate authority for one-off purchases, standing agreements and agent service requests. Implementation is in progress. Provider configuration does not establish a successful integration.

## Local development

Use Node.js 24 and npm. Install with `npm ci`, keep private configuration in `.env.local`, and run `npm run dev`. Open http://127.0.0.1:3000. Private SQLite data is stored in the ignored data directory. The interface uses fictional supplier fixtures; physical fulfillment controls record simulation provenance.

Run `npm run worker` in a second terminal for queued agent negotiations. Keep the worker on the same private database and environment as the web server. Interrupted inference jobs require an explicit review and retry because a timed-out request can still consume provider credits.

Run `npm run typecheck`, `npm test` and `npm run build` for local verification. Automated provider tests use controlled responses and do not establish live provider behavior.

With the local server running, run `npx playwright test -c tests/browser/playwright.config.ts` for the retained browser acceptance suite. This uses an isolated local test browser and does not access personal Chrome sessions. Ignored screenshots and results are written under `artifacts/browser`.

## Provider execution

See `.env.example` for configuration names. Keys stay server-side. Execution flags default to disabled. Actual inference, speech, publication, signing and settlement require their explicit budgets and identities. An unavailable provider pauses its dependent action; it must never generate a fabricated payment receipt or live transcript.

The user confirmed that the configured 0G inference API key uses **mainnet credits/tokens**. The recorded inference calls consumed that funded allowance. Exact mainnet token consumption and remaining balance are unknown and have not been verified. The historical 20-call authorization is exhausted; no further 0G call is authorized. The configured output ceiling is 512 tokens. The separate 10 testnet 0G tokens are not an inference budget and do not extend that authorization. Hedera chain 296 and Arkiv Rabdi chain 7794095 transactions use their respective testnets; 0G API inference billing is separate.

Goods, operating-service and supplier-fee signing identities have separate configuration. A quote freezes its indicative INR terms and explicit testnet denomination. The denomination is a demo conversion, not an exchange rate. A confirmed goods payment does not establish platform fee revenue. Fee collection requires a separate supplier authorization and matching settlement receipt.

For a raw native Hedera private key, configure its role-specific key type as `ecdsa` or `ed25519`. DER-encoded keys carry their own type. The adapter rejects an ambiguous raw key rather than assuming a curve. EVM wallet transactions require ECDSA-capable accounts.

Hedera contract balances, ABI monetary arguments and Solidity transfer amounts use eight-decimal tinybars. JSON-RPC transaction funding values and gas prices use 18-decimal weibars. Only the relay funding value is multiplied by `10^10`; ABI caps and execution amounts are not. Tests decode the calldata and model contract balances in raw tinybars. The local EthereumJS VM does not implement Hedera relay conversion, so its passing tests do not establish Hedera network compatibility. See the [official denomination guide](https://docs.hedera.com/evm/differences/hbar-decimals).

Standing agreements freeze bilateral terms, caps, recipients and validity. Automatic scheduling is an explicit signed option and defaults off. The worker checks current inventory, price, business policy and contract authority before each scheduled execution. Local cancellation stops future work immediately; submitted transactions remain under reconciliation. Physical dispatch and receipt controls are simulated and retain that provenance.

## Data and authority

SQLite stores private business records, session hashes, workflow events, reservations and reconciliation references. Passwords use scrypt. Every API record lookup resolves the authenticated business, and mutation requests enforce origin checks. The local worker uses durable jobs and leases. An expired lease never silently replays a potentially charged inference request.

This local demonstration uses operator-managed testnet role wallets. Wallet observations and pending commitments identify their shared-wallet scope; business records, approvals, session limits and business-day limits remain business-scoped. The server binds to loopback for the single-host demonstration.

Arkiv receives a reviewed minimal public projection with expiry. Live discovery queries the expected writer and validates retrieved evidence before screening. `ARKIV_DISCOVERY_MODE=local_sample` is an explicit development mode and does not establish a blockchain integration. Signed acknowledgments establish attributed statements, not physical truth or legal business identity.

## Evidence and licensing

The source is MIT licensed. Perenna was developed with AI assistance, including parallel coding agents and generated original SVG agent artwork. Standard SDK and third-party skill notices are preserved. No public deployment or submission is implied by the local source. Current verification results and remaining live gates are in [docs/prize-evidence.md](docs/prize-evidence.md).

## Demo sequence

1. Create a business workspace, review its profile and switch between English and Hindi. Save a corrected coffee-bean request with quantity, deadline, location and budget.
2. Review the minimal public projection. With an authorized funded Arkiv writer, publish and confirm the request, then use live discovery. Local sample discovery is a separate development mode.
3. Review the retained agent turns, excluded suppliers and structured offers. Request a new model negotiation only after a fresh explicit mainnet inference allowance; the existing 20-call authorization is exhausted. Compare structured delivery and landed-price terms.
4. Approve one exact quote. With authorized testnet identities configured, obtain the x402 challenge, settle once and inspect the matching receipt. An unknown result must be reconciled before another attempt.
5. Record explicitly simulated physical events, then sign and counterparty-acknowledge the resulting evidence. Publish the safe projection and show its effect on later screening.
6. Review and bilaterally activate a funded standing agreement. Opt into its fixed schedule before signing. Show one permitted repeat order without new approval, a blocked changed-price request and an immediate dispute stop. Review onchain pause or revocation separately.
7. Sign a separate bounded operating policy. Request the protected capacity assessment and inspect its actual HTTP 402, payment and useful response. Fee revenue remains pending until separately approved supplier fee collection is confirmed.

Steps requiring funded writers or confirmed transactions remain pending until the manual setup gates are completed. The walkthrough is a reproducible sequence, not a claim that its live blockchain steps have already run.

The implementation brief is in [docs/03_Perenna_Codex_Master_Prompt.md](docs/03_Perenna_Codex_Master_Prompt.md). Current preparation and manual requirements are in [docs/04_Perenna_Manual_Setup_Guide.md](docs/04_Perenna_Manual_Setup_Guide.md).
