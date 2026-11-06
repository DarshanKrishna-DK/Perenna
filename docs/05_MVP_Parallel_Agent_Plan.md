# Perenna parallel agent build plan

Updated on 6 November 2026. The original backend/provider implementation has a verified live vertical slice. The user's newer visual instruction supersedes the earlier interface: pitch black, neon green, supplied robot logo and a complete Three.js spatial rebuild across every page.

## Current parallel work

- Experience agent: all eight page compositions, navigation, onboarding and accessible functional HUDs. Preserve authenticated workflows, immutable approvals, private rooms and real status.
- Design agent: complete shared CSS and one DESIGN.md. Use the explicit black/neon brief, robotic typography, shaped spatial surfaces, responsive layouts and reduced motion.
- 3D agent: one persistent Three.js world with eight scene variants, extruded local text, courier robot, supplied logo/favicon, local fonts, adaptive quality and a WebGL fallback.
- Root: protect provider budgets, integrate changes, review actual desktop/mobile renders, run browser and automated checks, maintain the single manual guide, and push verified milestones to the requested GitHub repository.

## Verified core and remaining gates

- Actual 0G mainnet API inference completed parsing, three-supplier public negotiation and a private immutable revision. All 20 authorized attempts are exhausted. The output ceiling is now 512; testnet 0G tokens do not extend API credits.
- Actual Hedera testnet service, goods and separate supplier-fee settlement, signed-review funding, bilateral SPA activation, two autonomous purchases, dispute stop, pause, revocation and withdrawal are verified.
- Five Arkiv writes and readback are verified. A later query changed both positive and adverse supplier eligibility under the same future policy. No further write is authorized.
- The conservative combined Hedera upper bound is 6.19513096 HBAR, below 10. Unknown EVM fee attribution retains maxima; no submitted transaction outcome remains unresolved.
- Final source passed 162 automated tests and a production build. All 28 browser checks passed, including accessibility and realtime recovery. All eight desktop/mobile routes rendered one actual WebGL scene without horizontal overflow; focused final readability checks also passed.
- Public source checkpoints d7e243e, 611e56c, c3c941d and e8dfc5c are pushed to feat/mvp, including the verified Three.js redesign. Push each verified major feature milestone or after one to two hours of active development, with one short understandable commit subject.
- New paid inference, public writes and Hedera execution are paused after the bounded verification. Retained receipts remain available.
- Self-financing earned fees into 0G compute and external customer demand remain unproved. Neither is inferred from synthetic records or testnet revenue.

## Earlier approved architecture

## Approved design

The application uses a Next.js interface and server routes, a separate durable Node worker, transactional SQLite storage for the single-host demonstration, shared runtime-validated schemas, and authenticated cursor-based event streaming. Node 24, installed package declarations and the lockfile determine the current runtime. Local installation, type checking, production compilation and browser checks have run; current bounded evidence is tracked in [prize-evidence.md](prize-evidence.md).

Use original Perenna implementation for the product. Standard provider SDK and library license notices remain intact.

The implemented modules are `src/domain`, `src/server`, `src/providers`, `src/components`, `src/app`, `src/i18n`, `contracts`, and `tests`. Negotiation orchestration runs in the server worker. Separate provider modules cover 0G Router, Arkiv, Hedera, Sarvam and explicitly enabled Groq fallback. A single package/lockfile owner reduces coordination cost. Authentication uses local accounts, secure password hashing and business-scoped server sessions; it does not imply legal business verification.

SQLite is appropriate only for this proposed local single-host deployment. Use real SQL transactions, unique constraints, a write-ahead log, a bounded busy timeout and one durable execution worker. Test concurrent orders against the real database. A future multi-host deployment would require a separate storage/deployment decision. Private data remains in the transactional store; Arkiv holds only approved public projections and attributable evidence.

### Complete first demonstration

Proposed reversible fixture: a fictional Mumbai cafe requests a specified quantity and unit of a standard consumable from four or five fictional suppliers. At least two suppliers qualify and negotiate. Some fail credibility, stock, geography or timing rules. English and Hindi voice/chat lead to the same editable structured intent. Actual constraints and prices determine results; no fixed winning supplier or prerecorded negotiation is permitted.

The journey is onboarding, intent correction, public/private preview, publication, screening, live group/private negotiation, comparable offers, exact one-off approval, confirmed testnet payment, intentional physical-event simulation, and updated signed evidence. Then activate a bounded agreement with a supplier, place a matching second order without a new approval, reject a changed-price order, and pause on a dispute. Show a separate useful autonomous paid HTTP service call under the operating policy.

