# Perenna MVP build specification

Business moves smarter.

Latest version 2.0  |  5 November 2026

Business procurement with live agent negotiation and human approved orders

Implementation planning document  |  5 November 2026  |  Version 2.0 latest

### Purpose and product boundary

Build a demonstrable business procurement loop: onboard a business, collect buying intent through voice or chat, publish a time-bound request, screen suppliers using role-based credibility evidence, run genuine competitive agent negotiation, and return the best deals for human approval. Order and payment execution must remain bound to the exact approved quote.

All blockchain activity is on testnet. The MVP must execute the full dynamic flow, including agent economics, eligibility, bargaining, approvals, ledger writes, signatures and testnet settlement. It does not prove real supplier identity, physical fulfillment, marketplace liquidity, or sustainable agent economics. Seed four or five mock supplier businesses, inventory constraints and initial credibility, with clear, unobtrusive sample-data disclosure. Later credibility must respond to actual demo events and may worsen. Negotiation reasoning must be live and unscripted.

### What is decided and what is proposed

The source decision brief establishes business-only scope, Arkiv requests and credibility evidence, public competitive negotiation, a three-supplier shortlist, immutable quote versions, human approval, spending caps, a disclosed service percentage, and signed top-ups. Hedera x402 and 0G are intended integrations, not verified working capabilities.

This PRD proposes the detailed onboarding, records, state transitions, architecture, and acceptance tests needed to implement that direction. These are design requirements for review, not statements that the architecture or integrations have already been adopted, built, or validated.

### MVP outcome

- A business can complete one end-to-end buying request with multiple eligible live seller agents and compare structured offers.

- A human can approve one exact quote version and see whether ordering and payment succeeded, failed, or remain uncertain.

- The system prevents unauthorized quote changes, overspending, duplicate execution, and transfers from the goods budget into agent operations.

### Reading map

2  Scope and roles    3  Intent and request publication  
4  Credibility and negotiation    5  Approval and money  
6  States and recovery    7  Architecture and records  
8  Acceptance criteria    9  Dynamic demo and economy    10  Product screens and languages  
11  Access and realtime contracts    12  Build sequence and verification  
13  Integration contracts and sources    14  Prize evidence checklist    15  Open decisions

## Scope and participant roles

### Participants

A business may buy in one transaction and supply in another. Buyer and supplier are transaction roles, not permanent business categories. A human business representative confirms buying intent, approves commercial terms, sets caps, and signs any top-up. Buyer and seller agents act only within those permissions.

FR01  Business onboarding. Collect a business display name, category, representative, transaction role and contact preference. Associate the representative with the business account and signing identity. Capture goods spending limits and separate service or operating limits before execution. The exact identity and wallet onboarding method remains a design decision.

FR02  Truthful identity presentation. Provide live onboarding and editable business profiles. A business profile records whether it is seeded or newly onboarded, with an unobtrusive sample-data disclosure; never use repeated simulation banners across ordinary actions. Do not imply KYC, legal authority verification, or verified supplier status merely because an account or signature exists. A business can change its role for a new request without losing role-specific history.

FR03  Agent permissions. Persist the representative’s caps and permissions as an explicit policy version. Agents may clarify, negotiate, rank and propose. They may not silently raise caps, top up their funds, accept changed quotes, or treat another agent’s instruction as human authorization.

### Included in the demo

- Voice and chat buying intent capture, with a reviewable transcript or structured summary and human correction.

- Time-bound public requests on Arkiv; evidence-backed eligibility checks; public competitive group negotiation and a target shortlist of three.

- Optional private discussion with shortlisted sellers, followed by comparable final offers returned to the human.

- Version-bound approval, changed-quote notification, ordering and payment through the intended Hedera x402 path, subject to compatibility validation.

- Separate goods and agent operating balances, disclosed service percentage, enforced caps and signed top-up requests.

### Explicit non goals

Consumer purchasing, languages beyond English and Hindi, supplier discovery at production scale, accounting suites, inventory management, logistics orchestration, escrow, credit, financing, automatic dispute adjudication, automated refunds, autonomous recurring buying and generalized business operations are outside this MVP. English and Hindi are required for both voice and chat. Additional languages are outside this MVP.

Basic delivery and payment acknowledgments support credibility records; this is not a logistics or physical-delivery verification system. No self-sustaining earnings guarantee is part of the MVP.

## Buying intent and request publication

### Primary buyer journey

FR04  Capture complete intent. Accept English and Hindi voice and typed messages in one conversation, with an explicit language selector and editable transcript. Preserve the same intent state when switching input mode or language. Elicit product or service specification, quantity and units, acceptable substitutions, quality constraints, delivery destination at an appropriate level of precision, required delivery window, goods budget and currency, and request expiry. Distinguish a delivery deadline from the deadline to submit offers.

