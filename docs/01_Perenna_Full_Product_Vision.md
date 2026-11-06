# Perenna full product vision

Business moves smarter.

Latest version 2.0  |  5 November 2026

Product requirements document

5 November 2026  |  Version 2.0 latest  |  Product planning

### Purpose and product direction

Perenna is envisioned as a business representative agent that helps a business express intent, coordinate with counterparties and manage work through voice and chat. Procurement is the initial proving ground. The broader product extends into order management, bill management and other business operations, with local-language experiences and configurable guardrails.

A business can act as a buyer in one transaction and a supplier in another. These are transaction roles, not permanent business categories. Consumer participation is a possible later expansion and is outside the hackathon scope.

### What this document decides

This PRD describes the intended full product and proposes a staged design for evaluation. It does not authorize implementation, commit delivery dates or claim that integrations work. The separate hackathon MVP PRD should govern the narrow demonstration scope.

### Reading the requirements

- Confirmed direction means a decision captured in the product discussion or its decision brief. It does not mean the capability has been built.

- Proposed requirement means a recommended future behavior or design that needs product review before adoption.

- Open decision means a choice or technical dependency that remains unresolved. Proposed architecture and later phases are not settled decisions.

### Primary outcome

Help a business complete routine work with less coordination effort while keeping humans in control of commitments, sensitive disclosures and spending. Judge success by verified task outcomes and safe execution, not the amount of agent dialogue.

### Document map

1 Product boundaries and users · 2 Journeys · 3 Functional requirements · 4 Consent and spending · 5 Trust and data · 6 Conceptual architecture · 7 Rollout · 8 Measurement · 9 Risks and decisions · 10 Revised MVP experience

## 1 Product boundaries and users

### Confirmed product direction

- One representative agent supports voice and chat, local-language interaction and configurable guardrails for each business.

- The product serves businesses across categories; procurement, orders, bills and broader operations belong to the full vision.

- The initial procurement flow publishes time-bound public requests on Arkiv, screens counterparties using role-based credibility evidence and runs genuine competitive agent negotiation.

- The hackathon flow shortlists three sellers, requests human approval of the exact quote and intends to use Hedera x402 for payment. 0G compute is intended but unverified.

### Proposed user roles

Business owner or administrator configures representation, users and spending authority. A business operator initiates and tracks work. An approver reviews commitments within delegated authority. Buyer and supplier describe the business role for a specific transaction; a user may have access to both workflows.

A counterparty representative can submit offers, acknowledge order events and exchange evidence. A proposed support or dispute role can review permitted records without silently changing financial commitments. Consumer roles require a separate later-phase design.

### Jobs to be done

- As a buyer, turn a spoken or written need into comparable offers and an approved purchase without losing important commercial terms.

- As a supplier, understand requests, respond within business policy, manage accepted orders and resolve exceptions.

- As an owner, understand what the agent has done, what it needs approval for, how much it spent and why it stopped.

### Proposed boundaries

Perenna should coordinate business workflows, not claim to replace legal advice, accounting judgment or human verification of delivery. Autonomous credit, lending, payroll, taxation, regulated purchases and consumer protection obligations need separate requirements and review. No general authority to spend, disclose private data or sign contracts is implied by onboarding.

### Problem assumptions to validate

Businesses may lose time coordinating requests, offers, fulfilment and bills across channels. Voice and local languages may improve access. These are product hypotheses, not validated market findings. Interviews and observed workflow trials should establish frequency, pain, willingness to adopt and willingness to pay.

## 2 End to end business journeys

### Procurement from intent to order

Proposed journey: the user speaks or types a need; the agent extracts product or service, quantity, quality constraints, location, timing, budget and permissible substitutions. It asks about missing decision-critical fields, reads back the structured request and previews any public information before publication.

Confirmed core: publish a time-bound public request on Arkiv, screen seller evidence, run live model-driven public competitive group negotiation, shortlist three sellers and obtain human approval of an exact quote. Synthetic identities and seeded credibility require an unobtrusive sample/environment disclosure; negotiation itself must not be mocked.

Proposed completion: show comparable landed costs and relevant tradeoffs; preserve the selected quote version; execute only the authorized payment path; create an order with counterparty acknowledgment. A successful payment is not evidence of fulfilment. Track each independently.

### Supplier response and fulfilment

