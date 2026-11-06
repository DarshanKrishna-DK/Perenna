# Perenna source register

Access date: 6 November 2026, Asia/Kolkata. These are observations for planning and tooling preparation. They are not runtime integration evidence. Supplied documents retain their original historical claims unchanged; current findings are recorded here and in the feasibility review.

| Source and title | Claim supported in this review | Access and uncertainty |
| --- | --- | --- |
| [Hedera Skills repository](https://github.com/hedera-dev/hedera-skills) | Official skill catalog and source instructions | Reviewed and installed at commit `8b1fccd8ccbbe73e928037b76028caf79900b12e`; generic hackathon rubric is not Mumbai's rules |
| [Hedera MCP Servers](https://hedera.com/mcp-servers/) | Keyless Docs endpoint, optional wallet-based Network MCP, Payments MCP listed as coming soon | Retrieved official page; Docs protocol call also succeeded |
| [About x402 on Hedera](https://docs.hedera.com/solutions/ai/x402) | HTTP payment mechanism and supported Hedera asset classes | Documentation, not a payment test |
| [Pay with x402 on Hedera](https://docs.hedera.com/solutions/ai/x402/pay-with-x402) | Client signing and request/retry flow | Current package declarations not installed or checked locally |
| [Hedera exact scheme](https://docs.hedera.com/solutions/ai/x402/exact-scheme) | v2, direct TransferTransaction, integer amounts, fee payer and validation constraints | Read official page and matching Docs MCP search results; no SPA enforcement proof |
| [x402 Facilitators](https://docs.hedera.com/solutions/ai/x402/facilitators) | Hosted official facilitator and discovery endpoint | Documentation retrieved; capability endpoint checked separately |
| [Official facilitator supported schemes](https://x402.org/facilitator/supported) | Advertised `hedera:testnet` exact v2 support and fee payer | Direct GET saved in tooling/x402-supported.json; no payment attempted |
| [ETHGlobal Mumbai details](https://ethglobal.com/events/mumbai/info/details) | 7 November 2026 09:00 IST deadline, three-partner cap, AI/prior-work rules, judging categories and video range | Public page retrieved; participant dashboard and opening time unverified |
| [ETHGlobal Mumbai getting started](https://ethglobal.com/events/mumbai/info/start) | Public participant preparation context | Does not establish the user's registration or project eligibility |
| [ETHGlobal Rules and Code of Conduct](https://ethglobal.com/rules) | General conduct page | Not a complete project eligibility policy |
| [Mumbai event rules URL](https://ethglobal.com/events/mumbai/rules) | No claim established | Retrieval failed; use retrieved event details and later dashboard verification |
| [Hedera Mumbai prizes](https://ethglobal.com/events/mumbai/prizes/hedera) | Autonomous x402 endpoint/payment and evidence requirements | Retrieved official sponsor page; no eligibility or completion claim |
| [Arkiv Mumbai prizes](https://ethglobal.com/events/mumbai/prizes/arkiv) | Build-from-scratch write/read and repository evidence requirements | Retrieved official sponsor page; app behavior untested |
| [0G Mumbai prizes](https://ethglobal.com/events/mumbai/prizes/0g) | Main-flow Private Computer request IDs, consumer emphasis, separate earned-credit loop | Retrieved official sponsor page; credits and funding compatibility unverified |
| [Arkiv Agent Skills](https://docs.arkiv.network/start-here/agent-skill/) | Official skill repository link | Page still advertises an older entrypoint; repository says it is deprecated |
| [Arkiv current skills](https://github.com/Arkiv-Network/skills/tree/51d22fd0485130d701f2340fe003d71101ad571d) | Current router and General MCP setup/evidence boundaries | Two skills reviewed and installed at this pin; focused runtime recipes still needed |
| [Arkiv Rabdi reference](https://docs.arkiv.network/networks/rabdi/) | Current public network reference | Retrieved official page; General MCP network_status independently reported a live chain-ID probe for 7794095 |
| [Arkiv General MCP](https://mcp.arkiv.network/) | Actual General profile, tool catalog and bounded network status | Direct protocol check saved in tooling/arkiv-mcp-check.json; no event-profile or entity operation |

Read-only MCP requests were made using minimal public documentation queries or empty status arguments. No project documents, private schemas, secrets, or wallet material were uploaded. No optional provider feedback was submitted.

Before implementation, separately verify 0G Router model/mode/billing, Sarvam models and language behavior, Groq fallback availability, installed SDK declarations, faucet/access-key readiness, and precise signing/contract compatibility. Links in the converted manual guide are starting points, not live proof for those remaining items.

## Follow-up partner resource and access checks

Checked on 6 November 2026. No additional report files were created. Current readiness details are in the existing manual guide and MCP status document.

| Source | Finding and evidence boundary |
| --- | --- |
| [Mumbai prize root](https://ethglobal.com/events/mumbai/prizes) | Reopened and followed the selected Hedera, Arkiv and 0G sections and their official resources; no additional partner selected |
| [Mumbai event details](https://ethglobal.com/events/mumbai/info/details/) | Trailing-slash URL loaded; current deadline, disclosure and start-fresh boundaries remain relevant to build approval |
| [Arkiv Hub AI tools](https://hub.arkiv.network/ai-tools) | Advertises Mumbai event guidance; General start workflow supplied the exact event MCP URL |
| [Arkiv Mumbai MCP](https://mcp.arkiv.network/mumbai) | Direct initialize, tool discovery and server_status succeeded; profile identifies Mumbai and dated organizer snapshots; entry registered in Codex |
| [0G Builder Hub tools](https://build.0g.ai/tools) | Links official development guidance, including agent skills |
| [0G agent skills](https://github.com/0gfoundation/0g-agent-skills) | Source accessible at commit 04b5a4208577df888e5fc5fa489a488c5eec54be; separate funded Compute guidance is not primary Router integration evidence |
| [0G Router quickstart](https://docs.0g.ai/developer-hub/building-on-0g/compute-network/router/quickstart) | MetaMask login supported; user credits, inference key and successful requests remain separate requirements |
| [Sarvam agent skills](https://docs.sarvam.ai/api/developer-tools/agent-skills) | Official speech guidance source accessible; current source and SDK declarations take priority over older catalog prose |
| [Sarvam MCP](https://docs.sarvam.ai/api/developer-tools/mcp) | Optional builder and runtime tools; runtime API calls can spend credits and were not invoked |
| [Sarvam models API](https://docs.sarvam.ai/api-reference/chat/models-v2) | Existing local key accepted for a read-only catalog request; no speech or account-balance proof |
| [Groq API reference](https://console.groq.com/docs/api-reference) | Existing local key accepted for a read-only catalog request; no inference or quota proof |

Native Hedera Docs and Arkiv General tools now work in this conversation. Computer Use and Playwright browser connection attempts failed, and Desktop Commander device discovery reported offline on both checks. These connection observations do not imply the user's local browser or wallet is absent.