FR05  Resolve ambiguity. Ask focused follow-up questions for missing, contradictory or low-confidence fields. Show recognized speech as editable text or a structured summary. Never infer a binding quantity, unit, currency, payment commitment or deadline from an uncertain transcription.

FR06  Review before publication. Show the complete request, public fields, private fields, deadline and configured caps. Require the human to confirm publication. Keep personal contacts, exact private addresses, credentials, wallet secrets and other unnecessary information out of the public request.

FR07  Publish time-bound request. Write a request record to Arkiv with a unique ID, business reference, normalized intent, created time, expiry, policy version and record version. A request is open only after publication is confirmed. If publication is uncertain, reconcile by identifier before retrying.

FR08  Expire predictably. Stop accepting new offers when the authoritative request expiry is reached. Validate deadlines server-side. Expiry is a business rule even if the storage layer retains data. Do not assume record expiry means immediate or permanent data deletion.

### Exceptions and edits

Before publication, edits replace the draft. After publication, a material change creates a new request version, alerts participating agents, and invalidates offers that depend on superseded requirements. Existing offers cannot be carried forward silently. A cancelled or expired request cannot accept a new approval or execution attempt without an explicit new or renewed request.

If no supplier passes screening, explain the evidence gap and offer the human a revised request or a clearly disclosed policy revision. Do not silently lower eligibility requirements. If fewer than three eligible offers exist, show the actual number and the reason; never invent competing offers.

### Data minimization requirement

Public negotiation should use the minimum commercial details needed to compete. Store sensitive delivery details privately and disclose them only as required for the approved order. A human must be able to see what becomes public before publication. Retention periods and access controls must be specified before using real business data.

### Observable result

The user sees a request ID, current status, expiry and which requirements were confirmed. The interface distinguishes unpublished draft, confirmed publication and publication pending reconciliation.

## Credibility and live negotiation

FR09  Role-based credibility evidence. Read Arkiv evidence relevant to the participant’s role. Evidence records should identify the transaction, participant roles, dispatch and receipt claims and times, payment claims and outcomes, and the corresponding acknowledgments or signatures. Keep buyer payment behavior distinct from supplier fulfillment behavior.

FR10  Gate participation transparently. Apply a versioned, human-configurable eligibility policy, including a minimum score and an option to exclude new agents. Actually reject or remove ineligible suppliers from negotiation, and show why. Seed four or five suppliers: one or two with low credibility and two or three with varied factors. Exact score factors, weights and defaults remain undecided; demo values are not a validated risk model.

Recalculate role-based credibility from new demo events, retaining the policy version and explanation. Late, disputed or adverse outcomes can lower credibility; scores must not rise automatically after every event. Bilateral attestations establish that parties acknowledged specified claims. They do not establish physical truth, prevent collusion, verify quality, or guarantee future delivery. Unacknowledged, disputed or conflicting claims must remain identifiable and must not be displayed as settled evidence.

FR11  Create agents per order. Start isolated buyer and supplier agent sessions for the request. Give seller agents their own business constraints, stock or capacity assumptions, minimum acceptable economics and access to the current request. Supplier identities and initial state may be seeded, but offer decisions and conversational reasoning must be generated live.

FR12  Run public competition. Allow eligible seller agents to issue and revise structured offers through a shared negotiation channel. Log sequence, actor, timestamp, model invocation reference and offer version. Prevent cross-order context leaks, agent impersonation and instruction injection from seller messages. Enforce request expiry, round or time limits and inference spending limits.

FR13  Structure every offer. Require supplier ID, request version, item specification, quantity and units, unit and total goods price, currency, tax and delivery treatment, delivery promise, payment terms, validity deadline, constraints and immutable quote version. Reject incomplete or internally inconsistent offers from the comparable shortlist.

FR14  Shortlist and discuss. Aim to shortlist three eligible suppliers using the human’s requirements and disclosed ranking criteria. Optional private negotiation must preserve each seller’s private limits and must not leak a competitor’s confidential offer. Return revised structured offers to the same comparison view.

FR15  Return the best deals. Show total payable cost, delivery, requirements fit, credibility evidence and uncertainty. Explain trade-offs, including why a cheaper offer may rank lower. Ranking criteria beyond hard constraints are proposed configuration, not a decided formula. The human chooses; the ranking is not authority to buy.

### Live reasoning evidence

Demonstrate that a changed buyer constraint or seller constraint leads to new model-driven responses and offers at runtime. Fixed dialogue, replayed transcripts and scripted winning bids cannot satisfy this requirement. A recorded run may illustrate behavior but must be labeled as a recording, never a live run.

## Approval payment and agent funds