Proposed journey: a supplier agent receives a relevant request, checks catalog or available capacity against a permitted source and drafts an offer within configured constraints. It identifies uncertain inventory or lead times rather than inventing availability. Any accepted commitment must match the supplier human’s authority and the buyer’s approved version.

The supplier records dispatch or service progress; the buyer records receipt and acceptance separately. Both agents may attest to specified events. Partial delivery, rejection and disputed events stay visible rather than being converted into a single success label.

### Bill management

Proposed journey: ingest a bill through an authorized channel, extract vendor, invoice identifier, currency, taxes, amount and due date, and retain the source. Match it against the approved order and receipt evidence. Flag duplicates, mismatches and unfamiliar payees. Route payment for the relevant human approval; record reconciliation only after reliable provider evidence.

### Ongoing business operations

Proposed journey: present a daily view of tasks awaiting approval, expiring offers, late orders and bills approaching due dates. Users can ask for explanations, pause an agent or correct business information. Recurring procurement and workflow templates can follow once consent, exception handling and spending controls are proven.

### Language and channel continuity

English and Hindi voice AND chat are confirmed MVP scope. A voice request and chat follow-up should refer to the same task. Display structured terms and read back critical amounts, dates, units and payee details. Clarify uncertain speech or translation before commitment. Sarvam API is a possible language provider, subject to verification and free-tier or sponsor-credit availability; no integration is asserted.

## 3 Proposed functional requirements

The following are proposed full-product requirements. Each needs acceptance criteria and ownership before engineering commitment.

### Business identity and representation

- V01 Maintain a business profile, transaction roles and verified authority for users and agents. Separate identity evidence from proof of business quality.

- V02 Support invitations, role-based permissions and revocation. Revocation must prevent new actions and identify already-submitted actions that cannot be cancelled.

- V03 Provide a visible activity history linking user intent, agent reasoning summaries, approvals and external outcomes. Do not expose secrets or private reasoning traces.

### Interaction and discovery

- V04 Use voice and chat to create, clarify, resume and cancel tasks; preserve structured state across channels. Offer accessible text alternatives.

- V05 Support selected local languages with explicit coverage and quality testing. Preserve original text beside translated commercial terms when useful.

- V06 Match public requests and counterparties using explicit eligibility criteria, evidence recency and uncertainty. Show why a supplier was included or excluded.

### Procurement and negotiation

- V07 Keep request versions, expiry, constraints and publication consent. Make amendments visible to affected counterparties.

- V08 Compare quotes using item, quantity, specification, unit price, currency, tax, fees, delivery cost, destination, timing, payment terms and cancellation or return restrictions.

- V09 Conduct actual agent dialogue within bounded rounds and business constraints. Preserve source offers, disclose unavailable evidence and prevent one agent from changing another business’s authority.

- V10 Explain the shortlist and tradeoffs. If fewer than three eligible sellers exist, disclose the shortage and seek a decision rather than manufacture competition.

### Orders and bills

- V11 Track order acceptance, fulfilment, partial delivery, receipt, dispute and cancellation with actor, timestamp and supporting evidence.

- V12 Parse and match bills to orders and receipts; detect duplicate identifiers and suspicious payee changes. Unmatched or ambiguous bills require review.

- V13 Separate draft, approved, submitted, pending, confirmed, failed and disputed payment states. Never display uncertain settlement as success.

### Business control

- V14 Allow configurable category, vendor, geography, time and spending restrictions, with simple pause and escalation controls.

- V15 Export business records and provide correction, retention and access controls consistent with the chosen data design and legal obligations.

## 4 Consent and responsible spending

### Confirmed commercial safeguards

Quotes have immutable versions. Any change requires notification and renewed human approval. Payment must bind to the exact approved terms. A mentor raised possible underpayment or loss when a quote changes; the precise scenario is unresolved and requires a worked example before the issue can be treated as solved.

A disclosed percentage service fee funds a separate agent operating balance. Humans configure procurement and service spending caps. When revenue is insufficient, request an itemized top-up signed by the human. Fully self-sustaining operation is not guaranteed. Fee percentage, fee base, rounding, taxes and refund treatment remain open.

### Proposed consent model

Separate authority to collect information, publish a request, negotiate, accept a commercial commitment, pay and disclose private data. Approval of one step must not silently authorize the others. A single clear approval may cover an explicitly itemized sequence when its recipients, limits and consequences are visible.