Proposed demo economics for review: a 1 percent service fee added to the goods subtotal, excluding delivery and tax, rounded upward in the chosen test asset's atomic units and displayed before approval. This is a proposed configuration, not a decided commercial rate. Do not claim fee income until it is actually collected and reconciled through a verified supported path. If fee splitting is unsupported, resolve that design before enabling payment rather than presenting a simulated credit as earned funds. Indicative INR prices and actual testnet asset amounts remain visibly distinct.

### Features and engineering controls to include

- Editable intent summary with original and normalized quantity, unit, specification, dates/timezone, location, budget, missing-field clarification, and publication consent.
- Versioned buyer preferences separating mandatory filters from weighted tradeoffs. Every inclusion, exclusion and ranking cites the actual input/policy version and evidence.
- Independent buyer and supplier contexts, bounded parallel supplier fan-out, per-supplier failure capture, cancellation, round limits, usage reservations and schema-validated model proposals. Negotiators receive no signing or payment tools.
- Tenant-scoped group rooms and bilateral private rooms. Persist events before notification, include actor and stable sequence/correlation IDs, and replay only authorized history. Recheck revoked membership on subscriptions and replay.
- Comparable landed totals calculated as quantity times unit price plus declared charges. Money uses integer atomic units; local-currency indications use explicit decimal rules. Reject missing, negative, nonfinite, contradictory or out-of-policy terms.
- Immutable quote and policy revisions with readable change notices. Unknown order IDs fail; they never create a replacement order. Approval binds supplier, exact terms, payer/payee, network, asset, amount, fees and expiry.
- Real inventory/cap reservations, idempotent creation, durable worker leases and bounded reconciliation. Distinguish execution unknown, settlement unknown, confirmed payment and unresolved order acknowledgment. A retry cannot silently create a second charge.
- Separate goods, service-fee, operating and provider-credit records. Low funds pause work. Shared ledger totals and reserved exposure reconcile across concurrent requests.
- Role-authorized evidence with signer verification, expiry, revocation and simulated-event provenance. Both positive and adverse outcomes can change later screening; no blanket trust or delivery guarantee is implied.
- Accessible English/Hindi review, comparison, approval, error and recovery screens. Sarvam handles speech at the server boundary; denied recording permission preserves text use. Provider/model traces identify 0G versus authorized fallback accurately.

Optional agent interoperability can later expose typed capabilities and message envelopes. It is not a reason to add a second orchestration framework to the MVP. A mutable global event bus, in-memory money state, simulated negotiation, or a generic approve-by-ID endpoint cannot satisfy the above requirements.

### SPA and x402 payment design gate

For SPA goods execution, investigate a narrowly scoped testnet contract that holds only an explicitly funded bounded test balance. It must verify bilateral agreement version, permitted terms, active/dispute state, executor, nonce, expiry and remaining limits, then consume limits and transfer to the permitted recipient within one transaction. Test bypass and concurrency paths before allowing repeat orders. Funding, deployment and both signatures remain separately bounded user-authorized actions. This proposed component makes no claim about physical delivery or legal enforceability.

Hedera x402 uses a direct native signed transfer. Use its official exact scheme for the protected service call and the compatible one-off merchant flow, with an isolated policy-enforcing signer and durable reconciliation. Keep that path distinct from the SPA contract execution path. A registry hash next to an unrestricted native signer is insufficient onchain enforcement. If current Hedera contract/asset support cannot implement the proposed SPA component, return the concrete incompatibility for a design decision instead of silently downgrading enforcement.

The protected service should return a useful, bounded supplier capacity/lead-time assessment from disclosed sample inventory, and its result should affect screening or a transaction preflight. The response requires authenticated scope and confirmed x402 settlement. It is not evidence of a real supplier network or payment to 0G.

### Definition of the approval boundary

User verification of this plan permits the later build. It does not supply missing wallet identities, signing authority, provider balances, transaction limits, account terms, deployment permission or publication permission. Credentials are configured locally and never embedded in source. Before real testnet execution, present the actual payer, merchant, asset, purpose and caps. Live inference likewise uses only confirmed supplied/free credits within an agreed limit.

The earned-fee-to-0G-credit experiment remains outside the mandatory critical path until a permitted route is proved. SPA, bilingual voice/chat, real Arkiv reads/writes, live core inference, actual settlement and a separate autonomous service request remain mandatory MVP scope.

## Product and controlling scope

Perenna, with the subtitle **Business moves smarter.**, represents a business through English and Hindi voice and chat. The MVP covers procurement: confirm buying intent, publish a minimal time-bound request, screen fictional suppliers using attributable evidence, negotiate live, compare offers, authorize a purchase, settle on testnet, simulate fulfillment, and update signed credibility evidence.