FR16  Approve the exact version. Present one immutable approval payload: request and quote versions, supplier, items, quantity, currency, goods amount, tax and delivery charges, service rate and amount, total payable, delivery and payment terms, expiry, and permitted operation. Bind the human’s approval to its digest and identity, with a timestamp and expiry.

FR17  Invalidate changed terms. Any quote modification creates a new version, not an in-place edit. Notify the human, show the differences and invalidate prior approval for the replacement. Require renewed approval even if the changed amount is lower. Recheck the approved version and validity immediately before execution.

FR18  Execute with bounded authority. Use a deterministic authorization check before the intended Hedera x402 ordering/payment path. Require a current approval, exact payload match, eligible supplier, sufficient funds and compliance with all caps. An agent message alone cannot pass this check. Only testnet networks and test assets are permitted. The supported test network, asset, settlement semantics and authorization mechanism require verification; mainnet execution is prohibited.

FR19  Disclose retained service percentage. Display the service percentage, calculation base, amount and collection timing before approval. The rate and base are undecided. Distinguish whether the fee is added to the buyer total or retained from settlement; do not assume either. Block approval until the selected commercial policy is unambiguous.

FR20  Separate balances and limits. Maintain separate goods funding and agent operating earnings. Enforce procurement and service or operating caps independently and show each balance and pending commitment. No inference expense or fee shortfall may silently consume funds reserved for goods.

FR21  Request a signed top-up. When available operating funds cannot cover permitted work, pause the dependent operation. Show the shortfall, requested amount, currency, purpose, recipient and revised operating limit. Resume only after a human-signed top-up is validated and funding is confirmed. A rejected top-up leaves the operation safely paused or cancelled.

### Execution and accounting safeguards

Use stable order and payment idempotency identifiers. Record approval, execution attempt, transaction reference and reconciliation result. If execution times out, show “Outcome unknown” and check authoritative payment and order state before any retry. Do not equate an API response, wallet submission or agent statement with confirmed settlement.

Reserve or account for pending spend so simultaneous requests cannot exceed the same cap. Define reconciliation between reservation, actual settlement and released balances. Service earnings become spendable only under a specified collection and settlement policy; pending fees are not available operating funds.

0G inference is intended. Its model availability, API behavior, authentication, billing and payment compatibility are unverified. Hedera x402 does not by itself establish a way to pay 0G or other API subscriptions. Converting test tokens into real inference credits is an unresolved critical dependency, not an assumed capability.

## States exceptions and recovery

### Request and negotiation states

Draft → Awaiting intent confirmation → Publishing → Open → Screening → Negotiating → Offers ready. The request can become Cancelled or Expired before execution. Publication uncertainty moves it to Reconciliation required. No offers ready state may imply that the offers are approved.

Negotiation ends when its time or cost limit is reached, the request expires, or enough valid final offers are obtained under the configured stopping policy. An exhausted operating budget leads to Awaiting signed top-up. Agent failures must be visible; remaining eligible agents may continue within the same time and budget limits.

### Quote and approval states

Proposed → Validated → Presented → Approved. A quote may become Superseded, Withdrawn or Expired. Approval applies to one quote version only. A modified quote returns to Presented and Awaiting approval; it cannot inherit Approved from its predecessor.

Approval must fail closed if the request version, quote, supplier, payment destination, fee, expiry or policy authorization no longer matches. Concurrent seller edits and buyer approval must resolve against one immutable version, with a final check at execution.

### Order and payment states

Approved → Preflight → Execution pending → Confirmed, Failed or Outcome unknown. Outcome unknown → Reconciled confirmed or Reconciled failed only after authoritative evidence is obtained. If the provider cannot establish an outcome, keep the case unresolved and prevent a blind retry.

If payment succeeds but order acknowledgment fails, show Payment confirmed and Order unresolved as separate facts. Pause further payment and reconcile with the same transaction and order identifiers. If order creation succeeds but payment fails, do not label the order paid. Recovery or cancellation obligations depend on the supplier’s terms and the payment design, which must be resolved for the testnet execution scenario; real-money use is outside scope.

### Delivery and payment acknowledgment states

Claim submitted → Counterparty acknowledgment pending → Acknowledged or Disputed. Preserve the original claim and later acknowledgments as attributable records. A missing acknowledgment is not proof of fraud; a signed acknowledgment is not proof of physical fulfillment. Do not overwrite a disputed history with a successful status.

### Required user feedback

- Always distinguish waiting for a human, waiting for funds, a provider failure and an unknown transaction outcome.

- Show the latest valid quote and explain why an older approval no longer applies.

- Permit cancellation before an irreversible action. If execution already occurred, explain the actual status instead of promising rollback.

- Keep a chronological audit trail without exposing wallet secrets, private seller limits or unrelated customer data.

## Proposed architecture and data contracts