Bind approval to the business, authorized human, quote version, merchant or payee, amount and currency, scope, expiry and action type. Store the approval record and the exact terms shown. Renew approval after material changes, expiry or a change in authority. Do not infer approval from silence or an ambiguous utterance.

### Proposed funding controls

- Maintain separate procurement funds and agent operating funds. Display available, reserved and spent amounts without implying that a balance is settled cash unless verified.

- Apply caps to aggregate activity across concurrent tasks, including known taxes, fees and currency conversion exposure. Reserve against the cap before an irreversible action to avoid concurrent overspend.

- Estimate model, compute and transaction costs before expensive work. Stop or reduce work when the remaining operating balance cannot safely support it.

- Show top-up purpose, amount, destination and requested authorization. Never silently use procurement money to fund the agent or auto-enroll a user in recurring charges.

### Proposed exception rules

Before a payment retry, reconcile provider status and use an idempotency key. A timeout is an unknown outcome, not proof of failure. Duplicate approvals must not generate duplicate orders or payments. A pause prevents new commitments; already-submitted payments may require provider-specific cancellation or refund handling.

### Acceptance scenarios

A changed shipping fee invalidates prior approval. Two simultaneous tasks cannot both spend the same remaining cap. An uncertain payment is held for reconciliation. A revoked approver cannot authorize a new action. Every top-up states its intended use and requires the specified human signature.

## 5 Credibility privacy and evidence

### Confirmed credibility model and limits

Role-based credibility evidence includes transaction IDs, dispatch and receipt times, and outcomes signed by both agents. Bilateral signatures establish acknowledgments of statements. They do not prove that goods moved, a service was satisfactory, the parties are independent or an outcome is free of collusion.

Credibility should be presented as evidence with provenance and uncertainty, not an unconditional trust score. The same business can have different evidence as buyer and supplier. Seeded history and synthetic identities must remain distinguishable from observed transactions through an unobtrusive disclosure and record provenance, without repetitive banners.

### Proposed evidence safeguards

- Record the event being attested, subject, signers, key or identity references, time, version and related transaction. Preserve disagreements and corrected statements as linked events.

- Expose sample size, recency, missing evidence and dispute rates. Do not equate a new business with a bad actor or let one opaque score determine eligibility without explanation.

- Review self-dealing, repeated counterparties, identity cycling and unusually favorable histories. Such signals warrant review, not automatic allegations.

### Public negotiation and request exposure

Public requests and group negotiation can reveal buying intent, commercial constraints and competitive terms. Before publication, show what will be public, to whom and for how long. Time-bound discovery must not be described as deletion: replicas, logs or durable ledger records may remain accessible.

Proposed default: publish the minimum necessary request information. Keep private addresses, contact details, bank details, credentials, confidential documents and internal budgets off public infrastructure unless a separately reviewed design and appropriate consent establish a legitimate need. Hashes and metadata can still reveal information through correlation or guessing.

### Proposed data model and lifecycle

Core entities are Business, User, AgentIdentity, AuthorityGrant, RequestVersion, QuoteVersion, Approval, Order, Invoice, PaymentAttempt, EvidenceEvent, Dispute and AuditEvent. Each should have an identifier, ownership or tenancy boundary, creation time and applicable version or lifecycle state.

Classify data as public request content, business-confidential transaction content, personal information or security secrets. Define storage location, permitted readers, retention and deletion behavior per class. Encrypt private records, restrict access by business and role, and keep credentials in dedicated secure storage.

### Open governance questions

Jurisdiction, identity verification standards, retention periods, dispute authority, lawful data-sharing basis, key recovery and public record correction need decisions before production. Bilateral evidence alone is insufficient for guaranteed fraud resistance or legal settlement of disputes.

## 6 Proposed conceptual architecture

This architecture is a planning proposal. It is not an adopted stack, system specification or implementation report. Validate the external dependencies before choosing deployment details.

### Interaction and workflow layers

A voice and chat layer converts user input into a structured task and provides reviewable responses. A workflow coordinator persists task state, manages resumable steps and routes work to a representative agent. Business policy enforcement sits outside model-generated text and checks every consequential action.

A negotiation service manages request membership, messages, round limits and quote versions. A transaction service tracks approvals, orders, invoices and payment attempts. A consent and authorization service checks the current human grant, policy limits and exact proposed action.

### Integration boundaries

Arkiv is intended for time-bound public requests. Verify publication and retrieval behavior, indexing, expiry semantics, costs, public visibility and what removal can actually mean. Do not place private data there by assumption.

