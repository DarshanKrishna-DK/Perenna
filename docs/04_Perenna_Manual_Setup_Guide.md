# Perenna manual setup guide

## What you still need to do

Updated on 6 November 2026. Implementation is underway under the approved [build plan](05_MVP_Parallel_Agent_Plan.md). This checklist supersedes the older setup status retained below.

The local application runs at http://127.0.0.1:3000. Latest verification passed 161 automated tests across 39 files and the production build. An earlier browser checkpoint passed 28 desktop/mobile scenarios. The complete live blockchain flow remains unverified. The newer live proofs below do not establish full MVP completion.

Only these actions currently need your input:

- Review the working MVP and its actual live evidence. Existing approvals below cover the bounded provider and testnet checks, so they do not need to be requested again.
- Rotate the previously displayed testnet keys after the working MVP is ready. You explicitly deferred rotation until then; it is not a current build gate.

No other action or renewed approval is currently pending within the recorded scope.

**0G billing correction:** the user confirmed that the configured API key is a mainnet inference key. Its calls consume mainnet credits/tokens. Exact mainnet token consumption and remaining balance are unknown and have not been verified. All 20 historically authorized calls are consumed, so no further 0G call is authorized. The separate 10 testnet 0G tokens are not an inference-credit balance or an additional allowance. Hedera chain 296 and Arkiv chain 7794095 remain testnet blockchain transactions; they do not determine 0G API billing.

| Step | Your action | What I can handle |
| --- | --- | --- |
| 1. Keep browser available | Keep the existing Chrome profile available for account setup. | Desktop Commander remote was repaired using an isolated npm cache. BrowserAct verified access to the existing signed-in Hedera portal. The native Codex browser bridge remains unavailable. |
| 2. Prepare 0G | All 20 authorized mainnet API attempts are consumed; failed attempts count. No further 0G calls are authorized. The separate 10 testnet 0G tokens add no inference allowance. | Live negotiation, English/Hindi parsing and a private Mango revision used the mainnet-billed key. The final private reply used the 512-token ceiling. Exact mainnet token cost and remaining balance are unverified. |
| 3. Fund Arkiv writer | Faucet receipt of 10 tGLM is confirmed. Up to five writes are approved, at most 0.002 tGLM each and 0.01 tGLM total; two writes are used. | Both actual writes were confirmed and read back. Current request version 2 under policy 3 passes live discovery. The dedicated writer remains `0x9253705482a44e6A7378163e57cc791AE6213ed5`; its key stays in `.env.local`. |
| 4. Prepare Hedera | The user approved creation fees up to 1.1 HBAR per role within the shared 10 HBAR ceiling, with initial role funding of 0.1, 0.2 and 0.5 HBAR. Rotation remains deferred. | Funded roles are verified: operating/executor `0.0.11332965`, SPA supplier `0.0.11332983`, fee/top-up `0.0.11332984`. Original native merchant `0.0.9823983` is preserved. The conservative setup commitment is 4.5233928 HBAR, including the deployment reserve and earlier failed fee. |
| 5. Confirm provider budgets | Already authorized: Sarvam up to 100 credits, Groq within its available daily allowance, and 20 bounded 0G calls in total. | Four real Sarvam calls passed English and Hindi synthesis-to-transcription checks. Human microphone and listening acceptance remain pending. Groq inference has not run at this checkpoint. |
| 6. Approve bounded execution | Existing approvals cover the bounded checks. No additional 0G call allowance is assumed. Application reviews are verified against their exact terms. | A real x402 service purchase returned confirmed HTTP 200. Buyer creation and supplier acceptance activated the SPA; two scheduled orders paid 14222 tinybars each under prior bilateral authority. A simulated dispute then stopped local execution and an application-confirmed onchain pause blocked future execution. One-off goods, separate fees and signed evidence publication remain unverified. |
| 7. Review the running MVP | Review the local screens and final acceptance evidence when ready. | Parallel implementation covers all eight pages, durable authenticated procurement, negotiation jobs, payment reconciliation, signed evidence and bounded standing agreements. Automated checks are running; required live blockchain evidence remains pending. |