### Separation of reasoning and authority

The voice/chat interface produces a structured intent for a request service. The request service publishes through an Arkiv adapter. An evidence service retrieves role-based history and applies the configured credibility policy. A per-order orchestrator runs core buyer and seller reasoning through the intended 0G Private Computer adapter and records structured offers. Groq is limited to explicitly disclosed fallback or support. Provider adapters must not route to direct paid OpenAI or Anthropic APIs.

A comparison interface returns finalists to the human. An approval service binds the human’s signature or equivalent verified authorization to the immutable payload. A deterministic execution service checks approval, funds and caps before calling the intended Hedera x402 adapter. An accounting and reconciliation service tracks commitments, settlement, service earnings and top-ups.

This separation is a proposed design, not a verified implementation. The model may propose an offer or action; only policy and approval checks may authorize execution. Provider adapters must expose capabilities and unsupported operations rather than fabricate success.

### Minimum records

DATA01  Business and policy. Business ID, role context, representative reference, demo label, signing identity reference, procurement and operating limits, currency and policy version. Never store raw signing secrets in application logs.

DATA02  Request and evidence. Request ID and version, normalized intent, public/private field classification, created and expiry times, Arkiv reference and status. Evidence includes transaction reference, roles, claim type, times, outcome, signers, acknowledgment status and synthetic origin marker.

DATA03  Negotiation and quote. Order-scoped session ID, actors, live inference references, message visibility, structured offers, quote versions, validity, negotiation limits, shortlist reasons and timestamps. Restrict access to private conversations and seller constraints.

DATA04  Approval and execution. Approval digest, quote version, approver, signed payload reference, timestamps, expiry, revocation or invalidation event, order ID, idempotency key, payment attempt and transaction reference, separate order/payment status and reconciliation evidence.

DATA05  Balances and top-ups. Goods funds, operating funds, reservations, settled debits and credits, disclosed fee policy and accrued versus available earnings. Top-ups record amount, purpose, recipient, cap impact, human authorization and funding confirmation.

### Trust and operational boundaries

Treat public requests and agent messages as untrusted input. Validate schemas and numeric values; prohibit negative prices and contradictory totals. Restrict each agent to its order and role. Protect human approval and payment credentials from model access. Audit policy decisions and failures with correlation IDs. Specify private-data retention and deletion behavior independently of Arkiv record lifetime.

## Acceptance criteria and demo evidence

The following are release tests for the focused MVP. Passing a mocked adapter test does not demonstrate a working external integration; evidence must identify the environment and each synthetic component.

AC01  Onboarding and roles. A business completes onboarding, sets independent caps, and participates as buyer or supplier across separate requests. A consistent, unobtrusive sample-data disclosure identifies seeded businesses and a persistent environment indicator identifies testnet; neither obscures the workflow.

AC02  Voice and chat. English voice, Hindi voice, English chat and Hindi chat each produce a reviewable intent. A deliberately ambiguous quantity, currency or speech transcription triggers clarification before publication. The human can correct the summary.

AC03  Arkiv lifecycle. A confirmed request has an actual testnet Arkiv reference and deadline. Expired or cancelled requests reject new offers or approvals. Publication timeout is reconciled without duplicate requests. Simulated writes do not pass.

AC04  Credibility gate. Seed four or five varied suppliers and demonstrate actual exclusion using the chosen score threshold and no-new-agents rule. Later positive and adverse events recalculate credibility and affect eligibility. Show missing or disputed evidence, role separation and the limits of acknowledgments.

AC05  Genuine negotiation. Multiple seller agents produce live, structured offers. A runtime change to buyer constraints or seller economics changes their responses without selecting a prerecorded script. Logs identify model calls, timing and resulting quote versions.

AC06  Human choice. The comparison presents three finalists when available, or honestly states fewer. A private shortlist exchange, if exercised, generates a new structured offer without exposing another seller’s confidential data. No ranking initiates purchase.

AC07  Version binding. Approve version A, then change price, quantity, delivery or fee to version B. Execution of B is blocked until a new human approval; the human receives the changed-quote notice. An approval-versus-edit race cannot charge unapproved terms.

AC08  Funds and caps. An order above a goods cap is blocked. An operating shortfall cannot debit the goods balance. A top-up cannot execute without a human signature and confirmed funding. Pending parallel orders cannot together bypass the configured cap.

AC09  Payment safety. Retry the same approved action after timeout. At most one order/payment succeeds. An unknown payment outcome stays unresolved until reconciled. Payment success with failed order acknowledgment is visible as two separate states.

AC10  Integration honesty. Capture real testnet Hedera x402 settlement, fee accounting, ledger writes and signatures, plus a meaningful live 0G core inference path. A Groq-only run is incomplete for the intended 0G integration. Unsupported paths are blocked and disclosed. Mocked settlement, static balances or fabricated writes do not pass. Groq support or fallback must be distinguished from 0G usage.