Read all four source documents, particularly the complete [master prompt](03_Perenna_Codex_Master_Prompt.md). The 6 November standing-agreement revision supersedes older statements excluding recurring purchases or requiring approval of every goods order. The user's current request limits this session to conversion, planning, tooling setup, and feasibility review. The embedded instruction to start building does not override that limit.

Keep three authorization paths distinct:

| Path | Initial authorization | Execution rule |
| --- | --- | --- |
| One-off goods | Human approval of an immutable quote digest and complete payment terms | Any material difference blocks execution and requires fresh approval |
| Standing Procurement Agreement (SPA) | Explicit bilateral authorization of a versioned, bounded agreement | Matching repeat orders may proceed without a new approval; changed terms, dispute, revocation, expiry, or exhausted caps block |
| Agent service purchase | Previously authorized operating policy for listed services and payees | A matching x402 request may pay autonomously within reserved caps; it does not inherit authority from a goods approval |

Required providers are meaningful 0G Private Computer inference, Arkiv publication and evidence queries, Hedera testnet settlement, and Sarvam voice. Groq is an explicitly configured fallback. The earned-revenue-to-0G-credit loop is exploratory until interoperability is proved. See the [feasibility review](06_Hedera_Feasibility_Review.md).

## Team size and operating model

Use **one coordinator plus three workers**, matching the four concurrent agent slots available in this session. These are coding agents, separate from the buyer and supplier agents inside the eventual product. More coding agents would not remove dependencies on shared schemas, authorization, or real provider access.

| Role | Owned work | Proposed write boundary |
| --- | --- | --- |
| Coordinator | Shared contracts, runtime/dependency decisions, Hedera payments, SPA contract feasibility, integration and acceptance | Workspace manifests and lockfile; shared schemas; payment adapter; future smart contracts; integration documentation |
| Worker A: platform | Authentication, business membership, durable state, workflow transitions, inventory and budget reservations, order execution gateway | Domain and persistence modules; server routes; migrations with sole migration ownership |
| Worker B: intelligence and evidence | 0G adapter, negotiated proposals, supplier context isolation, Arkiv adapter, signed evidence, credibility | Agent orchestration and nonpayment provider modules; provider-specific tests and evidence |
| Worker C: experience | Coherent entry and onboarding, bilingual composer, speech interface, group/DM views, comparisons, approval, receipts and SPA controls | Frontend and translations; speech adapter if explicitly assigned; browser acceptance scenarios |

The paths are proposed boundaries, not existing directories. At kickoff the coordinator selects the actual layout and assigns exact files. Shared schemas, migrations, environment contracts, and dependency files each have one owner. Workers request changes to those files rather than editing them concurrently.

## Start with a small shared foundation

Before overlapping implementation, establish a runnable foundation, shared types, and endpoint contracts with reviewable version history. The concrete local architecture proposed above is the baseline. Pin exact packages, versions and signing libraries after checking current SDK compatibility. One owner manages the schema, migrations, manifests and lockfile.

Demonstrate reservation and concurrency invariants on the proposed SQLite database before enabling parallel execution. Revisit that choice only if dependency compatibility or the required execution topology makes it unsuitable. Browser memory is never the authoritative store.

Define the following shared contracts before workers branch:

- Authenticated actor context, business and room membership, policy version, correlation ID, and event cursor.
- Intent, public projection, supplier eligibility, immutable quote, approval digest, and inventory reservation.
- SPA version, both authorized signers, permitted terms, active/paused/revoked/expired state, and reserved/consumed limits.
- Independent goods, operating, network fee, revenue, and provider-credit ledgers with integer amounts and asset metadata.
- Payment attempt, idempotency key, unknown outcome, reconciliation evidence, and separate order/payment states.
- Provider result with safe request identifiers, model, usage, fallback provenance, and unsupported/blocked states.

## Dependency waves

