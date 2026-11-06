# Perenna prize evidence status

Build checkpoint on 6 November 2026. The local application exists and implementation continues. No public application deployment or event submission has been made. The separately authorized Hedera testnet registry deployment is recorded below. Official sources and uncertainties are recorded in [sources.md](sources.md).

**0G billing correction:** the user confirmed that the configured API key is a mainnet inference key. Its calls consume mainnet credits/tokens. Exact mainnet token consumption and remaining balance are unknown and have not been verified. All 20 historically authorized calls are consumed, so no further 0G call is authorized. The separate 10 testnet 0G tokens are not an inference-credit balance or an additional allowance. Hedera chain 296 and Arkiv chain 7794095 remain testnet blockchain transactions; they do not determine 0G API billing.

| Target | Required product evidence | Current evidence or gap |
| --- | --- | --- |
| Hedera x402 | Protected endpoint; autonomous paid request under earlier policy; actual settled transaction and HashScan link | Actual protected service purchase `95ec2b50-8a0c-4060-83a8-197a078b9082` confirmed with HTTP 200 and one native payment of 1000 tinybars. The unsigned failed attempt and explicit retry are preserved. One-off goods payment remains unverified. |
| Hedera SPA feature | Bilateral authority; compatible deployed/tested registry; repeat-order settlement; cap/dispute/replay controls | Deployed registry runtime matches the reviewed hash. Buyer creation and supplier acceptance are application-confirmed. Two real scheduled orders paid 14222 tinybars each under prior bilateral authority and a 60-second cadence, without new per-order approval. A later simulated dispute stopped local execution; exact onchain pause is application-confirmed. |
| Arkiv from scratch | Safe expiring requests/evidence, real writes and visible queries affecting decisions | Two actual writes are confirmed with readback, using two of five approved writes. Current request version 2 under policy 3 passes live discovery. Signed credibility-evidence publication and its screening effect remain unverified. |
| Arkiv repository evidence | /arkiv/schema.md, friction.md, reach.md, why-arkiv.md, how-you-use-arkiv.md; license and AI disclosure | Notes are consolidated here; the sponsor's exact separate paths remain unfulfilled. License and AI disclosure exist. |
| 0G Private Computer | Main-flow inference and request IDs; usable application and appropriate demo | Actual calls used the user-confirmed mainnet-billed API key. Live-Arkiv public negotiation completed three quotes; English/Hindi parsing and the private Mango revision also succeeded. The final private reply used the 512-token ceiling. All 20 authorized calls are exhausted. Exact mainnet token cost and balance remain unverified. |
| 0G self-funding candidate | Earned funds reaching compute credit, subsequent paid inference, cap/low-balance behavior and no manual top-up | Revenue-to-compute funding is unverified. Mainnet inference usage occurred, but no earned-revenue attribution or automatic conversion route has been established. |
| Shared submission | Accurate public source/history, AI and prior-work disclosure, video and any required live link | Periodic pushes to the existing Perenna repository are authorized. The first `feat/mvp` milestone is being prepared; no commit or push success is claimed here. Application hosting and event submission remain separate. |

Current official event details allow three partner selections and multiple tracks under one partner counting as a single partner selection. The intended partners remain Arkiv, Hedera, and 0G. Do not select or build additional sponsors without a product decision.

During the build, append actual evidence references with code revision, command, time, selected runtime/SDK, request/transaction ID, observed outcome, and limitation. Keep mocked test evidence visibly separate from real provider evidence. Mark unavailable requirements as gaps rather than creating plausible-looking IDs or screenshots.

Latest verification: 161 tests across 39 Vitest files and the production build passed.

Earlier local checkpoint: TypeScript and the production build passed. Twenty-nine Vitest files passed 118 tests. Production browser verification passed 22 interface scenarios plus six accessibility/realtime scenarios across desktop and mobile. This includes all eight screens, actual two-session messaging/reconnection/isolation, automated WCAG A/AA checks, signed-review gating, wallet rejection, linked amendments, null/currency clarification and timezone/DST handling. Financial browser fixtures were controlled and did not sign or spend. Four real Sarvam requests passed English and Hindi synthesis-to-transcription checks; live human microphone and listening acceptance remain pending. Dependency audit found zero advisories. These checks do not establish live blockchain integration or completion of the MVP.

Arkiv setup: dedicated writer `0x9253705482a44e6A7378163e57cc791AE6213ed5`; Rabdi chain 7794095 and faucet funding of 10 tGLM are confirmed. Two of five approved writes are used, each bounded by 0.002 tGLM and all writes by 0.01 tGLM. The private key remains only in ignored local configuration.