0G compute is a core dependency, with Groq for support or fallback. Validate model compatibility, invocation flow, latency, availability, data handling, metering and payment requirements. Only free tiers and sponsor credits may be used. Do not use paid OpenAI or Anthropic inference. A Groq fallback must be visible in execution provenance and must not be misrepresented as 0G execution.

Hedera x402 is the intended payment path. Validate the actual protocol flow, network, asset, recipient identity, settlement evidence, fees, retries and refund or recovery behavior. x402 does not automatically pay 0G or API subscriptions; each provider’s billing path needs verification.

Future accounting, inventory, messaging, document and payment integrations are candidates only. No named provider beyond the intended infrastructure is committed. Each connector needs a permission model, supported actions, provenance, error contract and rate-limit strategy.

### State and reliability

Store workflow state in a private transactional system and keep append-only action records where appropriate. Model output suggests actions; deterministic services validate authority, constraints and required fields. External operations need stable identifiers, idempotency, timeouts and reconciliation.

Proposed order progression is draft, approved, submitted, acknowledged, in fulfilment and completed, with cancellation or dispute branches. Invoice review and payment settlement are separate state machines. Do not force delivery, payment and dispute outcomes into a single status.

### Security and operations

Isolate businesses and agent identities; authenticate requests and verify signatures. Treat counterparty messages, documents and public listings as untrusted data, not instructions that can override policy. Log access and failures with redaction. Provide incident pause controls, backups, recovery testing and provider outage handling.

## 7 Phased delivery and release gates

### Phase 0 Product and technical validation

Proposed goal: resolve the minimum decisions needed to prove the first procurement flow. Select a representative transaction category and evaluate both required languages without narrowing the long-term business vision. Work through changed-quote loss scenarios, authority, fee calculation and insufficient funding. Validate Arkiv, 0G and Hedera x402 through scoped technical tests.

Exit evidence: reproducible integration results, explicit public/private data boundaries, an agreed approval contract, a cost model and a demo plan that distinguishes seeded information from live behavior.

### Phase 1 Hackathon procurement slice

Confirmed core scope: English and Hindi voice and chat, public onboarding, public requests, configurable screening, live competitive negotiation, three shortlisted sellers and immutable approved quotes. Start with four or five suppliers with varied synthetic credibility; recalculate it from later events. All blockchain activity is testnet. Actual testnet settlement and fee accounting are intended. Delivery tests use intentional controls and one unobtrusive environment disclosure.

Proposed release gate: demonstrate a traceable transaction and tests for quote changes, caps and uncertain payment. Use 0G Private Computer in the main flow and expose request IDs, per the event prize requirements. Team compute credits are offered; availability and paying compute with Hedera test tokens need verification. Use only free tiers or sponsor credits. Groq is support or fallback, not a replacement for core 0G use. Consumers and broader operations remain excluded.

### Phase 2 Operational business pilot

Proposed scope: mature the MVP onboarding and authority controls, add order milestones, bill ingestion and matching, exception queues and a limited set of verified integrations. Run with real businesses only after the required security, privacy and commercial review.

Exit evidence: safe repeated workflows, usable human approvals, accurate reconciliation, support procedures and measured task value. Broader autonomy depends on observed reliability rather than an arbitrary release date.

### Phase 3 Broader operations and coverage

Proposed scope: more business categories, selected local languages, additional channels, recurring workflows and accounting or inventory interoperability. Supplier-side operating workflows should mature alongside procurement. Expand only where evaluation demonstrates useful task completion and manageable operating cost.

### Phase 4 Consumer exploration

Proposed scope: investigate how consumers could participate without reusing business assumptions about identity, authority, privacy, cancellation or dispute rights. Treat consumer launch as a separate product decision with research, safeguards and jurisdiction-specific review.

### Explicit deferrals

No committed timeline, staffing plan, revenue forecast or production readiness claim is made. General autonomous contracting, credit, lending, payroll and tax filing remain outside this PRD’s executable scope. A phased roadmap does not pre-approve later features or financial actions.

## 8 Measurement and acceptance

### Proposed primary measure

Verified useful completion rate: tasks reaching the user’s intended outcome with sufficient external evidence and no unauthorized commitment, divided by eligible tasks started. Report by workflow, language and business role. Track blocked tasks and user cancellations separately rather than hiding them as successes.

### Supporting product measures