AC11  Claims and audit. Record pending, acknowledged and disputed claims with actual demo signatures and testnet Arkiv writes. If delivery simulation buttons are used, label them as simulation while creating actual event records. The audit links events to changing credibility without claiming real shipping.

## Dynamic demo and economic boundaries

### Seed data and dynamic behavior

Create four or five clearly fictional suppliers with seeded inventory, limits and initial role-specific credibility. One or two should fail a normal eligibility policy; two or three should vary enough to create meaningful trade-offs. Seed values initialize the world. They must not preselect the winner or dictate a scripted negotiation.

The human can change the minimum credibility score or exclude new agents. The eligibility engine must actually reject or remove suppliers, record the policy version and update the candidate set. Evaluate policy before admission and again before approval or execution; never let a removed seller remain eligible through a stale shortlist.

Subsequent events must dynamically update credibility under the configured policy. Demonstrate an adverse event that worsens a seller’s standing and changes later eligibility, alongside a successful acknowledged event. Show the underlying factors and avoid suggesting that these demo weights are validated predictors.

### Optional physical event simulation

A proposed demo control may let participants simulate dispatch, receipt, lateness or a dispute. Every such event must say “Simulated physical event”. The control triggers actual role-authorized attestations or acknowledgment requests and real testnet Arkiv writes. Counterparty acknowledgment remains a separate step; a button must not silently sign for both sides.

These controls simulate physical events only. They do not simulate the signatures, storage writes, recalculation, agent decisions or payment settlement required by the MVP. The interface must not claim that goods were actually shipped or received.

### A real dynamic agent economy on testnet

After confirmed testnet settlement, calculate the disclosed fee under the approved rate and base, credit the agent operating ledger and show the transaction trail. Later operating expenses or reservations reduce the appropriate balance under the agreed accounting policy. Low funds trigger a real approval flow and human-signed testnet top-up; a hard-coded animation is insufficient.

Maintain two visibly distinct concepts: test-token economic accounting and actual provider credits or paid inference usage. A testnet fee balance does not demonstrate spendable value at 0G, Groq or another provider. Do not report provider expenses as funded from earned fees unless the conversion and payment path is actually verified.

### Inference and cost strategy

Prefer free tools or available credits where feasible. Groq is a proposed support or fallback inference provider, with that role clearly disclosed and API secrets kept outside documents and logs. Use free tiers or sponsor credits only; no direct paid OpenAI or Anthropic APIs are allowed. A demo using only Groq for all reasoning does not demonstrate meaningful 0G inference and may undermine the intended 0G prize objective. The cited Mumbai prize page requires the main flow to use 0G Private Computer and show request IDs. Recheck current prize rules; implementation compatibility remains unverified.

Run the main procurement reasoning flow through 0G Private Computer and retain request IDs. Validate actual model access, latency, credits and billing before claiming it works. If insufficient real provider credit blocks inference, request the necessary human authorization or disclose the blocker. A test-token top-up cannot be presented as purchasing real compute without a verified route.

## Product screens and bilingual interaction

### Polished public entry and onboarding

Build a polished responsive web experience with consistent typography, keyboard support, readable contrast and one primary action per state. The public entry explains procurement and opens live sign-in or onboarding. Create actual business state; seeded suppliers are not real customers.

Onboarding collects business identity and role, representative identity, default language, signing identity reference, goods and operating caps, and eligibility preferences. The profile screen allows authorized edits and shows current guardrails. Sensitive or execution-affecting changes create a policy version, never silently rewrite an existing approval.

### Buyer workspace

Provide a request dashboard and a single English/Hindi composer with text, microphone, transcript review and submission. Avoid redundant buttons. Distinguish recording, permission denial, transcription progress, retry and cancel states.

Show structured intent beside the conversation, highlight missing fields and offer review-and-publish when complete. After publication show expiry, eligible participants and negotiation status with context-sensitive controls.

### Negotiation comparison and execution

The order workspace includes authorized group agent text and private DM threads, live updates and persisted history. Separate the conversation from structured competing offers. The comparison shows finalists, commercial totals, service fee, credibility factors, caveats and quote validity. A single approve action opens the exact version-bound approval summary; a changed quote opens a readable diff and renewed approval.

Show goods funds, agent earnings, pending commitments and operating limits in a finance panel. A funding shortfall opens one itemized top-up flow. Show order and payment outcomes separately and provide reconciliation status for uncertain outcomes. Do not add a second payment action after a pending or unknown submission.

### English and Hindi behavior

