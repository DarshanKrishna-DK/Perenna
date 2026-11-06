# Perenna feasibility review using Hedera skills

Reviewed again on 6 November 2026 during implementation. **The local prototype now runs; required live blockchain and market validation remain incomplete.** Source, durable storage, responsive screens, automated tests and real 0G negotiation exist. The seven-call negotiation produced three final quotes. No confirmed Hedera settlement, deployed testnet standing agreement or live Arkiv write/query has been established.

## Method and evidence

Applied the official Hedera `hackathon-prd` and `validate-submission` guidance to the supplied documents, with `x402-payments`, `agent-kit-policy`, and `hts-system-contract` for technical constraints. They are pinned to upstream commit `8b1fccd8ccbbe73e928037b76028caf79900b12e` and installed in [.agents/skills](../.agents/skills/). Track descriptions and product answers already exist in the brief and official pages, so a repeat questionnaire would add no evidence. This review supplements the supplied PRD rather than generating a competing root PRD.

The helpers use a generic seven-part Hedera rubric. Mumbai's [actual judging page](https://ethglobal.com/events/mumbai/info/details/) uses Technicality, Originality, Practicality, Usability, and WOW Factor. The skill does ask for numeric scoring. The assessment below applies its rubric to current evidence, with no prediction of an official judging result or winning probability.

## Hedera skill score for the current project

**Provisional current-readiness score: 43/100 weighted, or 16/35 before weighting.** The earlier pre-build baseline was 32/100. The increase reflects implemented source, passing local checks and genuine provider-driven negotiation. It does not establish demand, Hedera transaction success or official judging outcomes.

| Criterion | Score | Weight | Contribution out of 100 | Evidence and next improvement |
| --- | --- | --- | --- | --- |
| Innovation | 3/5 | 10% | 6 | Bilingual procurement, bounded standing agreements and independent service payments form a coherent proposal. Originality is not proved. Demonstrate a useful difference for a real target buyer. |
| Feasibility | 3/5 | 10% | 6 | The boundaries and provider roles are specified. Prove SPA enforcement and real provider access; the revenue-to-compute route remains unresolved. |
| Execution | 3/5 | 20% | 12 | Production compilation, 118 automated tests and 28 browser scenarios passed at this checkpoint. Durable workflows, private agent replies, signed top-ups and local contract execution exist. Required live blockchain happy paths remain incomplete. |
| Integration | 2/5 | 15% | 6 | Native 0G negotiation and Sarvam English/Hindi round trips succeeded. Hedera x402, SPA and Arkiv adapters are implemented and controlled-tested, but no actual blockchain settlement or published entity has been proved. |
| Validation | 1/5 | 15% | 3 | No external user trials or willingness-to-pay evidence is available. Conduct an observed buyer/supplier workflow trial when the prototype exists. |
| Success | 1/5 | 20% | 4 | No demonstrated users, active business accounts or settled product usage. Measure actual useful transactions without padding counts with seed data. |
| Pitch | 3/5 | 10% | 6 | The documents explain the problem, workflow and limits. A clear human-narrated demo and evidence-based outcome are still missing. |
| Total | 16/35 unweighted | 100% | 43 | Implementation checkpoint, not an official submission grade. |

Calculation: sum of `(criterion score / 5) * criterion percentage weight`. Scores are the assistant's judgments using the installed skill. The skill is a set of instructions, not an independent scoring service or a Hedera certification.

The highest-impact remaining improvements are a complete authorized settlement flow, live Arkiv decisions, external feedback and measured repeat usage. Moving Integration from 2 to 3 would add three weighted points; Validation from 1 to 3 would add six. These require new evidence and a fresh review.

The Hedera integration gate remains unmet until an authorized agent completes a paid protected HTTP request and confirmed settlement. A protocol capability response, wallet connection or ordinary goods transfer does not close that gate. The plan preserves the separate service-purchase demonstration and treats SPA enforcement as an additional product requirement.

The [Hedera Docs MCP check](tooling/hedera-docs-mcp-check.json) completed initialization, tool discovery, and `search_hedera`. A [public facilitator capability response](tooling/x402-supported.json) advertised x402 v2, `exact`, `hedera:testnet`, with fee payer `0.0.9185802`. This was a GET discovery request, not verification or settlement of a signed payment. The [Arkiv MCP check](tooling/arkiv-mcp-check.json) identified the General profile and reported a fresh Rabdi chain-ID probe. It did not write or read a Perenna entity.

## Product hypothesis

Small businesses may benefit from translating a voice request into comparable supplier offers and repeat procurement under explicit rules. The strongest proposed demonstration combines Hindi/English interaction, real negotiation, exact authorization, and an exception that stops an unsafe repeat order. It is more persuasive than a long transcript or decorative transaction counter. This is a design judgment based on the brief, not observed customer evidence.

No interviews, external trials, purchasing behavior, willingness-to-pay results, or competitor study were supplied or performed. Originality and demand remain unvalidated. Next validation should ask a few target buyers and suppliers to walk through a recent real procurement task, then compare their current process with a synthetic prototype. Measure correction of quantities/prices, understanding of permission limits, useful offers, and coordination effort. Obtain feedback through user-authorized outreach; none has been sent.

## Technical findings