Actual confirmed Arkiv writes and readback:

| Request snapshot | Entity key | Transaction |
| --- | --- | --- |
| Initial snapshot | `0x081f70af2a264d61b5e7262118065628dcdc4f8a9fb8e7aab34aecabd3f809a0` | `0x910b56e710ae93ef27a756a79d50fddc5eea94cd043d2971a4ba4da23a5812fa` |
| Current request version 2, policy 3 | `0xa0b97c98f56022865db9375f3065ee010655a79b5c8d3776393d3ceb9153f562` | `0x17c3cd5f5cd5b923bb75edb422e41f8690f5fc63479b01992138ffd2861aaadb` |

Both writes were confirmed and read back. The current snapshot passes live discovery with its exact entity key, current version/policy and commitments. A subsequent real seven-call 0G negotiation completed three quotes against this live-discovered request. Signed credibility-evidence publication remains unverified.

Earlier read-only Arkiv checks (legacy intent v1): `artifacts/arkiv-read-smoke.json` records scoped queries with zero entities. `artifacts/arkiv-preparation-http.json` records an older unsigned preparation with zero balance. These historical observations are superseded by the actual current-schema write/readback references above.

Earlier Hedera balance observation: `artifacts/funds-http-smoke.json` records HTTP 200 and buyer balance 99320913972 tinybars, with observation time `2026-11-06T01:00:23.095Z`. Later role setup is verified and funded: operating/executor `0.0.11332965`, SPA supplier `0.0.11332983`, fee/top-up `0.0.11332984`. Original native merchant `0.0.9823983` is preserved. The conservative setup commitment is 4.5233928 HBAR, including the deployment reserve and original failed fee. Account creation was approved up to 1.1 HBAR per role inside the shared 10 HBAR ceiling.