Support both languages in voice and chat, including intent clarification, request review and essential approval or error text. Test Hindi speech, Hindi script input and mixed-language product names. Preserve quantities, currency, identifiers and units exactly when translating. Low-confidence speech requires correction before publication or approval.

Sarvam is a candidate for speech recognition, speech generation or language support, subject to actual API and free-tier availability. Confirm its capabilities rather than assume them. If spoken replies are supported, provide visible text and an accessible playback control. Core procurement reasoning remains assigned to 0G Private Computer; speech preprocessing or translation is a separate adapter role.

### Honest environment disclosure

Use a small persistent Testnet indicator and a concise sample-data explanation, not ubiquitous simulation banners. Keep intentional delivery test controls clearly named, such as “Record test receipt”, and show that they do not represent real shipment. A blockchain transaction may be real on testnet while its represented physical event is simulated; disclose both facts without clutter.

## Access controls and realtime contracts

### Authorization enforced on the server

Authenticate each human session and resolve authorized business memberships on the server. Every request, offer, profile, policy, transcript, approval, order and ledger read or write checks business and order scope. UI hiding is not authorization. Public onboarding does not make profiles, finance records or private discussions publicly readable.

The business owner can see live and historical text for the business’s own agent interactions and authorized order groups. Group participants can access only the group to which their business is admitted. Private DMs are visible only to the two participating business contexts and their authorized representatives. A competing supplier must not read another supplier’s private messages, economics, credentials or unrelated order history.

Apply the same checks to list/search, single-record fetch, downloads, websocket or event-stream subscription, reconnection and historical pagination. Removing a supplier or business member revokes future access immediately and follows the defined retention policy for already-authorized history. Server filtering occurs before data is sent to the client.

### Proposed internal service interfaces

API01  Business and intent. Create or update business/profile and policy; create request draft; append a user message or audio transcription; return normalized intent with missing fields; confirm a version for publication. Each mutating call includes actor context, expected version and idempotency key where repeatable.

API02  Negotiation and conversations. Read authorized order messages with cursor pagination; subscribe to new message events; append a signed or authenticated agent message; submit a structured quote version; revise or withdraw a quote. Server validation checks agent role, order membership, expiry and policy eligibility.

API03  Approval and execution. Create an approval challenge for one quote digest; verify human authorization; execute that approved payload; read execution status; reconcile an unknown outcome. Reject stale expected versions with a conflict response and return current safe state without automatically resubmitting.

API04  Economics and evidence. Read balances and commitments; create and confirm a top-up challenge; append a role-authorized event claim; acknowledge or dispute it; recalculate credibility; retrieve its policy and evidence explanation. Every settlement and fee event links to the testnet transaction reference.

### Persistence and event delivery

Use a transactional store for account membership, private conversations, immutable quote and approval records, balances and execution state. Use Arkiv for public requests and the intended evidence records. An append-only event or outbox pattern is recommended so a committed state change and its realtime notification cannot drift silently. These are proposed implementation choices, not verified external API features.

Each event carries an ID, order ID, event type, actor, server timestamp and record version. Reconnecting clients resume from a cursor, deduplicate event IDs and fetch the authoritative state on gaps. Never expose private reasoning traces or credentials; show agent messages and concise decision explanations, not hidden chain-of-thought.

## Build sequence and verification plan

### Stage one validate dependencies and bootstrap

Build from scratch in the user-selected new repository. Do not reuse earlier Perenna code or design. Choose the stack, database, authentication and testnet signing approach at kickoff. Keep secrets server-side in environment configuration supplied by the user. Validate 0G model access and credits, Sarvam speech if selected, Groq fallback, Arkiv writes and Hedera x402 testnet settlement. Record versions, endpoints, network and assets.

No purchases, mainnet transactions or paid API fallback are permitted. If a required free tier or sponsor credit is unavailable, report the exact missing capability and stop that dependent path. A configurable adapter is useful for testing, but its mock mode cannot satisfy the required live integration acceptance test.

### Stage two build durable product foundations

Implement public entry, authentication, onboarding, profiles, memberships, guardrails and persistence. Add bilingual voice/chat, intent validation and publication. Seed suppliers once with a repeatable operation; never reset dynamic history during an order.

### Stage three build negotiation and credibility

Implement evidence retrieval, dynamic credibility and real eligibility rejection. Run live agents with bounded costs, validated quotes, group/DM conversation and persisted history. Add comparison and shortlist; verify changed constraints produce fresh reasoning.

### Stage four implement authorization and economics

Implement quote versions, exact approval, change notices, preflight, idempotency and reconciliation. Add separate balances, fees, reservations, caps and signed top-ups. Test partial failures. Add intentional delivery test controls and real attestations.

### Required tests beyond page eight

- Cross-business access: business A cannot fetch, search or subscribe to business B’s private order, ledger or DM, including guessed IDs and reconnect cursors. An excluded seller cannot rejoin using an old session.

