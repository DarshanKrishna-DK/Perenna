# Perenna Codex master prompt

Business moves smarter.

Latest version 2.0  |  5 November 2026

Build Perenna locally as a complete, dynamic testnet MVP. This document is the implementation brief: read it in full, inspect the repository and available tools, then build and verify the product. Do not stop at a plan, static screens, canned chat transcripts, or disconnected sponsor integrations. The intended result is a credible working demonstration, not a production financial service.

## 1 Working agreement

You are my implementation partner. Work in the selected local repository. This is a fresh build in the new repository I have already created and selected; I do not remember its name, and you do not need to ask for it. Do not reuse existing Perenna code or designs. First inspect AGENTS.md, any scaffold/source present, Git state, package manager, environment examples, tests, available skills, connectors and browser tools. Preserve unrelated changes and useful existing work. Read relevant engineering, frontend, security and testing skills. Use official provider documentation and installed versions rather than guessing SDK signatures. Do not print credentials, copy them into prompts or commit them.

Ask material questions early using an available clarification tool or concise chat. Continue independent work while waiting. If an optional preference remains unanswered, explain a reversible assumption and proceed. Silence never authorizes payments, purchases, disclosure, publication, deployment, account creation or other consequential actions. Block only the dependent step when credentials, permission or an essential decision are missing. Report exactly what is blocked, what works and what input is required. Do not repeatedly ask questions already answered by this brief or the repository.

I want the implementation in my local environment, not an unsolicited hosted deployment. Do not purchase services, add a paid plan, use real money, send external business messages, publish the repository or deploy publicly without my approval. Testnet signing and transactions require explicit bounded authorization for the relevant wallet, network and purpose. Never treat this prompt as permission to move mainnet assets. Use only free-tier services or credits I supply; do not call paid OpenAI or Anthropic APIs. An OpenAI-compatible client library is acceptable when its configured endpoint is an authorized non-OpenAI provider and there is no implicit default fallback.

Start with a short summary, a practical implementation sequence and a compact list of genuinely blocking inputs. Keep implementing and testing rather than presenting a plan as completion. Record decisions, source evidence and limitations in repository documentation.

## 2 Product and success criterion

Perenna is a bilingual procurement copilot for small businesses. A buyer describes a need in English or Hindi by text or voice. Its agent structures the intent, evaluates suppliers against the buyer's rules, negotiates with supplier agents in relevant shared and private rooms, compares live quotes and asks the buyer to approve an exact offer. An authorized testnet payment settles through Hedera x402. The product then tracks a clearly simulated delivery and updates evidence-backed supplier credibility.

One complete journey must work end to end: business onboarding; request capture; clarification and confirmation; time-bound intent publication; supplier discovery and eligibility; observable live negotiation; quote comparison; exact-version approval; testnet settlement and receipt; simulated fulfillment; signed credibility update. Changing inputs must change the result. Persist state across refreshes and recover interruptions without duplicate payment or duplicate order creation.

Use 0G Private Computer as meaningful core inference, Arkiv as meaningful expiring intent and signed evidence infrastructure, and Hedera x402 as real testnet settlement. These are target integrations, not claims of compatibility or prize eligibility. Verify them before committing to an architecture. If a provider is unavailable, keep the independent product functional with a visible integration status and honest blocker. Never substitute a mock and claim the sponsor requirement is complete.

## 3 Verify the event and integration requirements first

Read the current official ETHGlobal Mumbai rules and the exact 0G, Arkiv and Hedera partner prize pages. Confirm event year, deadline and timezone, eligible project category, limits on partner selection, AI disclosure, pre-existing work rules, required evidence, demo duration, repository requirements and track-specific conditions. Determine whether building in the current timeframe meets the rules. Do not manufacture eligibility or backdate commits.

Create docs/sources.md with verified URL, page title, access date, claim supported and any uncertainty. Create docs/prize-evidence.md mapping each selected requirement to implementation files, commands, screenshots, request IDs, transaction IDs or a clearly marked gap. Preserve current official source links. Never assert that three integrations automatically qualify for every track or guarantee prizes. Keep sponsor documentation tied to observable product behavior.