- Time and human effort from complete intent to approved decision, compared with an observed baseline for the same workflow.

- Intent completeness and correction rate, including speech or translation errors in amounts, dates, units and specifications.

- Offer coverage, eligible suppliers per request, quote comparability, shortlist acceptance and reasons for rejection.

- Order exception rate, overdue milestones, invoice match rate and duplicate bill detection precision.

- Cost per completed task, operating balance exhaustion and service fee coverage. Revenue covering costs is a measured outcome, not a promise.

### Safety and trust measures

- Unauthorized commitments, cap violations, duplicate payments and private-data exposure incidents. Zero is the desired outcome; any incident requires investigation and release review.

- Approval comprehension, changed-term reapproval coverage and uncertain-payment reconciliation time.

- Evidence provenance completeness, disputed attestation frequency and share of credibility derived from seeded rather than observed history.

### Proposed test suite

Test a complete purchase, an unavailable seller, fewer than three eligible offers, an expired quote, changed tax or delivery terms, a supplier refusing the approved version, a partial delivery and a disputed receipt. Include duplicate invoices, changed payee details and an interrupted voice session.

Security and resilience tests should cover malicious counterparty instructions, cross-business data access, revoked authority, concurrent cap consumption, repeated payment callbacks, provider timeout and outage recovery. Language evaluation should include local phrasing, mixed language and ambiguous numbers.

### How targets will be set

Instrument a baseline and pilot first. The product owner and engineering lead should set quantified quality, latency, cost and completion thresholds before each release. No numeric business targets are asserted without supporting evidence. Critical authorization and financial correctness checks are release gates even when average user experience is strong.

### Release evidence package

Retain reproducible test results, integration versions and limitations, sample task traces with secrets removed, user research findings, incident response ownership and a clear list of unresolved blockers. A polished demo is not a substitute for production evidence.

## 9 Risks and decisions to resolve

### Priority risks and proposed responses

- Unauthorized or changed commitments: bind approvals to immutable terms, revalidate at execution and retain an audit record.

- Loss or duplicate payment: reserve caps, use idempotency, reconcile uncertain outcomes and document provider-specific recovery limits.

- False credibility or collusion: expose underlying evidence, separate demo data, retain disputes and avoid truth guarantees.

- Public disclosure: minimize request content, preview publication and explain durable public visibility before consent.

- Negotiation quality: prevent invented offers and availability, test competitive behavior and give humans understandable tradeoffs.

- Language errors: confirm critical terms in structured form and require clarification when confidence is inadequate.

- Infrastructure or unit economics: validate dependencies and measure real costs; stop safely rather than promise self-funding.

### Decisions required before implementation

1. Define the first transaction category, geography and exact demo success condition. English and Hindi voice and chat are required. Owner to assign: product lead.

2. Resolve the mentor’s changed-quote loss scenario with concrete amounts, timing and payment states. Owner to assign: product and payments lead.

3. Decide onboarding, business identity, delegated authority and agent key custody or recovery. Owner to assign: product and security lead.

4. Validate Arkiv, 0G and Hedera x402 independently, including interoperability, billing, cost and failure handling. Owner to assign: engineering lead.

5. Agree service fee percentage and base, cap semantics, top-up signature mechanism, refunds and operating fund separation. Owner to assign: commercial and payments lead.

6. Decide public versus private fields, retention, access and dispute processes. Owner to assign: product, security and legal reviewers.

7. Select later operational integrations and define evaluation thresholds before moving beyond the procurement slice. Owner to assign: product and engineering leads.

### Source and decision provenance

The confirmed procurement decisions are recorded in the Perenna MVP decision brief dated 5 November 2026. The broader vision includes business representation, voice and chat, local languages, configurable guardrails, procurement, order and bill management, and eventual consumer exploration. The revision incorporates confirmed English and Hindi interaction, public onboarding, owner conversation visibility, design quality and free-tier or sponsor-credit constraints. Other requirements, architecture, metrics and later phases are proposals for review. No implementation or integration verification is asserted.

## 10 Revised MVP experience requirements

### Confirmed interaction and onboarding scope

Provide usable public onboarding and English and Hindi voice and chat in the MVP. Public onboarding means a person can enter and configure their business through a working entry flow; it does not mean their business records or private conversations become public. Sarvam API is a possible option, not a committed or verified integration.

### Confirmed owner conversation visibility