Do not paste API keys, wallet seeds or private signing keys into chat. Store credentials only in the approved local secret mechanism. Owner login, human verification, initial wallet consents and signed funding reviews remain explicit. Within a valid exact goods approval or previously signed operating/agreement policy, the application can execute its bounded payments without another payment dialog.

### Latest live evidence

- SPA registry: `0x70a836F8bEaDCF6Fe57278a0E1E6Ba25ad1dF637`, transaction [`0x32bcdafd03a0213b5c49f41cef72f97ce84aaa910b370c798e2fbaa2f048ee2a`](https://hashscan.io/testnet/transaction/0x32bcdafd03a0213b5c49f41cef72f97ce84aaa910b370c798e2fbaa2f048ee2a). Runtime matches reviewed hash `0x0670d32069ae27c015ac89c4b75efc1311d9952aea8fe40df3dcde5e5affe0e4`. The retained maximum is not an actual-fee claim.
- Failed native role creation: `0.0.6886052-1793929735-629904636`, consensus `INSUFFICIENT_TX_FEE`, actual charge 0.0029589 HBAR, no created account and no resend.
- Subsequent role setup is verified and funded: operating/executor `0.0.11332965`, SPA supplier `0.0.11332983`, fee/top-up `0.0.11332984`. The original native merchant `0.0.9823983` remains separate. Setup conservatively commits 4.5233928 HBAR, including the unresolved deployment reserve and original failed fee.
- Operating top-up: 0.3 HBAR, transaction [`0x16cf9611b7afef46b22442445d5da2a6080526554a961919751e481e72cfed6f`](https://hashscan.io/testnet/transaction/0x16cf9611b7afef46b22442445d5da2a6080526554a961919751e481e72cfed6f). The application returned HTTP 200 after confirming the exact signed review and receipt.
- Paid capacity service: purchase `95ec2b50-8a0c-4060-83a8-197a078b9082`, 1000 tinybars, native transaction `0.0.9185802@1793932008.022979442`, confirmed application HTTP 200. The unsigned failed attempt and explicit retry are preserved; only one payment occurred.
- SPA buyer creation `0x2a9338c49b776e91e0dd2d10cf6220d803638fca6e710182d6071b2c7d02742f` and supplier acceptance `0xaefeadb80ccafd8dded07cd6f5104de51b0fafdc103b2ef01fac7475d8746006` are application-confirmed. Two scheduled payments of 14222 tinybars followed the signed 60-second cadence: `0xcdecf2a288eab2c9932a486d7eab83219ecc6fdf963fb26cf810ae96a3777bf6` and `0xf177f45f526fa0078956bb8893d844d5f919f0325b7f768d44084cd279216295`. The earlier rejected preparation remains without a payload or hash.
- Native 0G parse requests: English `15540326-38ce-4061-ba4c-152510a3756e`; Hindi `72e5bba5-90aa-4e18-a250-b59995d51137`. A later seven-call public negotiation produced three quotes using live Arkiv discovery of request version 2 under policy 3. Usage is now 20 of 20 attempts. The final private Mango reply, request `67f0e961-0d55-480b-8981-d97fc2f3a2c1`, produced quote version 2: unit price 2150 minor INR versus 2200, total 120575 minor INR. It succeeded under the 512-token ceiling. The full 20-call allowance is exhausted; no further 0G calls are authorized.
- A simulated dispute on the second SPA order immediately stopped local future execution. Exact onchain pause `0x9718247d7c879e3b9890195df53876ce8779b21829d39b49d865c6cc7c9388a4` was application-confirmed with HTTP 200 and status `paused`. This is a simulated physical dispute, not a claim of real delivery failure.
- Arkiv has two confirmed writes with readback, using two of five approved writes. Current request version 2 under policy 3 passes live discovery: entity `0xa0b97c98f56022865db9375f3065ee010655a79b5c8d3776393d3ceb9153f562`, transaction `0x17c3cd5f5cd5b923bb75edb422e41f8690f5fc63479b01992138ffd2861aaadb`. Schema `perenna.intent.v2` separates offer expiry from delivery and publishes opaque commitments, not raw tenant/intent UUIDs. Both write references are retained in [prize-evidence.md](prize-evidence.md).

Periodic Git pushes to the existing Perenna repository are now authorized. The first `feat/mvp` milestone is being prepared; no commit or push success is claimed yet. This does not authorize application hosting or event submission.

### Historical preparation status

The following entries describe the preparation checkpoint, not current completion. The 32/100 score predates implementation and has not been rerun against the finished MVP.

- Hedera Docs and Arkiv General MCPs work as native tools in this conversation. The official Arkiv Mumbai MCP was also verified and registered.
- Seven project skills are installed and discoverable, including the Hedera submission validator. Its current evidence score is [32/100](06_Hedera_Feasibility_Review.md), not an official judge score.
- At the historical preparation checkpoint, Groq and Sarvam model-list authentication succeeded. That limited check does not describe the later mainnet-billed 0G inference calls recorded above.
- The x402 facilitator advertises Hedera testnet support. No payment, signature, contract deployment or product integration has run.

The three selected partners remain Arkiv, Hedera and 0G. Additional MCPs are optional; they do not replace runtime accounts or SDK integration. No new paid plan or token purchase is required by this guide. Actual 0G inference used the mainnet-billed API key, as corrected above; its exact monetary/token usage remains unknown.

## Original detailed setup reference

Business moves smarter.

Latest version 2.0  |  5 November 2026

Document 4  |  Before implementation  |  Verified 5 November 2026

Prepare the accounts, test funds, API access and development connections needed to build Perenna from scratch. Complete the required checks before handing the implementation specification to Codex. This guide does not create the app, deploy code, buy tokens or purchase credits.

### The shortest route

1  Secure the accounts. Use separate development credentials and testnet wallets. Keep all secrets out of chat, screenshots and the repository.

2  Prepare the three core integrations. Hedera testnet for x402 payments, Arkiv Rabdi testnet for public application data, and the user-confirmed mainnet 0G inference API for the main AI flow. Their budgets and balances are separate.

3  Prepare the voice and fallback services. Sarvam provides English and Hindi speech. Groq is an explicitly labelled fallback, not evidence of a successful 0G integration.

4  Choose hosting and optional coding aids. Use a free hosting plan that fits the runtime and usage terms. MCP connections and skills help development but are not the deployed application.

5  Record readiness. Save public account identifiers, selected models, successful test timestamps and non-secret proof IDs. Select the new repository you already created when starting Codex; its forgotten name does not block this preparation.

### Required and optional

Required for the planned stack: funded Hedera testnet payer; merchant testnet account; Arkiv wallet with tGLM; 0G inference API key and usable compute credits; Sarvam access for the voice demo.

Recommended: Arkiv access key, separate Groq key, deployment account, password manager, redacted readiness checklist.

Optional: Hedera Docs MCP, Hedera Network MCP, Arkiv tools and skills, 0G coding-tool helpers. Do not wait for optional tools if ordinary official documentation works.

### Before the event

Keep preparation separate from project implementation. Recheck the event rules on when new-build coding may begin, prior-work disclosure and submission requirements. Accounts and successful provider checks do not establish prize eligibility. Use only synthetic demonstration data throughout setup.

### Official resources

[Mumbai rules  https://ethglobal.com/events/mumbai/rules](<https://ethglobal.com/events/mumbai/rules>)

[Mumbai sponsor requirements  https://ethglobal.com/events/mumbai/prizes](<https://ethglobal.com/events/mumbai/prizes>)

## 1 Secure the setup

1  Choose an account owner. Use accounts you control, enable available multi-factor authentication, and save recovery material in a password manager. Do not give team members your account password or wallet recovery phrase.

2  Separate test wallets. Use dedicated development wallets with no valuable assets. Label Hedera payer and merchant accounts separately. Use another development wallet for Arkiv. Do not reuse a mainnet treasury wallet.

3  Generate service keys manually. Create keys in each provider dashboard. Store them in a local secret file excluded from Git or in the hosting provider secret manager. Set conservative usage limits wherever supported. You supply the needed credits. Handle purchases, deposits and subscriptions yourself; these are not automatic setup steps.

4  Keep browser and server roles separate. Speech, inference and fallback service keys belong only on the server. A public frontend calls your backend. Never use NEXT\_PUBLIC\_ or VITE\_ prefixes for private credentials. Browser wallet signing is different from exposing a private key.

5  Prepare a safe handoff. Share only key names, public account IDs, network names, current balance readiness and a pass/fail result. Never paste live keys into a prompt, document, issue, commit, README or video. The implementation agent needs access through the approved secret mechanism, not through prose.

### Suggested configuration names

These are proposed Perenna names, not claims that every vendor requires these exact variable names. Confirm them against the implementation before configuring deployment.

- HEDERA\_ACCOUNT\_ID, HEDERA\_PRIVATE\_KEY and HEDERA\_MERCHANT\_ACCOUNT\_ID

- HEDERA\_NETWORK=hedera:testnet and X402\_FACILITATOR\_URL

- ARKIV\_ACCESS\_KEY and ARKIV\_RPC\_URL; a wallet signing secret only if the final architecture requires a server writer

- ZERO\_G\_API\_KEY, ZERO\_G\_BASE\_URL and ZERO\_G\_MODEL

- SARVAM\_API\_KEY, SARVAM\_STT\_MODEL and SARVAM\_TTS\_MODEL

- GROQ\_API\_KEY and GROQ\_MODEL

### If a secret is exposed

For this testnet MVP, the user explicitly deferred rotation of the previously displayed keys until the working MVP is ready. That rotation is not a current implementation gate. At that checkpoint, revoke or rotate the keys at the provider, replace them in deployment secrets and check usage. Removing it from the latest commit is not enough because repository history and logs may retain it. Remove public exposure and review account access before continuing.

### Official resources

[Sarvam key safety  https://docs.sarvam.ai/api/getting-started/quickstart](<https://docs.sarvam.ai/api/getting-started/quickstart>)

[Hosting secrets  https://developers.cloudflare.com/workers/configuration/secrets/](<https://developers.cloudflare.com/workers/configuration/secrets/>)

## 2 Prepare Hedera testnet and x402

1  Create testnet accounts. Open the Hedera Portal and use its current testnet account flow. Record the payer account ID and a separate merchant account ID. Keep private keys in the secret store. Get free test HBAR through the portal or its linked faucet; do not buy mainnet HBAR for this preparation.

2  Check the payment rail. Use hedera:testnet throughout. Start with native HBAR to avoid adding an HTS token association dependency unless the product specification needs a token. The payment asset and amount must match both client and merchant configuration.

3  Check facilitator capability. Open the official facilitator guide. Its current quickstart base URL is https://x402.org/facilitator. Run the read-only command below and check that the response advertises hedera:testnet and a fee payer. This is discovery, not proof that a payment has settled.

curl https://x402.org/facilitator/supported

4  Use matching current packages. The official Hedera x402 implementation is @x402/hedera. Read the client and merchant guides together. Do not combine a legacy v1 tutorial with a current v2 integration or copy sample token IDs as real assets. Pin the versions that pass the later smoke test.

5  Plan the first implementation smoke test. After coding is allowed, prove one request receives HTTP 402, one correctly authorized testnet payment settles, and the paid response returns. Save the actual transaction ID and resulting receipt. A mocked success badge is not sufficient.

### Payment guardrails to hand to Codex

Use an allowlisted merchant, explicit testnet network, exact asset and integer amount, a per-request cap and a total session cap. Reject changed recipients, unsupported assets, invalid payments and replayed receipts. Track settlement and service fulfillment separately so a network retry cannot silently charge twice. A successful verification alone does not prove successful settlement.

### Ready when

\[  \] Payer and merchant IDs are recorded; payer has test HBAR.

\[  \] Facilitator currently advertises Hedera testnet.

\[  \] Hedera settlement uses testnet HBAR within its own limits. Mainnet 0G API billing has a separate exhausted call authorization.

### Official resources

[Portal  https://portal.hedera.com/](<https://portal.hedera.com/>)

[Client guide  https://docs.hedera.com/solutions/ai/x402/pay-with-x402](<https://docs.hedera.com/solutions/ai/x402/pay-with-x402>)

[Merchant guide  https://docs.hedera.com/solutions/ai/x402/merchant-integration](<https://docs.hedera.com/solutions/ai/x402/merchant-integration>)

[Facilitator guide  https://docs.hedera.com/solutions/ai/x402/facilitators](<https://docs.hedera.com/solutions/ai/x402/facilitators>)

## 3 Prepare Arkiv Rabdi

Arkiv Rabdi is the current public testnet. Its network reference lists chain ID 7794095, native gas token tGLM, and RPC https://rpc.rabdi.db-chain.testnet.arkiv.network. Test tGLM pays for writes; it is not an inference credit.

1  Connect a development wallet. Open Arkiv Hub from the official documentation. Use a wallet dedicated to the demo. Review any network-add request against the Rabdi reference rather than trusting an old saved Tiramisu or Kaolin configuration.

2  Claim test funds. Use the Hub faucet for Rabdi tGLM. Confirm the receiving address matches the development wallet and check the balance. A failed or rate-limited faucet is a setup blocker, not a reason to buy mainnet tokens.

3  Create an access key. Use the Hub access-key page. The public RPC is heavily rate limited, so obtain the free key for reliable development. An RPC access key is not a wallet private key. If the app later uses a browser-visible key, restrict its allowed Origins to the intended sites.

4  Prepare the client settings. Record the RPC, chain ID, wallet address and secret location. Current examples use @arkiv-network/sdk and rabdi from @arkiv-network/sdk/chains. Use the current installation page when coding starts rather than mixing historical SDK examples.

5  Run a synthetic write and query when permitted. Use the official Hub Try It Out flow or the current first-entity tutorial. Store a harmless demo record, choose a finite expiration, then retrieve it. Record the entity key, transaction reference, expiry and query result. Check that the demo can recreate its data if the entity expires.

### Privacy boundary

Treat blockchain data and metadata as public unless the exact architecture proves otherwise. Do not store raw voice, names, phone numbers, addresses, government IDs, real distress messages or private model prompts in Arkiv. Expiration is application lifecycle behavior, not a promise that previously published data disappears from every observer or archive.

### Ready when

\[  \] The wallet is on Rabdi and has tGLM.

\[  \] An access key is available and its intended origins are recorded.

\[  \] Synthetic write and query evidence is available, or clearly marked pending until the build window.

### Official resources

[Rabdi network reference  https://docs.arkiv.network/networks/rabdi/](<https://docs.arkiv.network/networks/rabdi/>)

[Faucet  https://hub.arkiv.network/faucet](<https://hub.arkiv.network/faucet>)

[Access keys  https://docs.arkiv.network/start-here/access-keys/](<https://docs.arkiv.network/start-here/access-keys/>)

[First entity  https://docs.arkiv.network/start-here/installation/](<https://docs.arkiv.network/start-here/installation/>)

## 4 Prepare 0G Private Computer

1  Open the official console. Start at pc.0g.ai and use its supported sign-in or wallet flow. Use the exact account that will hold the team compute credits. Do not confuse the private-compute account with an unrelated testnet wallet.

2  Confirm the credits you provide. Confirm usable inference credit in the dashboard. If event credits are expected, ask the 0G team for the current redemption process and verify they have actually landed. No credit amount or entitlement is guaranteed here. Stop if the next step asks for a purchase, token deposit or paid subscription.

3  Create an inference key. In Dashboard \> API Keys, create a development inference key and store it securely. Use an inference API key, not a management credential. The Router quickstart uses the OpenAI-compatible base URL https://router-api.0g.ai/v1.

4  Choose a live model and trust mode. Use the current catalog to select a model that supports the main flow. Record its exact model ID, supported features and price. Standard, Verified and Private modes are different: do not claim private enclave inference merely because the request used the product called Private Computer.

5  Make one minimal request. Use the current official quickstart or Playground with synthetic text, within the user-provided credit balance. Save the returned request identifier if exposed, selected model, timestamp, response outcome and usage evidence. Confirm where the request is visible in the console before designing the evidence screen.

### The distinction that matters

0G testnet gas pays for testnet chain transactions. The configured inference API uses mainnet-backed credits/tokens, as confirmed by the user. Its exact consumption and balance remain unverified. The separate 10 testnet 0G tokens neither fund nor authorize another inference call. Perenna does not need a new 0G chain deployment merely to call Private Computer through the Router.

### Main flow and fallback

Keep 0G central in the primary AI path. On a provider error, present a clear failure or explicitly labelled fallback. A Groq response must never be reported as a 0G request or given a fabricated 0G request ID. Use synthetic data for tests and avoid sending sensitive information through a weaker privacy mode.

### Ready when

\[  \] User-provided credits are confirmed in the correct account.

\[  \] A real response and usable request evidence have been captured.

\[  \] The selected model, mode and server-side key location are recorded.

### Official resources

[Private Computer  https://pc.0g.ai/](<https://pc.0g.ai/>)

[Router quickstart  https://docs.0g.ai/developer-hub/building-on-0g/compute-network/router/quickstart](<https://docs.0g.ai/developer-hub/building-on-0g/compute-network/router/quickstart>)

[Funding distinctions  https://build.0g.ai/funding](<https://build.0g.ai/funding>)

[Live model catalog  https://pc.0g.ai/models](<https://pc.0g.ai/models>)

## 5 Prepare voice and fallback

### Sarvam English and Hindi

1  Create account access. Use the dashboard linked by the official Sarvam quickstart. Create a dedicated API key and check the available balance and rate limits. Use credits already supplied or granted to the account; do not assume a promotion will be available.

2  Test speech recognition. Use a short synthetic English recording and a short Hindi recording. Follow the current speech-to-text example with transcribe mode so Hindi is not inadvertently converted to English. Test mixed Hindi-English speech separately.

3  Test speech output. Use the current text-to-speech reference to choose a supported voice, model and output format. Generate one short English reply and one Hindi reply, play both and check pronunciation, intelligibility and completion. Keep the selected voice and model IDs in the readiness record.

4  Keep the web experience usable. Plan a visible language selector, microphone consent, recording indicator, stop button and text alternative. A browser may require HTTPS and a user gesture for recording or playback. Never treat a microphone denial as a fatal application error.

Model checkpoint: current examples reference saaras:v4, and current model listings include bulbul:v4-flash. Some prose still names older releases. Confirm the exact accepted model IDs in the live account and record the successful combination; do not blindly copy a stale model name.

### Groq as an optional fallback

1  Create a separate key. Open the Groq API Keys page and create a development key. Store it as a server secret. Check the model catalog and account rate limits rather than assuming unlimited free usage.

2  Test one text request. Use the official quickstart with a currently available model and synthetic prompt. Record success, latency and selected model. This test does not require replacing Sarvam speech or making Groq the primary AI provider.

3  Define fallback behavior. The later app should label the provider and reason for fallback, use bounded retries and preserve the user language. It should never silently send sensitive data to another provider or report fallback output as original-provider evidence.

### Ready when

\[  \] English and Hindi transcription and playback pass.

\[  \] Text-only use remains possible.

\[  \] Groq is tested or explicitly disabled, not an invisible dependency.

### Official resources

[Sarvam quickstart  https://docs.sarvam.ai/api/getting-started/quickstart](<https://docs.sarvam.ai/api/getting-started/quickstart>)

[Sarvam models  https://docs.sarvam.ai/api/getting-started/models](<https://docs.sarvam.ai/api/getting-started/models>)

[Sarvam speech output  https://docs.sarvam.ai/api-reference/text-to-speech/convert](<https://docs.sarvam.ai/api-reference/text-to-speech/convert>)

[Groq keys  https://console.groq.com/keys](<https://console.groq.com/keys>)

[Groq quickstart  https://console.groq.com/docs/quickstart](<https://console.groq.com/docs/quickstart>)

## 6 Add optional MCP and skills

MCP connects a coding assistant to tools or documentation. Skills supply instructions and recipes. Neither replaces provider accounts, app code, runtime SDKs or working credentials. Install only the official integration you need, review its permissions, and verify it before relying on it.

### Hedera Docs MCP recommended

This read-only connection needs no wallet or key. For a locally installed Codex CLI, Hedera publishes these commands. They configure that CLI; they do not prove that a separate hosted Codex environment has the same connection.

codex mcp add hedera-docs --url https://docs.hedera.com/mcp

codex mcp list

In a new session, ask the assistant to query the connected documentation for the Hedera x402 client setup and return its source. Mark it connected only after a real tool call succeeds.

Optional Hedera skills: use the official hedera-dev/hedera-skills repository for coding guidance. Review the chosen skill and install only in the coding environment you will use.

### Hedera Network MCP optional

Use only if you want development-time network queries or wallet-signed testnet actions. The official endpoint is https://agentic-testnet-mcp.hedera.com/mcp. Start with a read-only balance query. Transactions require your wallet signature. This is not the autonomous payment engine for Perenna; the official Payments MCP is separately labelled coming soon.

### Arkiv plugin and skills optional

Open Arkiv Hub AI Tools, select the instructions for your actual coding client and follow its current official guide. The bundled MCP profile may be Devfolio Global Tour rather than ETHGlobal Mumbai: do not treat its event rules as Mumbai rules. Verify with a read-only status query. The plugin does not install the application SDK or sign wallet transactions.

### 0G helpers optional

The official 0gpc CLI connects supported coding tools to 0G models. It is unnecessary for a Perenna server calling the Router API. Current documented tool support does not list Codex, so do not install it expecting to reconfigure Codex. 0G builder skills are also optional guidance; review any installer before running it.

### Avoid unnecessary setup

No Sarvam or Groq MCP is required for their REST APIs. Skip undocumented third-party connectors that ask for wallet seeds or broad credentials. If an MCP fails, use the linked official documentation and continue with runtime integration.

### Official resources

[Hedera MCP options and commands  https://hedera.com/mcp-servers/](<https://hedera.com/mcp-servers/>)

[Hedera skills  https://github.com/hedera-dev/hedera-skills](<https://github.com/hedera-dev/hedera-skills>)

[Arkiv tools  https://hub.arkiv.network/tools](<https://hub.arkiv.network/tools>)

[Arkiv agent skills  https://docs.arkiv.network/start-here/agent-skill/](<https://docs.arkiv.network/start-here/agent-skill/>)

[0G CLI support  https://docs.0g.ai/developer-hub/building-on-0g/compute-network/router/clients/0gpc-cli](<https://docs.0g.ai/developer-hub/building-on-0g/compute-network/router/clients/0gpc-cli>)

## 7 Prepare hosting and hand off

### Recommended hosting choice

For a personal, noncommercial Next.js demonstration, Vercel Hobby is the simplest starting point. Check its current fair-use and collaboration rules first; Hobby is not a general free commercial or team hosting plan. Avoid a paid trial and retain the free provider subdomain. An account is enough during preparation; deploy after the app exists.

Cloudflare Workers Free is an alternative for a compatible lightweight backend and frontend. Its limits include a daily request cap and runtime constraints. Confirm the Hedera libraries and any Node dependencies run successfully there before choosing it; do not assume Workers is a drop-in replacement for a Node server.

1  Choose the correct repository later. When you open Codex, select the new repository already created. Confirm its owner, branch and empty/new-build state. Do not create another repository just because the name was forgotten.

2  Configure deployment secrets after scaffolding. Enter server keys through the hosting dashboard. Keep development, preview and production scopes separate. Do not expose real secrets to public fork previews. Rebuild or redeploy when required for changed configuration.

3  Verify the deployed behavior. After implementation, test HTTPS voice permissions, server-side API calls, wallet network, error handling and a complete testnet payment. Check both an ordinary browser and the planned demo device. Never depend on a local-only service for a public demo link.

### Readiness handoff checklist

\[  \] Repository selected in Codex when build work begins; event new-build rules checked.

\[  \] Hedera payer and merchant account IDs recorded; test funds available; facilitator support checked.

\[  \] Arkiv Rabdi wallet and tGLM ready; access-key location recorded; synthetic write/query test planned or passed.

\[  \] 0G credit balance, model, mode and real request evidence available.

\[  \] Sarvam English and Hindi recognition and speech playback verified; Groq fallback state explicit.

\[  \] Hosting plan and runtime chosen; all private credentials remain server-only.

\[  \] Each incomplete item has an owner and exact blocker. No fabricated success, mock receipt or assumed sponsor credit.

### What to give Codex

Give the implementation specification, the setup status and public configuration values. State which tests are pending and which services are deliberately disabled. Provide secrets only through the approved environment mechanism. Ask Codex to implement a minimal vertical slice first, then verify each real integration before adding presentation polish.

### Official resources

[Vercel Hobby limits and terms  https://vercel.com/docs/plans/hobby](<https://vercel.com/docs/plans/hobby>)

[Cloudflare Free pricing  https://developers.cloudflare.com/workers/platform/pricing/](<https://developers.cloudflare.com/workers/platform/pricing/>)

[Cloudflare runtime limits  https://developers.cloudflare.com/workers/platform/limits/](<https://developers.cloudflare.com/workers/platform/limits/>)

## Brand and partner requirements

Product name: Perenna. Product subtitle: Business moves smarter. Use this exact name and subtitle consistently in all product materials and interfaces.

The selected partners remain Arkiv, 0G and Hedera. Whitechain is under consideration only and is not selected. Arkiv sponsor tracks count toward the event’s three partner picks; verify the current requirements at https://ethglobal.com/events/mumbai/prizes/arkiv. The primary 0G target remains the Private Computer track. The separate Agents That Pay for Themselves prize requires actual revenue to fund the agent’s 0G compute credit and subsequent paid inference without manual top-ups, with evidence: https://ethglobal.com/events/mumbai/prizes/0g. Approved fallback top-ups and an unverified revenue-to-compute bridge leave eligibility for that separate prize unresolved. A user-approved, guardrailed Hedera x402 service payment is separate from human approval of an exact goods order.

## Revision: Standing agreements and selected sponsor tracks

### Setup update — 6 November 2026

Selected partners remain Arkiv, Hedera and 0G. Prepare additional testnet-only infrastructure for a Standing Procurement Agreement and autonomous service payments; do not purchase mainnet tokens or paid subscriptions.

### Additional Hedera accounts and signatures

Prepare distinct testnet identities for buyer, supplier/merchant and agent operating payer, plus separate owner-authorized signing identities where feasible. Verify current Hedera smart-contract deployment/verification and token payment support before choosing Solidity or HTS-based design. Store signing keys securely; never share seed phrases. Test bilateral SPA signing, pause/revoke authority, and a separate x402 protected service endpoint. Confirm the actual facilitator and test asset before payment.

### Standing agreement configuration checklist

Choose synthetic supplier, item, quantity bounds, unit price/tolerance, contract duration, order cadence, per-order cap, aggregate cap, accepted network/asset/payee, dispute pause authority, cancellation policy and agreement version. Both parties explicitly authorize activation. Maintain private agreement data offchain and only minimal commitments/events onchain. Test an allowed repeat order and a blocked changed-price/disputed order.

### 0G self-funding feasibility checkpoint

In addition to Private Computer credits and inference request IDs, verify whether a separate 0G Compute account or funding interface is required. Identify the actual supported path for agent-earned service fees to fund spendable 0G Compute credit, including networks, tokens, conversion, fees and account ownership. Do not treat testnet tokens, sponsor credits or internal bookkeeping as earned spendable compute. If no permitted free/test route exists, mark this secondary prize track blocked and do not spend real money.

### Manual readiness checklist additions

\[ \] Buyer and supplier testnet identities and agreement-signing path prepared. \[ \] SPA contract deploy/verify compatibility checked. \[ \] Agent operating wallet and Hedera x402 service endpoint verified. \[ \] 0G Private Computer request ID captured. \[ \] 0G Compute funding compatibility independently verified or explicitly blocked. \[ \] Arkiv real write/query evidence planned. \[ \] Hedera and Arkiv blockchain transactions remain within their authorized testnet limits. Mainnet 0G API usage requires its independent call and credit authority.

<!-- Source footer text: Perenna setup guide  |   (Word page field omitted in Markdown.) -->