| Wave | Coordinator | Worker A | Worker B | Worker C | Exit condition |
| --- | --- | --- | --- | --- | --- |
| 0: feasibility and contracts | Freeze authorization and API contracts; verify event scope and Hedera approach | Inspect persistence/auth options and define domain invariants | Verify current 0G/Arkiv interfaces and credential requirements | Map screens, Hindi behavior, accessibility and voice capability | Compatible stack and reviewable contracts; dependent provider gaps named |
| 1: durable foundation | Build payment boundary and an opt-in x402 test harness | Implement sessions, tenancy, persistence, seed, workflow and outbox | Implement 0G and Arkiv adapters against shared contracts | Implement onboarding and procurement workspace against contracts | Persisted confirmed intent; tenant checks; provider states visible |
| 2: one-off vertical slice | Integrate exact authorization, settlement and reconciliation | Connect inventory/cap reservations, immutable approvals, orders and ledger | Connect real negotiation, screening, Arkiv reads and attestations | Connect live rooms, comparisons, approval, receipt and voice | One genuine authorized end-to-end order with retained evidence |
| 3: standing agreements | Implement narrowly scoped registry/enforcement only after compatibility proof | Add SPA lifecycle, bilateral authority and atomic limit consumption | Connect agreement discovery and evidence effects | Add bilateral signing, agreement status and repeat-order controls | Allowed second order plus changed-price, dispute and replay rejection |
| 4: completion | Integrate separate autonomous x402 service purchase and reconcile receipts | Test restart, concurrency, tenant revocation and uncertain settlement | Record meaningful 0G IDs, Arkiv write/query, adversarial and credibility tests | Run desktop/mobile, English/Hindi, voice/error and full-journey browser checks | Required acceptance evidence passes; limitations and sponsor artifacts truthful |

The separate x402 service harness starts early in wave 1 to expose protocol blockers. Wave 4 connects that proved capability to a useful paid service in the product, such as a synthetic supplier-capacity validation service. The exact service and price remain a design decision. It must affect the procurement result and must not masquerade as 0G funding or a real supplier.

0G and Arkiv belong in the first working slice. Their deeper behavior can follow, but dummy sponsor calls do not satisfy wave 2. SPA is required by the revision and cannot disappear to shorten the schedule. The self-funding experiment cannot delay the mandatory flow or introduce real-money conversion.

## Keep parallel work reviewable

After the foundation is committed, prefer isolated Git worktrees/branches per worker if supported. Avoid creating a second repository. With a shared filesystem, apply strict file ownership and integrate sequentially. Do not switch the main checkout underneath another worker or let multiple processes rewrite the lockfile.

Each task contains: objective, allowed files, read-only dependencies, exact schema/API revision, acceptance conditions, test command, and known external gates. Each handoff contains: changed files, commands actually run, failures/skips, evidence references, and remaining questions. The coordinator reviews and integrates bounded changes frequently. No worker changes authentication, signing authority, caps, provider choice, or product scope unilaterally.

Use explicit task examples when building begins:

> Worker A: implement tenant-scoped room history and event replay against the agreed contracts. Own only the assigned server/persistence files. Verify an unrelated business and a revoked member cannot read or subscribe. Return changed paths and actual test results.

> Worker B: implement bounded buyer/supplier turns using the configured 0G adapter. Validate proposed quotes outside the model. Preserve request IDs and isolate private supplier context. No signing or payment tools are available to these agents.

> Worker C: implement the English/Hindi comparison and exact-approval screens using the agreed API. Show current persisted state and quote version. Cover stale approval, unavailable inference, permission denial, and narrow screens. Do not synthesize payment success.

## Acceptance gates and sequencing

Automated verification must cover tenant/room isolation, prompt injection, expired evidence and intents, changed quotes, concurrent reservations, duplicate callbacks, restart/reconnect, unknown settlement, ledger conservation, and SPA revocation/dispute/expiry/replay. Browser checks cover English and Hindi text and voice, desktop/mobile, actual negotiated messages, and both purchasing modes.

Run deterministic tests without external spending. Keep credentialed inference and testnet calls opt-in, serialized through an approved budget and wallet. A passed mock test never closes a live-provider gate. Retain real request IDs, transaction references, explorer links, writer addresses, query output, and receipt status in the evidence register.

The critical path is: shared contracts, tenancy and durable reservations, meaningful provider calls, exact authorization, verified settlement, then SPA and autonomous service behavior. Parallel work saves time on independent adapters, screens and domain modules; it does not make the critical path four times faster. No reliable duration estimate exists until provider access and signing compatibility are proved.

## Inputs needed when implementation is authorized

Accounts and credentials do not block planning or uncredentialed code. They block only their live tests. At kickoff confirm a synthetic demo category/geography, fee rate/base/rounding, credibility defaults, signing/custody approach, and the unresolved changed-quote incident. These are documented product decisions, not invitations to invent business facts.

Live execution needs user-controlled testnet identities and funding, allowed network/asset/payees, bounded transaction and compute authority, 0G model/mode and supplied credits, Arkiv RPC access and writer authority, Sarvam access, and optional Groq permission. Put secrets in the approved local secret mechanism. Do not supply secrets in chat. See [tooling status](07_MCP_and_Skills_Status.md) and the [manual setup guide](04_Perenna_Manual_Setup_Guide.md).
