# Agent Escrow

<!-- TODO (submission requirement): record a short screen capture of the
     live create → claim → release → rate walkthrough below, save it as
     demo.gif in this repo, and replace this comment with:
     ![Agent Escrow demo](demo.gif)
     This GIF also doubles as the asset for the required X post. -->

Post a BOT bounty for a task, an agent wallet claims it and delivers, you release payment on-chain - no middleman, no "trust me" IOU. Built for the [BOTChain Build Week Hackathon](https://www.girlmeetstech.org/guidebook-build-week-hackathon).

**Live app:** https://zghanw.github.io/agent-escrow/
**Contract (BOT Chain testnet, verified):** [`0x956E373A71dA8836FF6a5d5Fe5A5e2d05AF55Cc1`](https://scan.bohr.life/address/0x956E373A71dA8836FF6a5d5Fe5A5e2d05AF55Cc1#code)

## The problem

An AI agent (or the human running it) doing paid work for a stranger on BOT Chain has no recourse if the requester ghosts after delivery - and a requester has no recourse if an agent takes payment and never delivers. Every agent-to-agent gig today runs on a Discord DM and a hope. Agent Escrow is the missing payment primitive: funds sit in the contract, not with either party, until the work is confirmed done.

## How to use it

1. Open the [live app](https://zghanw.github.io/agent-escrow/) and click **Connect Wallet** (MetaMask). If BOT Chain testnet isn't configured yet, click **Add / Switch to BOT Chain** - the app configures it for you.
2. **Create a bounty**: describe the task and set a BOT amount, then confirm the transaction. Your funds move into the contract, not to anyone yet.
3. **Claim it** from a *different* wallet (the agent) - the requester can't claim their own bounty.
4. Back on the requester's wallet, **Release Payment** to pay the agent, or **Refund** at any point before release to cancel and get your funds back.
5. Once released, the requester can **rate the agent** 1-5. Ratings accumulate per agent address and are visible to anyone looking up that agent.

Every action shows up instantly in the **Live activity** feed, and every transaction links straight to the block explorer.

## Why this is more than a toy

- **Real value moves between two independent wallets** - not a single self-directed click. That's the difference between "wallet connects" as a checkbox and as a working payment flow.
- **On-chain reputation.** After release, the requester rates the agent on-chain (`rateAgent`), building a persistent, queryable trust signal per agent address - a lightweight, self-contained take on the direction [ERC-8004](https://www.allium.so/blog/onchain-ai-identity-what-erc-8004-unlocks-for-agent-infrastructure/) (identity/reputation registries for AI agents, live on Ethereum mainnet since Jan 2026) and [x402](https://www.rzlt.io/blog/agentic-payments-2026-x402-explainer)-style agent-payment infrastructure are heading in.
- **A real revenue model, not built in:** a production version would take a 1-2% fee on release (the standard marketplace-escrow cut) - deliberately left out of this build to keep the fund-moving code as small and auditable as possible for the hackathon window.

## Architecture

Single static `index.html` - vanilla JavaScript, [ethers.js](https://ethers.org/) v6 loaded via CDN, no build step, no framework, no backend. The page talks directly to the contract; on-chain state *is* the UI's state. This mirrors the guidebook's own advice ("One HTML file is enough!") and keeps the live demo as hard to break as possible: no bundler to fail, no framework hydration bug to hit mid-demo.

The Solidity side is a single contract, [`AgentEscrow.sol`](contracts/AgentEscrow.sol), built with [Hardhat](https://hardhat.org/) and OpenZeppelin's `ReentrancyGuard`.

## Contract reference

| Function | Who can call it | What it does |
|---|---|---|
| `createBounty(description)` (payable) | anyone | Opens a bounty, locking the sent BOT in the contract. |
| `claimBounty(id)` | anyone except the requester | Assigns the caller as the agent; bounty moves to `Claimed`. |
| `release(id)` | the requester, once `Claimed` | Pays the agent the full bounty amount; moves to `Released`. |
| `refund(id)` | the requester, while `Open` or `Claimed` | Returns the full amount to the requester; moves to `Refunded`. |
| `rateAgent(id, score)` | the requester, once `Released`, once per bounty | Records a 1-5 rating against the agent's address. |
| `getAgentRatingSummary(agent)` | anyone (view) | Returns `(totalScore, count)` for computing an agent's average. |

State machine: `Open → Claimed → Released` (happy path) or `Open|Claimed → Refunded` (cancel/bail-out). All four transitions and the rating action emit events (`BountyCreated`, `BountyClaimed`, `BountyReleased`, `BountyRefunded`, `AgentRated`), which is what the live activity feed listens to.

Fund-moving functions (`release`, `refund`) follow checks-effects-interactions (status is updated before any value transfer) and are additionally guarded with OpenZeppelin's `nonReentrant` - both proven by the test suite, including a dedicated reentrancy-attack test.

## Local development

```bash
npm install
npx hardhat test              # 10 tests: money-path, refund, reentrancy-guard, ratings, access control
npx hardhat compile
```

To deploy your own instance to BOT Chain testnet:

```bash
cp .env.example .env          # fill in a funded testnet wallet's PRIVATE_KEY
npx hardhat run scripts/deploy.js --network botchainTestnet
npx hardhat verify --network botchainTestnet <deployed-address>
```

BOT Chain testnet: chain ID `968`, RPC `https://rpc.bohr.life`, explorer `https://scan.bohr.life`, faucet `https://faucet.botchain.ai/basic`.

## Tech stack

Solidity ^0.8.24, Hardhat 3, OpenZeppelin Contracts, ethers.js v6, vanilla HTML/CSS/JS, GitHub Pages.

## Project docs

The full kickoff-to-build reasoning - rubric scoring, angle selection, spec, and the task-by-task build plan - lives in [`HACKATHON.md`](HACKATHON.md) and [`docs/hackathon-build/`](docs/hackathon-build/).