| Area | Assessment | Evidence still required |
| --- | --- | --- |
| Bilingual procurement and live negotiation | Plausible application design | Authorized 0G calls producing materially different, valid offers; Sarvam English/Hindi recognition and playback |
| One-off goods approval | Well-defined safety boundary in the brief | Canonical quote/policy digest, stale-quote rejection, immutable revisions, cap and concurrency tests |
| Hedera autonomous service payment | Good documented protocol and track fit | Actual protected endpoint, signed payment within an earlier policy, confirmed settlement, useful response and HashScan evidence |
| Standing Procurement Agreement | Significant separate engineering gate | Bilateral signatures; deployed/tested registry; network/asset compatibility; reserve/consume enforcement; dispute/revocation races |
| Arkiv discovery and credibility | Matches the described expiring coordination use case | Actual authorized publication/query changing screening, signature verification, expiry and adverse evidence behavior |
| Agent operating economics | Separate ledgers are feasible; collection remains unproved | Actual disclosed fee collection and reconciliation, not a computed balance alone |
| Earned fees funding 0G | Unresolved interoperability and budget gate | Supported funding path, actual credited compute balance, then charged inference without a manual top-up |

The official [Hedera exact scheme](https://docs.hedera.com/solutions/ai/x402/exact-scheme) defines direct partially signed `TransferTransaction` settlement, with integer amounts and a facilitator fee payer. It is not an SPA contract invocation. Perenna must independently enforce the agreement before signing. A registry alone cannot force every native transfer through a contract. Prove the chosen signer/allowance/enforcement design and its bypass resistance before claiming onchain payment-authority enforcement. If x402 and the agreement cannot share that enforcement path, document the split and resolve the contract requirement explicitly.

The [x402 skill](../.agents/skills/x402-payments/SKILL.md) focuses on a self-hosted native-HBAR facilitator. The implementation uses the installed official x402 Hedera packages with the hosted testnet capability path. No extra token or self-hosted facilitator has been introduced. SDK and controlled-test evidence still require actual authorized network settlement.

The [Agent Kit policy skill](../.agents/skills/agent-kit-policy/SKILL.md) warns that its hooks protect `BaseTool` implementations only. Hooks are not sufficient financial authorization. Apply deterministic policy, atomic reservations, and tenant checks at every signing/payment boundary, including code outside Agent Kit. The skill does not require adopting Agent Kit as the application architecture.

The [HTS contract skill](../.agents/skills/hts-system-contract/SKILL.md) identifies asset-association, token-key, response-code, and fee considerations if an HTS design is chosen. It supplies no SPA contract and proves no deployed compatibility. Prefer the smallest supported test asset after a real capability and authorization check; avoid token creation unless required by that design.

## What blockchain contributes

The web application can coordinate messages and calculate rankings using ordinary private storage. The proposed cross-business benefit of Arkiv is independently queryable, wallet-attributed, expiring public coordination and evidence. Hedera adds independently observable programmable settlement. These benefits need to appear in an actual user feature. Neither chain establishes real supplier identity, physical delivery, quality, independence of counterparties, or legal enforceability.

Keep membership, private negotiations, delivery addresses, confidential prices, voice, and signing secrets in access-controlled local/server storage. Publish only the reviewed minimum projection. Signed acknowledgments prove attributable statements; simulated fulfillment must stay identified as simulated. Expiry is not guaranteed erasure from every observer.

## Sponsor and event fit

| Target | Current source finding | Perenna implication |
| --- | --- | --- |
| [Hedera: AI Agents That Pay](https://ethglobal.com/events/mumbai/prizes/hedera) | A protected endpoint and autonomous paid request, confirmed transaction, public repository, and short explorer-backed demo are required | A supplier invoice transfer or skill installation alone does not qualify; preserve the separate paid service path |
| [Arkiv: Build on Arkiv from scratch](https://ethglobal.com/events/mumbai/prizes/arkiv) | Actual writes and a visible feature reading them, plus schema/query/writer and repository evidence | Screening and request discovery must consume Arkiv results; logging alone is insufficient |
| [0G: Private Computer](https://ethglobal.com/events/mumbai/prizes/0g) | Meaningful main-flow inference and request IDs; the description emphasizes consumer apps | Technical role is coherent, but B2B positioning is a judging-fit concern to clarify with the sponsor |
| [0G: Agents That Pay for Themselves](https://ethglobal.com/events/mumbai/prizes/0g) | Earned money must reach compute credit and fund inference without a human top-up | Treat as exploratory; testnet accounting and sponsor credits do not close this gate |

The [event details](https://ethglobal.com/events/mumbai/info/details) currently list submission at **7 November 2026, 09:00 IST**, a three-partner cap, and multiple tracks under one partner counting as one partner selection. The retrieved 0G workshop listing also names 2026. These pages support the current event context, but team registration, chosen participation track, actual opening time, and project-specific eligibility were not checked in the authenticated dashboard.

The same event page permits AI assistance with disclosure and meaningful human contribution. Preserve these source prompts and planning artifacts and an honest implementation history. The generic `/rules` page is a code of conduct, and `/events/mumbai/rules` did not load during this review. Do not treat either as a complete eligibility audit.

Plan a human-narrated **2 to under 3 minute** video if a single artifact must satisfy the retrieved event upload range, 0G limit, and Hedera limit. Preparation does not authorize publication, deployment, or submission.

## Recommended decision

Proceed to implementation only when requested, using the parallel plan. Prove meaningful inference, an Arkiv write/query, and one bounded x402 payment early. Complete the one-off flow, then the required SPA path and separate autonomous service purchase. Continue only the independent work when an external gate is unavailable.

Do not cut SPA or required languages without a scope decision. Do not add HCS, a new token, bridges, or additional sponsors just for rubric points. Retain the self-funding path as an explicit unresolved experiment until a permitted route exists. See [sources](sources.md), [prize evidence gaps](prize-evidence.md), and [setup status](07_MCP_and_Skills_Status.md).
