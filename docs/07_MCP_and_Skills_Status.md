# Perenna MCP and skill setup status

Checked on 6 November 2026. Development aids below are installed or configured, and application implementation is underway. Seven live 0G negotiation calls succeeded after three failed parse attempts; four live Sarvam calls passed English/Hindi round trips. No blockchain transaction has been signed or submitted. Current integration evidence is tracked in [prize-evidence.md](prize-evidence.md).

Desktop Commander remote was repaired using a fresh isolated npm cache. Its device came online and the local stdio handshake exposed 25 tools. The Codex remote connector still had a routing error. BrowserAct direct Chrome access verified the existing signed-in Hedera portal without a guest profile. The native computer-use/browser bridge remained unavailable. These observations establish access at that checkpoint, not permanent connectivity.

## MCP connections

| Connection | Installed scope | Verification | Practical limit |
| --- | --- | --- | --- |
| `hedera-docs` at `https://docs.hedera.com/mcp` | User-level Codex MCP configuration | Registration read back; direct initialize, tools/list and `search_hedera` succeeded | Documentation access only; no payment or contract proof |
| `arkiv-general` at `https://mcp.arkiv.network/` | User-level Codex MCP configuration | Direct initialize, complete tools/list, `server_status` and `network_status` succeeded | General profile, no event rules; reported live probe covers chain ID only |
| `arkiv-mumbai` at `https://mcp.arkiv.network/mumbai` | User-level Codex MCP configuration, added during the follow-up review | Direct initialize, tools/list and `server_status` succeeded; saved entry read back | Mumbai profile and dated organizer snapshots; no project validation or submission |

The Codex CLI was found outside PATH at `C:\Users\darsh\AppData\Local\OpenAI\Codex\bin\a159911ff70742e9\codex.exe`, version `0.166.0-alpha.6`. Its native `mcp add` command registered the two entries while preserving the rest of the configuration. This executable location is observed local state, not a portable setup requirement.

Follow-up verification: native Hedera Docs and Arkiv General tool handles are now exposed in this conversation. `search_hedera`, `server_status`, `network_status`, `list_skills`, and the General `start` workflow returned actual results. General reported a fresh chain-ID-only probe for Rabdi 7794095. The seven project skills are also present in the current skill catalog. The newly added Mumbai connection was checked directly through MCP protocol; native exposure of that new entry awaits refresh. Local CLI configuration does not configure a separate hosted client or Cursor automatically.

The Hedera server advertises a documentation feedback tool in addition to read tools. The Arkiv server similarly exposes feedback/reporting operations. No feedback or external reporting was invoked. Adding a connection grants no permission to send project contents, secrets, or optional feedback.

Evidence: [Hedera query check](tooling/hedera-docs-mcp-check.json), [Arkiv status check](tooling/arkiv-mcp-check.json), and [x402 capability response](tooling/x402-supported.json). The first Hedera query encountered a Windows console Unicode encoding error while printing the response. A repeat with safe encoding succeeded and produced the retained record. Neither attempt signed or settled anything.

## Installed project skills

Installed with the Codex skill-installer helper into `D:\Perenna\.agents\skills`. Source instructions and references were retained as third-party material, including original punctuation and identifiers. Example files are guidance, not Perenna implementation. No example or skill hook was executed.

| Skill | Purpose |
| --- | --- |
| [hackathon-prd](../.agents/skills/hackathon-prd/SKILL.md) | Product, problem, blockchain necessity, track alignment and validation checklist |
| [validate-submission](../.agents/skills/validate-submission/SKILL.md) | Evidence-based readiness review; actual Mumbai rules override its generic rubric |
| [x402-payments](../.agents/skills/x402-payments/SKILL.md) | Request/challenge/signature/verification/settlement constraints |
| [agent-kit-policy](../.agents/skills/agent-kit-policy/SKILL.md) | Agent tool blocking rules and their bypass boundaries |
| [hts-system-contract](../.agents/skills/hts-system-contract/SKILL.md) | Conditional HTS contract/asset compatibility guidance for SPA design |
| [arkiv](../.agents/skills/arkiv/SKILL.md) | Current SDK/Rabdi routing, capability limits and focused recipe selection |
| [arkiv-mcp](../.agents/skills/arkiv-mcp/SKILL.md) | General/event profile separation, MCP protocol checks and evidence limits |