A business owner must be able to inspect their own authorized live and historical group negotiations and private direct messages. Access must be enforced server-side, not only by hiding controls. An owner may not inspect another business’s private messages merely because both businesses joined the same public negotiation.

Proposed acceptance: test business ownership and membership on every history query, direct-message read and live subscription. Reject a request after access is revoked. Ensure pagination, search, replay, exports and guessed identifiers cannot bypass the same checks. Clearly distinguish group messages from private conversations in the interface.

### Confirmed design direction

Create a polished, distinctive and coherent interface with no duplicate buttons for the same action in the same context. Bitfind and KrowdKraft are design references only if accessible. Do not invent reference links or claim a design was inspected when it was not. Exact visual choices remain to be designed and reviewed.

Proposed experience: use a clear entry flow, business setup, task workspace, negotiation view, quote comparison and approval view. Make one primary action obvious at each step. Preserve a consistent visual language, accessible focus states, useful empty states, loading feedback and actionable errors. Keep critical terms and authorization status visible without overwhelming the user.

### Honest demonstration without visual clutter

Do not repeat simulation banners throughout the product. Use a single unobtrusive sample/environment disclosure, retain provenance on seeded records and offer intentionally named delivery-test controls. Never imply that physical goods were delivered, real money changed hands or an unverified integration ran successfully. Surface uncertainty where it changes a user decision.

### Confirmed infrastructure and budget constraints

All blockchain activity is testnet. Use free tiers and sponsor credits only; no paid OpenAI or Anthropic inference. Keep 0G core and Groq support or fallback. Validate quotas and stop rather than silently incur paid usage. Testnet fee balances do not prove that compute costs are funded.

### Verified infrastructure references

ETHGlobal Mumbai requires 0G Private Computer in the main flow with request IDs and offers team compute credits: https://ethglobal.com/events/mumbai/prizes. Compute credits are distinct from gas: https://build.0g.ai/funding. Arkiv’s Rabdi testnet uses chain ID 7794095 and tGLM: https://docs.arkiv.network/networks/rabdi/. These facts do not verify the Perenna integration.

## Brand and partner requirements

Product name: Perenna. Product subtitle: Business moves smarter. Use this exact name and subtitle consistently in all product materials and interfaces.

The selected partners remain Arkiv, 0G and Hedera. Whitechain is under consideration only and is not selected. Arkiv sponsor tracks count toward the event’s three partner picks; verify the current requirements at https://ethglobal.com/events/mumbai/prizes/arkiv. The primary 0G target remains the Private Computer track. The separate Agents That Pay for Themselves prize requires actual revenue to fund the agent’s 0G compute credit and subsequent paid inference without manual top-ups, with evidence: https://ethglobal.com/events/mumbai/prizes/0g. Approved fallback top-ups and an unverified revenue-to-compute bridge leave eligibility for that separate prize unresolved. A user-approved, guardrailed Hedera x402 service payment is separate from human approval of an exact goods order.

# November 2026 revision — selected partners and standing agreements

This section supersedes earlier partner-selection statements and the blanket requirement for per-order human approval where an active, specifically authorized standing agreement applies. All other existing requirements remain in force unless explicitly modified below.

## Partner selection and primary prize targets

Selected partners: Arkiv, Hedera and 0G. Whitechain is not selected. Product name and subtitle remain Perenna — Business moves smarter.

Arkiv: Build on Arkiv (from scratch), $4,000 pool. Public time-bound procurement requests, role-based credibility events and standing-agreement discovery must be written to Arkiv and queried by visible application features. Include testnet writer addresses, runnable query, public licensed repository, AI-use disclosure, and required /arkiv documentation.

Hedera: AI Agents That Pay — x402 on Hedera, $6,500 pool. Demonstrate an actual x402-protected paid service request settled on Hedera testnet, autonomously executed within previously authorized operating caps; record transaction ID and HashScan link, public repository and demo video of at most five minutes. Optional extra credit: multi-agent negotiation, HCS audit, HTS settlement and agent identity. Ordinary supplier invoice settlement alone does not meet the x402 endpoint requirement.

0G primary: Build with 0G Private Computer, $5,000 pool. Core live procurement/negotiation reasoning must use 0G Private Computer, retain request IDs, provide a usable repeat-use application, live link and video under three minutes. Business-focused Perenna has a judging mismatch with this consumer-app emphasis.

