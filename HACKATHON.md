# HACKATHON.md: BOTChain Build Week Hackathon

<!-- Filled in by /hackathon-kickoff. Every downstream phase (hackathon-spec,
     hackathon-build, hackathon-ui, hackathon-qa, hackathon-deck,
     /pitch-timebox) reads this file; keep it current when the team pivots
     or cuts scope. -->

## The one-liner

Agent Escrow: post a BOT-token bounty for a task, an agent wallet claims it and delivers, you release payment on-chain — no middleman, no "trust me" IOU.

## Urgency hook

Right now an AI agent (or the human running it) doing paid work for a stranger on BOT Chain has zero recourse if the requester ghosts after delivery — every agent-to-agent gig today runs on a Discord DM and a hope, and that's the one missing primitive stopping BOT Chain's agent economy from ever closing its first real transaction.

## Business angle

- **Target customer/buyer:** teams building AI-agent marketplaces or bounty boards on BOT Chain — anyone who needs trust-minimized payment-on-completion between two wallets that don't know each other.
- **How this makes money:** a small protocol fee (1-2%) skimmed off each released escrow — the standard marketplace-escrow cut (Upwork's model, on-chain, no platform to trust).
- **Why now:** BOT Chain wants live dApps at launch; escrow is the payment primitive underneath every other bot-economy idea (task boards, data buys, agent marketplaces) — whoever ships it first becomes the default everyone else builds on.

## Judging rubric

| Criterion | Weight | Our proof point (what a judge can see working in 30 seconds) |
|---|---|---|
| Contract deployed and working on BOT Chain | 35% | Escrow contract verified on the BOT Chain block explorer; tx history shows a real create → claim → release cycle moving BOT between two addresses |
| Anyone can connect wallet and the main action works | 30% | Fresh MetaMask + one-click "Add BOT Chain" if missing → create a bounty → claim from a 2nd address → release → balances update on screen in seconds, no reload |
| Use case clarity and originality | 20% | One-sentence pitch on the landing page + a live 3-step "Created → Claimed → Released" tracker; not a token/NFT-mint clone |
| X post — project shared with @BOTChain_ai tagged | 15% | Posted, tags @BOTChain_ai, includes a screen-recording GIF of the create → claim → release flow |

## Angle decision

| Angle | Contract (35%) | Wallet+action (30%) | Originality (20%) | X post (15%) | Weighted |
|---|---|---|---|---|---|
| **A (chosen): Agent Escrow** | 5 | 4 | 5 | 5 | **4.70** |
| B: Bot Vault (pay-to-unlock AI feature, on-chain expiry) | 4 | 5 | 4 | 5 | 4.45 |
| C: Proof-of-Prompt tipping leaderboard | 3 | 4 | 3 | 5 | 3.60 |

**Why A:** Highest score on the two heaviest criteria (contract-working, originality) and the only angle where the demo is real value moving between two independent wallets, not a single self-directed click — that's what makes "anyone can connect and it works" land as a wow moment instead of a checkbox. X post is a fixed 15 free points on any angle, so it doesn't differentiate.

## Wow features (impress-the-judge layer, not scope creep — each maps to a scored line above)

1. **On-chain reputation stamp after release** (new, research-backed) — when the requester releases payment, they log a 1-5 rating for the agent's wallet address in the same contract (`mapping(address => Rating[])`, `event AgentRated`). This is a minimal, self-contained riff on [ERC-8004](https://www.allium.so/blog/onchain-ai-identity-what-erc-8004-unlocks-for-agent-infrastructure/) — the Identity/Reputation registry standard for AI agents that went live on Ethereum mainnet in Jan 2026, built by MetaMask/Ethereum Foundation/Google/Coinbase — and directly extends [x402](https://www.rzlt.io/blog/agentic-payments-2026-x402-explainer)-style agent-payment thinking (165M+ transactions, backed by Coinbase/Google/Visa/AWS/Anthropic in 2026). None of the guidebook's 6 example ideas touch agent trust/reputation at all — this is the single highest-leverage originality move available, and it's ~20 lines of Solidity, not a protocol integration.
2. **One-click "Add BOT Chain to MetaMask"** (`wallet_addEthereumChain`) — kills the #1 disqualifier risk ("frontend does not connect") before a judge ever hits it.
3. **Live on-chain event feed** on the page (ethers.js contract event listener) — judges watch their own transaction land in real time instead of trusting a refresh. External hackathon-escrow research confirms this specific pattern: "a viewer tool is especially powerful because you can show that the escrow exists and the state is visible."
4. **Auto-generated block-explorer deep link** per bounty ("view this tx" / "view this contract") right in the UI — makes the 35-pt contract criterion self-verifying in one click, no judge has to go hunting.
5. **3-step progress tracker** (Created → Claimed → Released) instead of raw contract state text — lands originality/clarity in a 5-second skim.
6. **Demo GIF** embedded at the top of the README, reused as the X post asset — insurance if the live link hiccups mid-judging, and covers two submission requirements with one recording.

**Originality bet, said out loud:** the guidebook's 6 suggested examples (token presale, certificate issuer, tip board, petition, wish board, poll) are all single-wallet, single-action patterns. Agent Escrow is not on that list — it's a real two-wallet state machine, which is more original (originality is 20% of the score) but also more surface area to get wrong with no organizer-blessed reference to fall back on. The scope-cut list below and the Feature-Zero-first plan exist specifically to de-risk that bet.

## Build risk notes & resources (from guidebook re-check + trend research)

- **Contracts are immutable — the guidebook says it plainly: "bugs on mainnet cost real BOT and cannot be undone."** Escrow contracts that move funds are the classic reentrancy target (`release`/`refund` sending value out). Use checks-effects-interactions ordering and OpenZeppelin's `ReentrancyGuard` on any function that transfers BOT — this is not gold-plating, it's the one bug class that would zero out the 35-pt contract score on a fund-moving contract.
- **Use the BOT Chain testnet faucet for all development; only deploy to mainnet once the full create → claim → release → refund path is tested end to end.** Given the immutability warning, a rushed mainnet deploy is the single biggest risk to the 35-pt criterion.
- **Support channel:** [Telegram group](https://t.me/+2_i19WJCemU1OGY1) — organizers are on standby for technical assistance; use it instead of burning hours stuck on a deploy/RPC issue.
- **Domain cost ($1-1.50) is reimbursed by organizers after submission** — keep the registration receipt.

## Phase plan (back-solved from Tue Aug 4, 11:59 PM submission deadline; no live pitch — judges self-serve the live link)

| Checkpoint | Time | Deliverable | Skill / command | Owner |
|---|---|---|---|---|
| Kickoff | Thu Jul 30 (T+0) | This file | `/hackathon-kickoff` | you |
| Spec | Thu Jul 30, tonight | Contract function list (`createBounty`, `claim`, `release`, `refund`) + minimal frontend flow | `hackathon-spec` | you |
| **Feature Zero** | Fri Jul 31, EOD | Escrow contract deployed + verified on BOT Chain testnet; bare frontend connects wallet, creates a bounty, claims it, releases funds — live on a real domain | `hackathon-build` | you |
| Design pass | Sat Aug 1, AM | Design system applied to Feature Zero's UI so it isn't unstyled HTML | `hackathon-ui` | you |
| Core build | Sat Aug 1 – Sun Aug 2 (Building Ends) | Reputation stamp, live event feed, bounty list, progress tracker + explorer links, refund UI, demo GIF | `hackathon-build` | you |
| QA pass | Sun Aug 2, evening | Cold test: fresh MetaMask, BOT Chain not yet added, full create→claim→release run; check every item on the disqualifier list below | `hackathon-qa` | you |
| Submission packaging | Mon Aug 3 | Contract verified on explorer, README finished ("what it does" + "how to use it"), backup demo video recorded | you |
| **Submission** | Tue Aug 4, 11:59 PM (hard deadline) | All 4 required: contract address, live link, GitHub repo (`.sol` + README), X post tagging @BOTChain_ai | you |

## Team

| Name | Strengths | Owns (build) | Pitch section |
|---|---|---|---|
| You | Comfortable with Solidity/EVM | Contract + frontend + submission (solo) | N/A — no live pitch, judges test the live link directly |

## Scope cuts (running log)

1. Dispute/arbitrator path — cut first if behind; keep only requester-triggered release or refund.
2. Multiple simultaneous bounty listings — fall back to one active bounty at a time.
3. Live on-chain event feed (auto-updating listener) — fall back to a manual "Refresh" button reading current state.
4. Visual polish beyond one clean styled page.
5. On-chain reputation stamp — cut last: it's the cheapest-to-build, highest-originality item on the list (~20 lines of Solidity), so only drop it if truly out of time.

**Never cut:** contract deployed + verified, wallet connect + main action, README clarity, X post — these four are worth 100% of the score and one (X post) is free points regardless of build state, so it should never slip past T+0 on your calendar.

## Submission disqualifier checklist (from the guidebook — verify all before submitting)

- [ ] Contract deployed but frontend connects and works end to end (not deployed-but-disconnected)
- [ ] X post published, tagging @BOTChain_ai
- [ ] Real frontend exists (a bare Remix tab does not count)
- [ ] Project is your own work, README explains what changed if based on any template
- [ ] Submitted before Tue Aug 4, 11:59 PM