The following official URLs were identified in research dated 31 October 2026. Reopen and validate them; this starting list is not a current verification or endorsement of a particular SDK version:

- https://ethglobal.com/events/mumbai/info/details

- https://ethglobal.com/events/mumbai/info/start

- https://ethglobal.com/events/mumbai/prizes

- https://ethglobal.com/events/mumbai/prizes/0g

- https://ethglobal.com/events/mumbai/prizes/arkiv

- https://ethglobal.com/events/mumbai/prizes/hedera/

- https://ethglobal.com/rules

- https://docs.0g.ai/developer-hub/building-on-0g/compute-network/overview

- https://docs.arkiv.network/

- https://docs.arkiv.network/start-here/first-entity/

- https://docs.hedera.com/solutions/ai/x402

Fresh source checks supplied with this brief identify the following requirements; reverify them before implementation and preserve source evidence. The 0G prize requires the main flow to use 0G Private Computer with request IDs, and advertises team compute credits (https://ethglobal.com/events/mumbai/prizes). Testnet gas and compute credits are different resources (https://build.0g.ai/funding). Arkiv currently documents Rabdi chain ID 7794095 with tGLM (https://docs.arkiv.network/networks/rabdi/); do not hardcode this without checking current documentation.

The Hedera x402 prize requires at least one completed paid request without human approval at payment time. Implement an autonomous SERVICE payment within a policy the human configured beforehand. This is distinct from the goods purchase, which always requires explicit approval of the exact quote. Source: https://ethglobal.com/events/mumbai/prizes/hedera . Read https://docs.hedera.com/solutions/ai/x402/pay-with-x402 and https://docs.hedera.com/solutions/ai/x402/merchant-integration . The evidence must include a public repository, transaction ID and a video of no more than five minutes showing HashScan; check the current cross-partner video constraints too. Preparing these artifacts does not authorize publishing them.

Arkiv requires /arkiv/schema.md, /arkiv/friction.md, /arkiv/reach.md, /arkiv/why-arkiv.md and /arkiv/how-you-use-arkiv.md, plus writer addresses, a runnable query, public repository license and AI disclosure. Reverify the exact track conditions at https://ethglobal.com/events/mumbai/prizes/arkiv . Prepare these files with actual implementation evidence rather than future-tense claims.

Find and cite current official Sarvam and Groq documentation before using them. Verify pricing, free-tier eligibility, rate limits, supported languages/models, testnet endpoints, faucets, token decimals, facilitator behavior and authentication. Do not invent credits, quotas, addresses, credentials, RPC URLs or signup links. Mark unknown values as unverified rather than filling plausible values.

Before building around Hedera x402, prove the supported HTTP challenge, payment authorization, verification and settlement flow with the chosen package/facilitator and testnet asset. Before building around 0G, prove a real inference call and inspect its billing/account requirements. Before building around Arkiv, prove one authorized write and subsequent query on the currently supported testnet. Missing transaction authority or credits means document and prepare the step, not silently execute it.

## 4 Architecture and durable state

Choose the smallest maintainable stack compatible with the existing repository and official SDKs. Prefer a typed frontend and server, persistent relational storage, schema validation, an explicit workflow/state machine and an authenticated event stream. Reuse sound existing architecture rather than rebuilding unnecessarily. Explain important stack choices briefly. Keep provider adapters separate from domain logic. Pin dependencies and document the supported runtime.

Model businesses, users, memberships and roles; agents; procurement intents and versions; supplier capabilities and inventories; eligibility policies and evaluations; conversation rooms and memberships; messages and agent runs; quotes and revisions; approvals; orders; payment attempts and receipts; fee ledger entries; simulated delivery events; credibility attestations and revocations; provider usage and budgets; and audit events. Include tenant identity, timestamps, provenance and stable correlation IDs where relevant.

Use explicit validated transitions. A useful starting lifecycle is draft, needs clarification, ready, discovering, negotiating, awaiting approval, approved, payment pending, paid, fulfilling, delivered, completed, with rejected, cancelled, expired and failed branches. Adapt the model as needed, but prohibit illegal transitions server-side. A stalled provider request must not falsely advance an order. Store immutable quote revisions and auditable events, not just the most recent mutable display state.

Implement bounded workers, timeouts, retries with jitter, cancellation and idempotency. Persist events before broadcasting. Reconnecting clients resume from an event cursor without duplicating messages. Do not rely on browser memory or animation timers as the source of truth. Keep deterministic domain calculations outside the language model.

## 5 Business onboarding and language experience

Provide working onboarding for a buyer business: business display name, business type, service area, procurement preferences, language, user role and relevant consent. Collect only necessary information. Keep any real personal data private; use synthetic business data in demos. Do not imply legal verification, KYC or registry checks unless an actual verified flow exists.

Support English and Hindi text throughout the core journey. Use Sarvam speech recognition and speech generation where available and authorized. Provide microphone permission handling, recording indication, stop/cancel, transcript correction, language choice, clear errors and a text fallback. Confirm consequential intent fields after speech recognition rather than placing an order directly from uncertain audio. Do not fabricate voice support when keys or a supported model are missing.

Extract item, specification, quantity and unit, budget and currency, required date/time and timezone, location/service area, quality constraints and hard versus preferred criteria into a structured intent. Clarify material missing fields. Display a reviewable summary and allow editing. Examples and translations must preserve units, amounts and dates. Keep original and normalized values where useful for audit.

## 6 Synthetic suppliers and eligibility rules

Seed four or five clearly fictional supplier businesses with varied catalogues, prices, stock, capacity, service areas, minimum order quantities, lead times, payment terms and evidence histories. Do not impersonate real businesses. Every fixture needs a provenance flag. Seed enough diversity that some suppliers are excluded for specific reasons and at least two can negotiate on the default request. Make data editable through appropriate test controls.

Let buyers set eligibility rules such as delivery deadline, maximum landed cost, minimum quantity, capacity, service area and minimum supported credibility evidence. Distinguish mandatory filters from weighted preferences. Explain exclusions and ranking in plain language with the actual data and rule version used. A language model may explain a result but must not override hard constraints or invent certifications.

Recalculate eligibility and rankings when an intent, rule, supplier capability, availability, quote, relevant attestation or expiry changes. Show when an existing candidate or offer becomes ineligible. Revalidate before approval and payment. Inventory and capacity checks need concurrency protection so simultaneous orders cannot oversell. Changing a policy after approval invalidates that approval when its approved basis no longer holds.

## 7 Live negotiation and business scoped conversations

Run actual supplier-agent and buyer-agent turns against current state. Use structured tool calls, bounded rounds, budget/time limits and validated outputs. Each supplier agent has its own constraints and authorized context. It must not know competitors' private quotes, private rooms or hidden policies. The buyer agent must respect the buyer's maximum spend and must not accept a deal or pay outside explicit authority.

Provide a shared negotiation room only for the participating businesses and authorized users, plus private buyer-supplier rooms visible only to the parties. Business membership and room membership are enforced on the server for reads, writes, subscriptions, exports and search. A global broadcast channel is unacceptable. Supplied tenant IDs or room IDs never establish authorization. Test access using a separate unrelated business session.

Make the conversation genuinely observable: append messages as real agent turns finish, show actor and business, timestamps, room visibility, proposed terms, quotes and decision events. Show concise action summaries and evidence, not hidden chain-of-thought or secrets. Permit relevant human intervention, pause and cancellation. Use robust reconnect and loading states. Do not replay a prewritten transcript as a live negotiation.

Use 0G for central tasks such as intent interpretation and negotiated structured proposals where its model supports them. Record safe request identifiers, timing, provider/model and usage metadata. Groq may be an explicit configured fallback on eligible failures, with bounded retries and a visible provider trace. Do not call a fallback that the user has not configured or authorized. Never label a Groq response as a 0G response. Demonstrate how the main flow degrades without 0G rather than making a decorative call unrelated to the outcome.

## 8 Arkiv intents and signed credibility

Use current official Arkiv SDK/RPC patterns to write time-bound procurement intent entities and read them back in the discovery flow. Store owner, schema/version, intent identifier, permitted discoverable attributes, creation time and explicit expiry. Define the distinction between application expiry, chain retention and deletion guarantees. Expired intent must stop matching even if an index or cache still exposes it.

Do not put private conversations, contact details, raw voice recordings, secrets or commercially sensitive quotes on a publicly readable chain. Keep private data in access-controlled application storage; publish only a minimal safe projection or commitment when appropriate. Wallet ownership and schema tags alone are not tenant authorization. Verify writer identity and apply expected-owner/schema constraints when reading. Do not imply that onchain data is confidential or that expiry guarantees erasure everywhere.

Define role-based signed credibility attestations: who can assert a buyer receipt, supplier fulfillment, platform validation or reviewer assessment, and what each proves. Bind signatures to issuer, subject, business/role authority, evidence reference, outcome, order, timestamp, expiry and schema version with canonical serialization and domain separation. Verify signer authority at issuance and define revocation/key rotation behavior. Reject spoofed role labels, invalid signatures, replay and self-awarded reputation. A valid signature proves provenance, not objective truth.

Compute a transparent credibility view from verified, unexpired, non-revoked evidence; show evidence count and limitations. Keep synthetic seeded history distinct from evidence generated by this run. A simulated delivery acknowledgement must be marked simulated and cannot become a claim of real-world delivery performance. Demonstrate a real authorized Arkiv write/read and signature verification separately from any synthetic history.

## 9 Exact quotes and human approval

Each quote revision must include supplier, item/specification, quantity/unit, unit price, subtotal, taxes if applicable, delivery cost, service/platform fee, payment-network fee estimate or bound, currency/token, total, delivery commitment, expiry, terms, policy version and relevant inventory reservation. Separate indicative local-currency pricing from actual testnet settlement denomination. Do not invent a live foreign-exchange rate or imply an unverified stable value.

Display comparisons using identical units and landed totals. An approval must bind a canonical exact quote version/hash, payer and payee, network, asset, amount, fee bounds, terms and expiry. Show the user what they are approving. Any material change, including price, quantity, recipient, deadline, fees beyond the approved cap, asset/network or eligibility, invalidates approval and requires reapproval. Reject stale approval server-side even if a browser still shows an enabled button.

Use a clear single primary action per decision. Do not create duplicate accept/pay buttons with different behavior. Distinguish approval to negotiate from approval to commit and permission to pay. Agent suggestions and messages are not user approval. Demonstrate the stale-quote and changed-fee rejection paths.

## 10 Hedera x402 settlement and controlled spending

Use Hedera testnet only. Implement an actual x402-protected endpoint and the supported request/challenge/payment/verification/settlement/response flow. The paid resource or service must have a meaningful role in the approved procurement transaction. Explain that x402 is an HTTP payment mechanism, not a guarantee of escrow, refunds or physical delivery. Do not add unsupported escrow claims.

Bind payment to the approved quote/order and authenticated business. Validate network, payer, payee, asset, atomic amount, expiry and replay protection. Protect against duplicate callbacks, repeated requests, concurrent payment attempts and authorization replay. Use idempotency keys and durable reconciliation. A transport timeout is an unknown outcome, not proof of failure: query settlement state before retrying. Do not mark paid from a client callback alone.

Record verified settlement status, transaction ID, real explorer link and order association. Distinguish pending, confirmed, rejected and uncertain states. Never invent transaction hashes or show a simulated receipt as onchain. An unavailable facilitator blocks settlement, not the rest of the app. Offer explicit test-only scenario controls separately from the genuine integration path.

Use separate accounts/ledgers for procurement settlement, platform fee income and compute spending. Show gross payment, supplier proceeds, platform fee, estimated versus actual network charges and compute usage; avoid double counting. Represent money in integer atomic units with asset metadata. Define conservation/reconciliation invariants and test them. Do not claim that a platform fee exists unless it is actually collected or explicitly shown as an accounting simulation.

Implement user-configurable per-order, session and daily spend caps; allowed network/asset/payee policies; reserved amounts for in-flight work; bounded negotiation/inference budgets; and low-balance stop behavior. No automatic mainnet bridging, token swaps, card top-ups or paid subscriptions. Human top-up is the default. Show faucet/credit instructions only after verifying official sources and current availability.

Do not assume Hedera test tokens or service-fee revenue can pay for 0G compute. Verify any supported funding route, network and asset conversion requirements. If the full income-to-compute cycle is unsupported or requires real funds, state the gap and implement honest separate ledgers and human-funded credits. Do not claim a self-financing prize requirement from bookkeeping alone. Service payments occur at the moment of use, without per-payment approval, when they satisfy the human-configured service-spending policy. Define the allowed services/providers/payees, network/asset, per-call and cumulative caps, policy expiry and revocation, then enforce them before each payment. For example, a permitted paid API request may settle autonomously inside those bounds. Goods purchases still require explicit exact-quote approval. Top-ups always remain human authorized/signed. Outside the configured policy, pause rather than infer consent. Record the policy version and autonomous payment evidence. Do not introduce a per-service-payment approval dialog inside approved bounds.

## 11 Simulated delivery and polished interface

After confirmed payment, offer an intentional simulation control to advance fulfillment through accepted, preparing, dispatched and delivered, plus delay/cancellation/failure cases. Persist each event and display its simulated source. Do not claim a courier, tracking feed, warehouse, physical dispatch or real delivery exists. Keep historical synthetic fixtures separate from newly generated simulation events.

Build a distinctive, polished, responsive application, not a generic dashboard with repeated cards and duplicate buttons. Design references such as Bitfind or KrowdKraft may inform visual direction only if accessible; do not claim to have inspected unavailable references or copy proprietary assets. Establish typography, spacing, warm readable colors, meaningful hierarchy and consistent interaction patterns. Use real product data rather than decorative metrics.

Suggested primary areas are onboarding, procurement workspace, live negotiation with room visibility, supplier/quote comparison, approval and receipt, order timeline, business settings and integration/budget settings. Maintain one coherent navigation model. Show contextual empty states, progress, validation, retry, offline and permissions states. Provide keyboard access, accessible contrast, responsive layouts, focus management and usable Hindi text rendering.

Avoid pervasive mock banners and warning clutter. Use an unobtrusive persistent Testnet environment indicator, concise sample-data disclosure at onboarding or relevant records, per-integration status details and a clearly intentional demo-controls area. Honesty is mandatory but should fit the product. Do not obscure simulated provenance or make unavailable functionality appear live.

## 12 Security and privacy requirements

Keep credentials in server-side environment configuration or an appropriate local secret store. Commit only placeholder .env.example entries. No secrets in browser bundles, logs, screenshots, fixtures, Git history or API error payloads. Avoid requesting secrets in chat. Add a secret scan and verify public-prefixed environment variables contain no private credentials.

Enforce authenticated tenant and role authorization on every sensitive operation and event subscription. Add schema validation, rate limits, CSRF protection where relevant, safe rendering, request size limits and audit logs. Treat user messages, supplier content and retrieved text as untrusted data, not instructions that can change agent authority. Restrict agent tools with allowlists and typed arguments. Validate deterministic rules before any state-changing tool call.

Set limits on voice retention and logs; redact sensitive data and document deletion behavior. Explain which provider receives which data. Do not send private supplier information to unrelated tenants or put it onchain. Separate local synthetic demo personas from any real user account flow. Protect wallet material and ensure the UI cannot select mainnet accidentally; enforce the testnet allowlist on the server as well.

## 13 Verification and acceptance tests

Write unit, integration and end-to-end tests, then run them. Use deterministic fixtures for automated tests and a separate opt-in live integration suite for credentialed/testnet calls. Mocks are legitimate in tests but are not evidence that external integrations work. Do not repeatedly spend credits or testnet assets without an authorized budget. Record commands and actual outcomes, including failures and skipped tests.

Required acceptance scenarios:

- A fresh checkout installs and starts from documented commands, with migrations and an idempotent seed. Missing optional credentials produce specific degraded states rather than crashes.

- A buyer completes onboarding, submits English and Hindi text requests, corrects parsed fields and sees a persisted intent. Voice works with authorized Sarvam configuration or clearly reports why it is unavailable.

- Four or five synthetic suppliers produce different eligibility results and validated negotiated quotes. Changing quantity, deadline, supplier availability or policy recalculates results and explains exclusions.

- Two browser sessions see relevant live agent messages, can reconnect without loss/duplication and cannot access unrelated businesses' rooms, REST endpoints, event streams or exports. An unauthorized guessed room ID is rejected.

- Real 0G inference contributes to the workflow with evidence. A controlled 0G failure invokes only the configured Groq fallback and accurately records it; lack of both pauses affected work safely.

- An Arkiv intent is written and read on the current testnet with source evidence. Expiry removes it from matching. Invalid, forged-role, revoked and expired attestations do not contribute to credibility.

- An approved quote becomes unpayable when its revision, amount, payee, terms, eligibility or fee cap changes. Concurrent clicks and replayed approvals cannot create duplicate orders/payments.

- A genuine Hedera testnet x402 request settles once and yields a verified transaction receipt. Insufficient funds, rejected authorization, unsupported asset, facilitator outage and uncertain timeout remain safe and recoverable.

- Ledger totals reconcile; spend caps account for in-flight reservations; low credits stop new inference or purchases; human top-up does not falsely imply automatic revenue recycling.

- Simulated delivery events update the order and appropriately scoped signed evidence while retaining simulation provenance. Refreshing does not reset state or label a simulated dispatch real.

- Prompt injection in a supplier message cannot override budget, approval, tenant boundaries or tool permissions. Secret scanning, build/type checks and accessibility/responsive checks pass or have explicitly documented failures.

Use available browser tools for the actual app. Inspect desktop and mobile layouts, empty/error states, Hindi text, room visibility and the full happy path. Capture useful screenshots and a short reproducible demo script. Do not report visual verification if you only inspected code. If browser tooling is unavailable, state that precisely and provide test steps without claiming they ran.

## 14 Deliverables and completion report

Deliver working source and migrations; editable synthetic seed data; safe .env.example; lockfile; automated tests; local setup instructions; architecture/data model; state machine and authorization documentation; integration/source register; credential/credit checklist; prize evidence matrix; AI assistance and pre-existing-work disclosure as required; demo script; and honest limitations. Keep a small implementation checklist current so interruptions are recoverable.

The credential/credit checklist must name each provider, required account/key or wallet role, verified official setup source, free-tier or supplied-credit status, required network, approved spending cap and whether the integration has been tested. Unknown quotas or access must remain marked unknown. Never include actual secrets. Make it clear which steps I must do myself.

At completion report: what works end to end; what is real network behavior versus synthetic/simulated; commands and tests run with outcomes; verified request/transaction evidence; remaining blockers and exactly how to resolve them; files changed; how to run and demo the app. Do not call the MVP complete if the critical approved flow is still only a mock. Do not claim prizes, production readiness, security certification, real supplier participation or real-world delivery.

Prioritize a complete vertical slice first, then deepen negotiation, rule recalculation, credibility and polish. Keep integrations meaningful and the user journey coherent. If time is constrained, explain trade-offs and preserve safety, truthful evidence and a working flow before adding features.  


## Brand and partner requirements

Use the exact product name Perenna and the exact subtitle “Business moves smarter.” consistently across the website and application UI, including the landing page, onboarding, navigation branding, page metadata and demo materials. Preserve capitalization and the subtitle’s final period; do not translate or paraphrase the brand lockup. Use perenna for new app-specific identifiers where appropriate, while preserving verified external URLs, provider identifiers, existing repository identity and working commands.

The selected partners remain Arkiv, 0G and Hedera. Whitechain is under consideration only and is not selected. Arkiv sponsor tracks count toward the event’s three partner picks; verify the current requirements at https://ethglobal.com/events/mumbai/prizes/arkiv.

The primary 0G target remains the Private Computer track. The separate Agents That Pay for Themselves prize requires actual revenue to fund the agent’s 0G compute credit and subsequent paid inference without manual top-ups, with evidence: https://ethglobal.com/events/mumbai/prizes/0g. Approved fallback top-ups and an unverified revenue-to-compute bridge leave eligibility for that separate prize unresolved.

A user-approved, guardrailed Hedera x402 service payment is separate from human approval of an exact goods order.

## Revision: Standing agreements and selected sponsor tracks

### Updated implementation mandate — 6 November 2026

This section supersedes conflicting earlier instructions. Selected partners: Arkiv, Hedera and 0G. Product branding remains Perenna — Business moves smarter. Do not implement Whitechain, Chainlink or World solely for prizes.

### Two procurement authorization modes

Mode A: one-off procurement requires human approval bound to the exact immutable quote, supplier, amount, asset, network, expiry and terms. Mode B: Standing Procurement Agreement (SPA) between buyer and established supplier, explicitly authorized by both businesses for a fixed period, permits the buyer agent to place orders and execute payments without per-order approval only within preapproved SKU/specification, unit-price/tolerance, quantity, frequency, delivery area, per-order and aggregate caps, payee, currency, fees and validity. A dispute, revocation, material price/terms change, insufficient balance or policy breach pauses the affected action and requires appropriate human intervention. Do not equate agent messages with signatures.

### SPA onchain contract design and controls

Build a narrowly scoped testnet agreement registry and payment-authority enforcement component only after verifying Hedera testnet contract and asset compatibility. Store minimal non-sensitive commitments and identifiers onchain; retain confidential agreement details privately with hashed/versioned references. Support creation, bilateral acceptance, activation, amendment with fresh signatures, pause/dispute, revocation for future orders, expiry and event emission. Check contract state AND server-side policy at execution; atomic reserve/consume limits, nonce and idempotency protection, concurrency tests, no duplicate settlement. Define who can dispute, pause and resume. Do not imply automatic enforcement of physical delivery or legal enforceability.

### Hedera sponsor demonstration

Target Hedera AI Agents That Pay — x402 on Hedera. In addition to supplier settlement under a SPA, demonstrate at least one autonomous paid HTTP service request on Hedera testnet within a previously signed operating policy, without approval at request time. Preserve challenge, verification, confirmed settlement, transaction ID, HashScan link, merchant endpoint, budget evidence and a public-repository-ready \<=5 minute demo. A Hedera x402 service payment does not by itself pay 0G.

### 0G sponsor demonstrations

Primary target: Build with 0G Private Computer, where actual 0G inference meaningfully drives intent parsing or live negotiation and returns verifiable request IDs. Secondary exploratory target: Agents That Pay for Themselves. Collect a disclosed service fee after actual testnet settlement, track settled agent revenue separately from goods funds, and investigate an actual supported revenue-to-0G-Compute-credit route. Prove balance crediting and subsequent paid inference without manual top-up only if genuinely possible. Sponsor credits, fake balance changes, a self-owned payment gateway and test tokens are not evidence of a self-funding loop. Clearly document if Private Computer and Compute credit accounts differ.

### Arkiv sponsor demonstration

Target Build on Arkiv (from scratch). Publish actual time-bound procurement requests and queryable role-specific evidence on Arkiv testnet, read those records to affect supplier screening, and write real signed post-order acknowledgments with provenance. Supply schema, runnable query, writer addresses, why-Arkiv documentation, friction and reach notes, license and AI disclosure per current rules. Never publish sensitive terms or private conversation content.

### Acceptance tests to add

SPA: initial bilateral authorization; valid second order pays without new approval; modified price/recipient exceeds allowance and blocks; concurrent orders cannot overspend; dispute pauses; expired/revoked agreement blocks; old signatures cannot replay; order outcome and payment outcome reconcile independently. Hedera: autonomous x402 service payment with confirmed transaction. 0G: meaningful request IDs and explicit funded-versus-sponsor-credit trace. Arkiv: write/query affects eligibility. Keep all blockchain activity on testnet, no unapproved real spending or publishing.

### Implementation priorities

1 Verify sponsor rules and SDK feasibility. 2 Complete one-off procurement vertical slice. 3 Add bounded SPA lifecycle and autonomous repeat-order path. 4 Demonstrate separate Hedera x402 service purchase. 5 Integrate meaningful 0G reasoning and Arkiv queryable evidence. 6 Attempt genuine earned-revenue-to-0G-credit loop only after verifying provider funding compatibility. Never silently replace core flows with mocks.