0G secondary candidate: Agents That Pay for Themselves, $2,000 pool (up to two $1,000 awards). Perenna aims to earn a disclosed service fee and autonomously replenish its own 0G Compute balance, then pay for inference from that balance with no human top-up during the demonstration. Must prove revenue -\> compute credit -\> paid inference using transaction hashes and request IDs, cap and low-balance behavior. This is an intended goal, not a verified integration. Private Computer credits and 0G Compute credits must not be conflated. Confirm whether multiple 0G tracks can be selected within the three-partner cap in the submission dashboard.

## Standing Procurement Agreements (SPA): recurring B2B authorization

Business problem: established buyers and suppliers repeatedly transact under negotiated commercial terms. Perenna should support a time-limited, counterparty-specific agreement authorizing qualifying orders and payments without per-order approval, rather than forcing fresh consent for unchanged recurring transactions.

Two purchasing modes: (A) one-off purchases require explicit human approval of the exact immutable quote; (B) an SPA may authorize autonomous order placement and payment only when every transaction matches a currently valid, explicitly signed agreement and deterministic policy checks. An SPA is not blanket spending authority.

Minimum agreement fields: agreement ID/version; both business identities and authorized signers; buyer/supplier wallets or payees; eligible products or services, units and specifications; pricing formula, currency and allowed tolerance; order frequency and maximum quantity; per-order and aggregate spending caps with time window; delivery geography and time windows; start/end dates; cancellation and dispute rules; fees and taxes; allowed payment asset/network; required acknowledgments; renewal and revocation conditions.

Before each autonomous execution: verify active agreement, signer authority, permitted supplier and destination, order contents and price, available reserved budget, aggregate exposure across concurrent orders, agreement expiry and dispute/hold status. Reserve funds atomically; use quote/order digest and idempotency key; verify authoritative settlement before marking paid. No agent prompt or seller message can override the policy.

Exception handling: changed material terms, unapproved price increase, unexpected payee, disputed delivery, expired/revoked agreement, insufficient funds, changed tax/shipping outside tolerance or uncertain settlement pauses the affected action. Notify the business owner and require a new authorization or formal amendment. A dispute should freeze future affected payments, not imply automatic reversal of settled transactions.

Onchain contract design (proposed, subject to network/API validation): record a signed agreement commitment or hash, parties, authorization window, caps, consumed amounts, pause/revoke status and allowed payee/asset. Keep confidential prices, addresses, invoices and personal data in access-controlled storage; hashes alone may leak through correlation. If x402 facilitator cannot enforce these terms directly, a deterministic offchain policy gateway must validate before x402 payment, with auditable references. Do not claim onchain enforcement without deployed, tested code.

Legal and operational caveat: a smart contract does not itself prove physical delivery, product quality, real-world signatory authority or legal enforceability. Bilateral attestations and disputes require explicit evidence and offchain resolution. Already-finalized payments cannot simply be clawed back. Production agreements require jurisdiction-specific legal and security review.

Hackathon demo: onboard buyer and supplier, sign a testnet SPA with strict caps, complete one matching autonomous order without a contemporaneous approval, reject a changed-price order, pause on a simulated dispute, show records and settlement evidence. Keep the separate Hedera x402 paid API call to meet the sponsor track; an SPA goods payment is not a substitute.

## Self-funding agent economy: implementation gate

The service percentage credited from a completed purchase is only accrued/available revenue after verified settlement under the chosen fee policy. Goods funds must remain segregated from operating funds.

Before claiming self-funding, prove a supported automated bridge from the actual revenue asset/network to spendable 0G Compute credit, and a subsequent inference request debited from that credit. Hedera test tokens and sponsor-provided 0G Private Computer credits are not automatically convertible into 0G Compute balance.

Demonstrate no manual top-up during the self-funding run, explicit per-call and aggregate compute caps, balance-aware model choice or pause, and complete evidence. Human-signed emergency top-ups remain a permitted broader-product safeguard but cannot be used in the qualifying self-funding demonstration.

## Implementation status and verification

All additions in this revision are design decisions or proposed requirements, not claims of implemented contracts, deployed endpoints, legal validity or successful funding interoperability.

Sources checked 6 November 2026: https://ethglobal.com/events/mumbai/prizes/arkiv ; https://ethglobal.com/events/mumbai/prizes/hedera ; https://ethglobal.com/events/mumbai/prizes/0g . Reconfirm live track rules and submission cap before submitting.

<!-- Source footer text: Perenna product vision  |   (Word page field omitted in Markdown.) -->