- Bilingual coverage: English voice/chat and Hindi voice/chat complete the same request. Uncertain speech cannot change a quantity or currency silently. Language switching preserves the confirmed intent and approval terms.

- Dynamic profile and guardrails: profile edits persist, caps and eligibility settings take effect on the server, and a mid-flow policy change is reconciled before execution.

- Economic accounting: a completed testnet order posts the disclosed fee once. Concurrent reservations respect caps; duplicate callbacks cannot double-credit earnings. Exhausted provider credits do not trigger a paid fallback.

- Production-like UI: keyboard navigation and narrow screens work; empty, loading, denied, failed and unknown states have useful text; each state has one clear primary action; sample/testnet disclosure remains visible without repetitive banners.

### Codex handoff and completion evidence

Implement in the staged order above. Deliver runnable source, environment variable names without secrets, repeatable seed setup, schema/migrations, test commands and a concise runbook. Capture live provider and testnet transaction references, permission tests and a bilingual end-to-end walkthrough. Mark every unresolved dependency; do not claim the required MVP is complete if a mandatory live path remains mocked or blocked.

## Integration contracts and source checks

### 0G core inference and credit boundary

The ETHGlobal Mumbai prize page states that the main flow must use 0G Private Computer and show request IDs, and that participating teams receive compute credits. Therefore route meaningful core buying and negotiation reasoning through that service, capture its returned request IDs, and make evidence available in the technical demo. Groq may support or fall back, but an all-Groq run does not demonstrate this requirement.

Recheck the live prize rules and actual participant credit allocation at build kickoff. Document which model and endpoint are available and validate real requests before committing to a model-specific architecture. Testnet gas and compute credits are distinct resources. Neither gas faucets nor a Hedera test-token fee balance demonstrate entitlement to spendable inference credits.

Sources: ETHGlobal Mumbai prizes, https://ethglobal.com/events/mumbai/prizes ; 0G funding guidance, https://build.0g.ai/funding . These source facts do not establish this application’s working compatibility or prize eligibility.

### Arkiv persistence on testnet

The current documented public Arkiv testnet is Rabdi, chain ID 7794095, with tGLM for gas. Configure the Arkiv adapter explicitly for Rabdi and reject a production network in the MVP. Verify provider URLs, wallet support, SDK version, write confirmation, query behavior and record lifetime before implementation. Keep the configured network visible in diagnostics.

Source: Arkiv Rabdi network documentation, https://docs.arkiv.network/networks/rabdi/ . Recheck network availability and configuration at build time; a documented network does not guarantee a successful write from the selected runtime.

### Hedera x402 transport versus business semantics

The researched candidate is x402 v2 with @x402/hedera, using the hedera:testnet network identifier and either native HBAR asset 0.0.0 or an explicitly selected HTS token ID. The proposed facilitator endpoint is https://x402.org/facilitator . Pin and verify supported package versions, assets, facilitator network coverage and response schemas before any integration claim.

x402 payment transport and facilitator verification do not automatically implement business invoice semantics, inventory reservation, order acceptance, cancellation, fee splitting or refunds. Treat compatibility for an approved procurement invoice and a separately accounted service percentage as unverified. The execution service must bind the payment to its approved order payload and independently reconcile supplier order acknowledgment.

An MCP server is an optional developer aid, not an autonomous payment engine or a replacement for the application’s authorization, signing, accounting and reconciliation services. A successful tool setup is not proof of an end-to-end order.

Sources: https://docs.hedera.com/solutions/ai/x402/pay-with-x402 ; https://docs.hedera.com/solutions/ai/x402/merchant-integration ; live facilitator capability list https://x402.org/facilitator/supported . Revalidate supported networks and assets at runtime.

### Adapter completion gate

For each provider retain the selected version, documented capability, actual successful request or transaction reference, network, failure behavior and free-tier or sponsor-credit availability. Resolve the specific order/payment and fee policy before testnet execution. If a capability is absent, report the gap rather than substitute a hidden paid route, mainnet call or mocked success.

## Prize evidence and submission checklist

### Check rules before building and submitting

These are source-backed requirements reported from the current Mumbai prize pages, not a guarantee of eligibility or an exhaustive rules audit. Recheck the live pages before finalizing scope or submitting. Public repository publication and competition submission are separate actions; preparing this build document does not authorize either action.

### Hedera autonomous service payment

The Hedera prize requires a protected endpoint settling on Hedera and at least one paid request without human approval at request time. It also calls for a public repository, a settled transaction ID and a video of no more than five minutes with HashScan evidence. Source: https://ethglobal.com/events/mumbai/prizes/hedera .