Hedera source: [hedera-dev/hedera-skills](https://github.com/hedera-dev/hedera-skills/tree/8b1fccd8ccbbe73e928037b76028caf79900b12e), commit `8b1fccd8ccbbe73e928037b76028caf79900b12e`. Its [Apache license](tooling/hedera-skills-LICENSE.txt) is retained.

Arkiv source: [Arkiv-Network/skills](https://github.com/Arkiv-Network/skills/tree/51d22fd0485130d701f2340fe003d71101ad571d), commit `51d22fd0485130d701f2340fe003d71101ad571d`. The installed entries declare MIT licensing. The repository tree returned no standalone license file. Preserve source attribution and verify licensing before redistribution beyond the project.

Arkiv's previously advertised `arkiv-best-practices` entry is a deprecated redirect. The current router and MCP skill were installed instead. Focused implementation recipes such as `arkiv-first-write`, `arkiv-query`, and `arkiv-write-safety` are separate resources; the router alone is not their content. The Arkiv runtime SDK is installed and used by the publication and discovery adapters.

The installed skills are now available for discovery. The relevant Hedera instructions were explicitly read and applied, including the [numeric scorecard](06_Hedera_Feasibility_Review.md). The [file manifest](tooling/installed-skills.json) records source pins and file hashes.

## Additional official guidance checked

The [0G Builder Hub tools](https://build.0g.ai/tools) links the public [0G agent skills](https://github.com/0gfoundation/0g-agent-skills). Source retrieval succeeded at commit `04b5a4208577df888e5fc5fa489a488c5eec54be`. Its compute streaming, provider-discovery and account-management recipes address the separate Compute Network and funded provider accounts. They must not replace the primary Private Computer Router API with an unapproved funded/mainnet path. The [Router quickstart](https://docs.0g.ai/developer-hub/building-on-0g/compute-network/router/quickstart) remains the primary app integration reference. No 0G CLI or compute SDK was installed or run.

The official [Sarvam skill page](https://docs.sarvam.ai/api/developer-tools/agent-skills) and [speech skill source](https://github.com/sarvamai/skills) are accessible. Current source covers speech-to-text and text-to-speech and contains more recent model guidance than some catalog descriptions. It was inspected, not installed into this project. Verify selected model, voice and installed SDK declarations at implementation time. The optional [Sarvam MCP](https://docs.sarvam.ai/api/developer-tools/mcp) has builder and runtime tool namespaces; it is not required for server-side REST integration and was not installed. Runtime calls can spend credits.

The REA skill is accessible. Its instructions recommend ordinary source inspection for complete source projects, so no binary analysis, REA runtime, or extra engine setup was needed for this review.

## Current browser and credential checks

Browser control was attempted and rechecked after the user requested another check. Computer Use reported unavailable native/browser hosts. The Playwright tab inventory connected to the configured browser socket but timed out during initialization. Desktop Commander repeatedly reported its single registered device offline. These are current connection failures, not a claim that Chrome, MetaMask, or the desktop application is absent. No browser dashboard or wallet was inspected.

Only configuration names and presence were checked in `.env.local`; values were not printed or copied. Groq and Sarvam keys were present. A documented read-only model-list request returned HTTP 200 and 11 catalog entries for each provider. Groq initially returned HTTP 403; the same catalog request with a normal User-Agent succeeded. There is no evidence from that initial 403 that the key needs replacement. These checks establish catalog access only, not balances, free-tier availability, speech quality, inference or quota. No inference request was made.

Sources: [Groq models API](https://console.groq.com/docs/api-reference), [Sarvam models API](https://docs.sarvam.ai/api-reference/chat/models-v2), [Sarvam authentication](https://docs.sarvam.ai/api-reference/authentication). Keep both existing keys local. No 0G key, Arkiv access key, or Hedera runtime identity was found among the configured entries inspected.

## Tools intentionally left out

The official [Hedera MCP page](https://hedera.com/mcp-servers/) distinguishes Docs, Network, and Payments MCPs. Network MCP adds wallet-signed testnet operations and is optional for development. It is not needed for this review, so it was not enabled. Payments MCP is listed as coming soon and cannot be the planned autonomous payment engine.

0G Private Computer, Sarvam, and Groq can be integrated by their runtime APIs. An additional MCP is not a prerequisite. Shell, research and GitHub capabilities are available. Browser connectors are configured but currently fail as described above; they do not establish access to Chrome or MetaMask. No duplicate services or unrelated skills were installed. No 0G CLI was used to reconfigure the coding assistant.

The General `start` workflow now identifies the active Mumbai event URL. That separately scoped official connection was verified and added for the requested event review. Its `server_status` identifies `mumbai`, campaign `mumbai-2026`, and organizer snapshots checked on 3 November 2026. Reopen current official prize pages before relying on that snapshot. Its availability through 10 November is the MCP operator schedule, not the submission deadline. The ended Devfolio profile remains unused.

## Runtime readiness remains unverified

| Boundary | Required evidence when building | Current status |
| --- | --- | --- |
| Hedera one-off/SPA/service payments | User-controlled buyer, merchant and operating identities; approved testnet asset/payees/caps; confirmed receipts | Public facilitator support discovered; wallets, funds, signing and settlement untested |
| SPA registry and authority | Supported contract/asset path, bilateral signing, deployment, bypass and concurrency tests | Design only |
| Arkiv runtime | User-obtained RPC access key, authorized funded writer, safe projection, real write and query | General MCP and chain-ID probe only; app write/query untested |
| 0G | Server key, usable supplied/free credits, model/mode, meaningful returned request IDs | No account access or inference tested |
| Sarvam | Allowed credits; successful English/Hindi transcription and playback | Existing key passed read-only model-list authentication; speech and balance untested |
| Groq | Optional model/budget and fallback permission | Existing key passed read-only model-list authentication; inference and budget untested, keep fallback disabled until approved |
| Revenue to compute | Actual provider-supported conversion/funding route and subsequent paid inference | Unresolved; no bridge, swap, top-up or purchase attempted |

The user's request authorizes the preparation done here. Later live signing and spending need the wallet, network, purpose and limits specified in the master prompt. That boundary comes from the supplied product brief; MCP or skill installation cannot supply the missing authority. Secrets belong in the approved local configuration mechanism, never in these documents or chat.
