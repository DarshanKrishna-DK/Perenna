# Perenna prize evidence status

Verified integration and committed redesign checkpoint on 6 November 2026. The checkpoint passed a production build, 162 automated tests and 28 browser checks. A later requirement audit identified further product gaps, tracked in the root TODO.md. Current uncommitted frontend changes are preserved and await full verification. There is no public application deployment or event submission. Source milestones are published to [feat/mvp](https://github.com/DarshanKrishna-DK/Perenna/tree/feat/mvp). Official resources are recorded in [sources.md](sources.md).

**Billing boundary:** the actual 0G API key uses mainnet credits/tokens. All 20 authorized attempts are consumed. Exact token cost and remaining balance are unknown. The separate 10 testnet 0G tokens are not API credit. The final private reply passed under the reduced 512-output-token cap. No additional inference is authorized. Hedera chain 296 and Arkiv Rabdi chain 7794095 transactions are testnet transactions.

The subsequent recovery/discovery milestone passed 204 independent automated tests, TypeScript, all 32 guarded browser checks and an isolated credential-free production build. The complete projection review passed its focused desktop/mobile checks too. A read-only HTTP 200 response from the already-paid capacity endpoint matched its original transaction. The new agreement index query reached Rabdi and returned no listings, as expected before its first authorized publication. No additional public write or payment is claimed.

| Target | Verified evidence and limit |
| --- | --- |
| Hedera x402 | The protected service endpoint settled 1,000 tinybars autonomously under a prior signed policy. Exact-quote goods payment settled 113,950 tinybars. A separately supplier-signed platform fee settled 950 tinybars. Delayed Mirror observations were reconciled against original IDs without duplicate transfers. |
| Hedera SPA | Reviewed registry runtime, bilateral activation, two scheduled 14,222-tinybar purchases under a 60-second cadence, simulated-dispute stop, on-chain pause, revocation and withdrawal are confirmed. The revoked agreement has zero remaining funding. |
| Arkiv | Five actual writes are confirmed with readback. A later live query retrieved both signed outcome commitments and changed supplier eligibility in opposite directions under the same threshold. |
| Arkiv standing discovery | Implemented coarse agreement index, current publisher query, version/expiry handling and explicit publication consent. Local tests passed and an unsigned 0.001 tGLM fee estimate is retained. No standing-discovery write is claimed; one additional write requires fresh approval. |
| Arkiv repository notes | Schema, friction, reach, rationale and use notes are consolidated below. Exact separate sponsor-requested document paths are not claimed fulfilled. Source licensing and AI disclosure are present. |
| 0G Private Computer | English/Hindi parsing, a seven-call public negotiation with three final quotes and a private Mango quote revision used actual mainnet-billed inference and retained request IDs. |
| 0G self-financing | Unproved. Actual testnet fee collection does not establish a supported route into funded 0G compute. Separate ledgers and human-funded credits are implemented. |

## Hedera transaction evidence

Registry: 0x70a836F8bEaDCF6Fe57278a0E1E6Ba25ad1dF637. Verified runtime hash: 0x0670d32069ae27c015ac89c4b75efc1311d9952aea8fe40df3dcde5e5affe0e4.

| Operation | Actual transaction reference |
| --- | --- |
| Registry deployment | 0x32bcdafd03a0213b5c49f41cef72f97ce84aaa910b370c798e2fbaa2f048ee2a |
| Signed-review 0.3 HBAR operating top-up | 0x16cf9611b7afef46b22442445d5da2a6080526554a961919751e481e72cfed6f |
| Protected service, 1,000 tinybars | 0.0.9185802@1793932008.022979442 |
| Exact goods quote, 113,950 tinybars | 0.0.9185802@1793932488.952122805 |
| Separate supplier fee, 950 tinybars | 0.0.9185802@1793932623.525927824 |
| Buyer agreement creation | 0x2a9338c49b776e91e0dd2d10cf6220d803638fca6e710182d6071b2c7d02742f |
| Supplier acceptance | 0xaefeadb80ccafd8dded07cd6f5104de51b0fafdc103b2ef01fac7475d8746006 |
| Autonomous order one | 0xcdecf2a288eab2c9932a486d7eab83219ecc6fdf963fb26cf810ae96a3777bf6 |
| Autonomous order two | 0xf177f45f526fa0078956bb8893d844d5f919f0325b7f768d44084cd279216295 |
| Dispute pause | 0x9718247d7c879e3b9890195df53876ce8779b21829d39b49d865c6cc7c9388a4 |
| Revocation | 0x5e024d79b6d0c9dd60ad98bedd1f1c6f171e793a3768b2e1d99d0344cbebc310 |
| Withdraw unused funding | 0x0e719e81d6b672f6b7bc5f02555ccb8e7be754e965128c380500ff8e559ac562 |

The conservative combined Hedera upper bound is 6.19513096 HBAR, below the approved 10. It includes retained maxima where exact EVM fee attribution remains unverified. It is not an actual-spend claim. No submitted transaction outcome remains unknown. The failed original account creation and rejected unsigned SPA preparation are preserved. The latter's stale local ledger reservation was corrected to released with an audit event, without a network transaction.

## Arkiv write and decision evidence

Dedicated writer: 0x9253705482a44e6A7378163e57cc791AE6213ed5. All five authorized writes are consumed. Each retained maximum was 0.001 tGLM, with a combined retained maximum of 0.005 tGLM, within the original 0.002-per-write and 0.01-total limits.

| Record | Confirmed entity key | Transaction hash |
| --- | --- | --- |
| Initial request | 0x081f70af2a264d61b5e7262118065628dcdc4f8a9fb8e7aab34aecabd3f809a0 | 0x910b56e710ae93ef27a756a79d50fddc5eea94cd043d2971a4ba4da23a5812fa |
| Revised request | 0xa0b97c98f56022865db9375f3065ee010655a79b5c8d3776393d3ceb9153f562 | 0x17c3cd5f5cd5b923bb75edb422e41f8690f5fc63479b01992138ffd2861aaadb |
| Signed simulated receipt | 0xe9247f6328ca0206cfd5bc8a2e616c3e09915bd27263fe22d4a6dad53d4154fc | 0x06f7208716870d540e4001cbab4483c0cf3da2cb4e6c1d85f63e1a0310e3f06c |
| Signed simulated dispute | 0xa6eb088913ad08fef5633fe47113cbfba63e18a294a144184bb984dfefcb0db4 | 0x452a319867f2b025b2c8c531eb88aedc5c5e2b4ce0c84e00a0f8f8ff23e3e154 |
| Future request | 0x58dbef17a157cfef05006adae317f8f86cbd6bbd663bf4c5b55b0b4f44a8b963 | 0x9fb1ca737a291da3ca193d80f0a76bb275d5fe45bb1d4b8a4430207a174a6553 |

A fresh live query under credibility threshold 80 changed Monsoon from 78/ineligible to 80/eligible after the bilateral received claim, and Mango from 91/eligible to 79/ineligible after the bilateral disputed claim. Both claims retain simulated physical-event provenance. Full private claims, authority, acknowledgments, versions, expiry and publisher bindings were reverified; the outcome is not inferred merely from a logged write.

## Inference evidence and limits

English request: 15540326-38ce-4061-ba4c-152510a3756e. Hindi request: 72e5bba5-90aa-4e18-a250-b59995d51137. The live-Arkiv negotiation completed seven actual turns and three structured offers. Private reply 67f0e961-0d55-480b-8981-d97fc2f3a2c1 produced Mango quote version two, changing unit price from 2200 to 2150 INR minor units and landed total to 120575. Paid inference is now paused at the exhausted 20-call allowance.

Four Sarvam English/Hindi synthesis-to-transcription calls passed; human microphone and listening acceptance remain unverified. No Groq inference ran. The [0G billing documentation](https://docs.0g.ai/developer-hub/building-on-0g/compute-network/router/account/deposits) distinguishes funding layers; no automatic earned-fee conversion or credited-compute cycle has been established.

Physical delivery, dispute events and the supplier catalogue are synthetic. Signatures do not establish independent counterparties or physical truth. The current [Hedera skill-rubric assessment is 63/100](06_Hedera_Feasibility_Review.md); it is an assistant assessment, not an official sponsor score.

## Consolidated Arkiv implementation notes

The schema, use, rationale, friction and reach notes are kept together here alongside the existing manual guide.

| Schema | Public fields and filtering |
| --- | --- |
| `perenna.intent.v2` | Canonical item, coarse city, unit and quantity; distinct `requestExpiresMs` and `deliveryDeadlineMs`, plus delivery timezone; request/policy versions, created time, business commitment, request commitment and schema version. No raw tenant or intent UUID, exact address, contact or budget. Discovery binds the confirmed entity key, expected creator/owner, immutable flags, current versions/commitments, future request expiry and current chain-block expiry. |
| `perenna.evidence.v2` | Indexed evidence digest, supplier commitment, issuer, role and expiry; outcome, simulation flag, signature bytes, order-reference commitment and schema version. Full claims and acknowledgments stay private and are reverified before a matching public commitment can affect screening. |

Runnable query entry points are `discoverIntents(writer, area, {projection, entityKey, expiresAtBlock})` and `discoverEvidence(writer, subjectCommitment)` in `src/providers/arkiv.ts`. Negotiation calls `refreshArkivDiscovery` before live screening. The separately configured `local_sample` mode records its provenance and supplies no Arkiv-write evidence.

Arkiv supplies expiring, wallet-attributed public coordination and evidence commitments. Raw tenant/intent UUIDs, authentication, exact delivery addresses, contact data, budgets, conversations and commercial quotes remain private. The request commitment hashes canonical private terms with private tenant/request UUID context. Request expiry closes offers; delivery deadline is separate. Chain retention is independently checked, and expiry does not guarantee deletion from every observer.

Observed implementation friction: SDK 1.0.1 requires exact typed encoding and careful nonce/gas handling. A 65-byte signature represented as a hex string exceeds a short string field, so evidence v2 stores signature bytes. Unsigned preparation refuses signing/broadcast; funded publication captures the signed hash before forwarding and retains uncertain outcomes under an account-wide lock. Actual intent and bilateral evidence writes, readback and their measured screening effects have passed.

Reach remains unvalidated: no external customer trials, real suppliers, measured adoption or organizer outreach have occurred. Source is MIT licensed and AI assistance is disclosed in the README. Periodic Git pushes to the existing Perenna repository are authorized, and the first `feat/mvp` milestone is being prepared. No successful push is claimed. Application hosting, event submission and video release remain separate from that Git authorization.