Keep two separate authorization tracks. Goods procurement always requires explicit approval of the exact quote version. A narrowly scoped agent service request may execute autonomously only under human-preconfigured merchant, endpoint, purpose, testnet asset, per-request cap and aggregate operating cap. The human grants that policy beforehand; the service request does not ask again at execution time if every bound still matches.

For the protected test endpoint, implement an actual x402 challenge and settlement on Hedera testnet, then grant the service response only after payment verification. Use idempotent request/payment references, log the applicable policy version, and reject an unlisted merchant, changed asset, exhausted cap or unknown prior outcome. The endpoint’s function and price must be explicitly chosen during the build, not assumed to be a real compute provider.

This autonomous testnet service payment can demonstrate the required payment mechanism; it does not prove that earned test tokens fund 0G inference. Keep service payment authorization separate from goods approval and from the human-signed top-up flow. Do not remove goods approval to satisfy a prize requirement.

### Arkiv evidence and repository files

The Arkiv prize page requires documented schema and usage, runnable queries, writer addresses and a public repository with license and AI disclosure. Prepare these repository files: /arkiv/schema.md, /arkiv/friction.md, /arkiv/reach.md, /arkiv/why-arkiv.md and /arkiv/how-you-use-arkiv.md. Verify exact paths and formatting against the current rules at submission time.

Describe request and evidence entities, attributes, relationships, expiry assumptions and public/private boundaries. Include working retrieval examples and testnet writer addresses. Record actual implementation friction and how the application uses Arkiv; do not invent usage metrics or claim production customers from seeded demo data. Source: https://ethglobal.com/events/mumbai/prizes/arkiv .

### 0G and shared demo evidence

Capture the main flow’s 0G Private Computer request IDs, actual available sponsor-credit setup and a demonstration of live reasoning. Show bilingual buying intent, real supplier filtering, agent group/DM controls, quote changes, fresh approval, testnet settlement, service fee posting and credibility updates. Distinguish test physical events from actual writes and signatures.

The handoff should include a concise evidence index linking test runs to request IDs, testnet transactions and repository documentation. Keep secrets and private conversations out of public evidence. The user decides when the repository and video are published and the submission is sent.

## Uncertainties and release decisions

### Decisions required at build kickoff

- Credibility policy: which role-specific factors, weights, thresholds, recency and dispute treatment determine eligibility? Who can revise the policy?

- Service economics: what percentage applies, on what base, who pays it, when is it collected, and what happens on cancellation, failed execution or refund?

- Payment design: which testnet asset and exact Hedera x402 component versions support the intended flow? How do human approval, settlement, idempotency and order acknowledgment interoperate?

- Inference design: which 0G Private Computer model and API can run the main flow, with what latency, credits, authentication and billing mechanism? Is any payment path actually compatible?

- Onboarding and signatures: what establishes control of a business account and signing identity in the demo? What extra checks would be needed for real businesses?

- Negotiation policy: how long do sessions run, how many rounds and offers are permitted, how is ranking explained, and when does optional private discussion begin?

- Changed-quote incident: clarify the mentor’s exact underpayment or loss scenario. Test known version and race hazards now; do not claim the unclear incident has been fully resolved.

### Release gates

The MVP requires dynamic voice/chat, live reasoning, eligibility filtering, negotiation, quote revisions, approvals, agent balances, real ledger writes and signatures, testnet x402 settlement and fee accounting. Only supplier businesses, inventory or limits, and initial credibility are seeded. A blocked or mocked required integration means a partial demonstration, not a complete MVP.

Mainnet and real-money blockchain settlement are outside this MVP. Testnet execution still requires exact authorization binding, reconciliation, fee treatment and duplicate-charge prevention. External inference credits are restricted to free tiers or sponsor allocations and must remain visibly separate from test-token accounting. The user supplies permitted credentials and test tokens; the application must not buy credits, upgrade plans or switch to paid providers. Intended integrations must not be represented as verified.

Completion requires the acceptance tests on page 8, retained test evidence and an explicit account of remaining integration limits. No launch date, fee rate, unsupported language coverage or production-readiness claim is implied by this document.

### Evaluation measures

Track completed intent capture, admitted suppliers, valid competing offers, live negotiation completion, time and inference spend per request, human selection, approval invalidations, cap violations prevented and reconciled versus unresolved executions. Establish numerical performance targets after a measured prototype; no target is asserted as proven here.

### Source and status

Product source: Perenna MVP decision brief dated 5 November 2026 and subsequent direction on the dynamic testnet demo, English/Hindi voice and chat, protected live agent conversations, production-like UI and free-tier or sponsor-funded integrations. This build specification defines proposed implementation contracts for Codex. No software implementation or external compatibility verification is claimed.

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

<!-- Source footer text: Perenna MVP PRD  |   (Word page field omitted in Markdown.) -->