The 0.3 HBAR operating top-up succeeded in transaction [`0x16cf9611b7afef46b22442445d5da2a6080526554a961919751e481e72cfed6f`](https://hashscan.io/testnet/transaction/0x16cf9611b7afef46b22442445d5da2a6080526554a961919751e481e72cfed6f). The application confirmed the exact signed review and receipt with HTTP 200. This is funding evidence, not an x402 service purchase or goods settlement.

Actual x402 service purchase: `95ec2b50-8a0c-4060-83a8-197a078b9082`, amount 1000 tinybars, native transaction [`0.0.9185802@1793932008.022979442`](https://hashscan.io/testnet/transaction/0.0.9185802-1793932008-022979442). The protected application response returned HTTP 200 after confirmation. There is one original payment: the earlier proven unsigned failure and the explicit retry remain in the attempt history, without duplicate signing or payment.

SPA deployment: compiler 0.8.38, Paris EVM target, viaIR and optimizer 200. Registry `0x70a836F8bEaDCF6Fe57278a0E1E6Ba25ad1dF637` was deployed in transaction [`0x32bcdafd03a0213b5c49f41cef72f97ce84aaa910b370c798e2fbaa2f048ee2a`](https://hashscan.io/testnet/transaction/0x32bcdafd03a0213b5c49f41cef72f97ce84aaa910b370c798e2fbaa2f048ee2a). Its runtime matches reviewed hash `0x0670d32069ae27c015ac89c4b75efc1311d9952aea8fe40df3dcde5e5affe0e4`. Fee attribution remains unresolved, so the conservative 1.51863756 HBAR maximum remains reserved. That maximum is not reported as the actual charge.

Application-confirmed bilateral SPA activation and scheduled execution:

| Step | Confirmed transaction | Outcome |
| --- | --- | --- |
| Buyer creation | `0x2a9338c49b776e91e0dd2d10cf6220d803638fca6e710182d6071b2c7d02742f` | Exact funded agreement created |
| Supplier acceptance | `0xaefeadb80ccafd8dded07cd6f5104de51b0fafdc103b2ef01fac7475d8746006` | Prior bilateral authority active |
| Scheduled order 1 | `0xcdecf2a288eab2c9932a486d7eab83219ecc6fdf963fb26cf810ae96a3777bf6` | 14222 tinybars confirmed |
| Scheduled order 2 | `0xf177f45f526fa0078956bb8893d844d5f919f0325b7f768d44084cd279216295` | 14222 tinybars confirmed |

The scheduled orders followed the signed 60-second cadence without per-order human approval. A simulated dispute on order 2 immediately stopped local future execution. Onchain pause [`0x9718247d7c879e3b9890195df53876ce8779b21829d39b49d865c6cc7c9388a4`](https://hashscan.io/testnet/transaction/0x9718247d7c879e3b9890195df53876ce8779b21829d39b49d865c6cc7c9388a4) was confirmed by the application with HTTP 200 and status `paused`. This is an intentionally simulated physical dispute. The earlier nonce-serialization preparation failure remains rejected with no payload or transaction hash; it was not reset or treated as payment. One-off goods settlement, separate supplier fee collection and signed evidence publication remain unverified.

Native role-creation transaction `0.0.6886052-1793929735-629904636` failed at consensus with `INSUFFICIENT_TX_FEE` and charged 0.0029589 HBAR. No account was created. Preserve the original transaction and do not resend it.

Native 0G parsing succeeded in English (request `15540326-38ce-4061-ba4c-152510a3756e`) and Hindi (request `72e5bba5-90aa-4e18-a250-b59995d51137`). The later live-Arkiv public negotiation used seven more calls and completed three quotes. The final private Mango reply used request `67f0e961-0d55-480b-8981-d97fc2f3a2c1` and produced immutable quote version 2: unit price 2150 minor INR versus 2200, total 120575 minor INR. It succeeded under the new 512-token ceiling and exhausted the 20-call allowance. No further 0G calls are authorized. No additional call budget is authorized. At the user's request, the configured output ceiling was lowered from 900 to 512 tokens; 12 focused tests passed for that conservative limit. Earlier calls retain their historical ceiling. None of these calls establishes earned-revenue funding of compute.

The reviewed [0G billing documentation](https://docs.0g.ai/developer-hub/building-on-0g/compute-network/router/account/deposits) describes deposits into the 0G Payment Layer and distinguishes Router funds from Direct provider subaccounts. The user has now confirmed mainnet billing for the actual inference key. Exact consumed mainnet tokens, remaining balance and the funding source have not been verified. No account or credit query was performed for this correction. No supported automatic Hedera-fee-to-0G-credit route has been established; successful mainnet-billed inference does not establish earned-revenue funding.

## Consolidated Arkiv implementation notes

The schema, use, rationale, friction and reach notes are kept together here alongside the existing manual guide.

| Schema | Public fields and filtering |
| --- | --- |
| `perenna.intent.v2` | Canonical item, coarse city, unit and quantity; distinct `requestExpiresMs` and `deliveryDeadlineMs`, plus delivery timezone; request/policy versions, created time, business commitment, request commitment and schema version. No raw tenant or intent UUID, exact address, contact or budget. Discovery binds the confirmed entity key, expected creator/owner, immutable flags, current versions/commitments, future request expiry and current chain-block expiry. |
| `perenna.evidence.v2` | Indexed evidence digest, supplier commitment, issuer, role and expiry; outcome, simulation flag, signature bytes, order-reference commitment and schema version. Full claims and acknowledgments stay private and are reverified before a matching public commitment can affect screening. |

Runnable query entry points are `discoverIntents(writer, area, {projection, entityKey, expiresAtBlock})` and `discoverEvidence(writer, subjectCommitment)` in `src/providers/arkiv.ts`. Negotiation calls `refreshArkivDiscovery` before live screening. The separately configured `local_sample` mode records its provenance and supplies no Arkiv-write evidence.

Arkiv supplies expiring, wallet-attributed public coordination and evidence commitments. Raw tenant/intent UUIDs, authentication, exact delivery addresses, contact data, budgets, conversations and commercial quotes remain private. The request commitment hashes canonical private terms with private tenant/request UUID context. Request expiry closes offers; delivery deadline is separate. Chain retention is independently checked, and expiry does not guarantee deletion from every observer.

Observed implementation friction: SDK 1.0.1 requires exact typed encoding and careful nonce/gas handling. A 65-byte signature represented as a hex string exceeds a short string field, so evidence v2 stores signature bytes. Unsigned preparation refuses signing/broadcast; funded publication captures the signed hash before forwarding and retains uncertain outcomes under an account-wide lock. Actual intent writes and readback have now passed. Signed credibility-evidence publication and its screening effect remain pending.

Reach remains unvalidated: no external customer trials, real suppliers, measured adoption or organizer outreach have occurred. Source is MIT licensed and AI assistance is disclosed in the README. Periodic Git pushes to the existing Perenna repository are authorized, and the first `feat/mvp` milestone is being prepared. No successful push is claimed. Application hosting, event submission and video release remain separate from that Git authorization.
