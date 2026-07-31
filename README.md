# Agent Escrow

<!-- TODO (submission requirement): record a short screen capture of the
     live create → accept → submit → release → rate walkthrough below, save it as
     demo.gif in this repo, and replace this comment with:
     ![Agent Escrow demo](demo.gif)
     This GIF also doubles as the asset for the required X post. -->

Fund a task for a designated agent, record delivery on-chain, and settle through symmetric work and review deadlines — no middleman and no unilateral post-acceptance refund.

**Live app:** https://zghanw.github.io/agent-escrow/
**Legacy V1 contract (BOT Chain testnet, verified):** [`0x956E373A71dA8836FF6a5d5Fe5A5e2d05AF55Cc1`](https://scan.bohr.life/address/0x956E373A71dA8836FF6a5d5Fe5A5e2d05AF55Cc1#code)

V2 is implemented and tested in this repository but is not presented as live until a new immutable contract is deployed and the frontend receives its address and deployment block.

## The problem

An AI agent (or the human running it) doing paid work for a stranger on BOT Chain has no recourse if the requester ghosts after delivery - and a requester has no recourse if an agent takes payment and never delivers. Every agent-to-agent gig today runs on a Discord DM and a hope. Agent Escrow is the missing payment primitive: funds sit in the contract, not with either party, until the work is confirmed done.

## How to use it

1. Open the [live app](https://zghanw.github.io/agent-escrow/) and click **Connect Wallet** (MetaMask). If BOT Chain testnet isn't configured yet, click **Add / Switch to BOT Chain** - the app configures it for you.
2. **Create a bounty** with the task, BOT amount, designated agent address, work window, and requester review window. Funds move into the contract immediately.
3. The designated wallet **accepts** the bounty. The work deadline starts at acceptance; no unrelated wallet can take the job.
4. The agent **submits work** by recording a deliverable URL or content hash before the work deadline.
5. The requester **releases payment** during review. If the requester does nothing, anyone can call `finalize` at the review deadline and the contract pays the agent.
6. If the agent misses the work deadline, the requester can recover the escrow. While work is active, both parties can approve a mutual cancellation; one approval alone moves no funds.
7. Once released, the requester can **rate the agent** 1–5. Ratings accumulate per agent address and are visible to anyone looking up that agent.

Every action shows up instantly in the **Live activity** feed, and every transaction links straight to the block explorer.

## Why this is more than a toy

- **Real value moves between two independent wallets** - not a single self-directed click. That's the difference between "wallet connects" as a checkbox and as a working payment flow.
- **On-chain reputation.** After release, the requester rates the agent on-chain (`rateAgent`), building a persistent, queryable trust signal per agent address - a lightweight, self-contained take on the direction [ERC-8004](https://www.allium.so/blog/onchain-ai-identity-what-erc-8004-unlocks-for-agent-infrastructure/) (identity/reputation registries for AI agents, live on Ethereum mainnet since Jan 2026) and [x402](https://www.rzlt.io/blog/agentic-payments-2026-x402-explainer)-style agent-payment infrastructure are heading in.
- **A real revenue model, not built in:** a production version would take a 1-2% fee on release (the standard marketplace-escrow cut) - deliberately left out of this build to keep the fund-moving code as small and auditable as possible for the hackathon window.

## Architecture

The frontend started life as a single static `index.html` - vanilla JavaScript, ethers.js v6 loaded via CDN, no build step, no framework - per the guidebook's own advice ("One HTML file is enough!"). It was migrated mid-build to a proper React app: **React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui**, with client-side routing via `react-router-dom` (`HashRouter`, so it still works unmodified on GitHub Pages) and a `@react-three/fiber`/`three` 3D vault component on the dashboard that animates in sync with each bounty's on-chain status. There's still no backend: the app talks directly to the contract via [ethers.js](https://ethers.org/) v6, and on-chain state *is* the UI's state - only the presentation layer changed.

The Solidity side is a single contract, [`AgentEscrow.sol`](contracts/AgentEscrow.sol), built with [Hardhat](https://hardhat.org/) and OpenZeppelin's `ReentrancyGuard`.

## Contract reference

| Function | Who can call it | What it does |
|---|---|---|
| `createBounty(agent, description, workDuration, reviewPeriod)` (payable) | anyone | Opens and funds a bounty for one designated agent. |
| `acceptBounty(id)` | designated agent | Accepts the work and starts its deadline. |
| `cancelOpenBounty(id)` | requester, while `Open` | Cancels before acceptance and returns the escrow. |
| `submitWork(id, submission)` | designated agent, before deadline | Stores a deliverable URL/hash and starts requester review. |
| `refundExpiredBounty(id)` | requester, after missed work deadline | Returns escrow only when accepted work was not submitted on time. |
| `release(id)` | requester, once `Submitted` | Pays the agent immediately. |
| `finalize(id)` | anyone, after review deadline | Pays the agent when requester review expires without settlement. |
| `setCancellationApproval(id, approved)` | requester or agent | Approves or revokes mutual cancellation; refund occurs only after both approvals. |
| `rateAgent(id, score)` | the requester, once `Released`, once per bounty | Records a 1-5 rating against the agent's address. |
| `getAgentRatingSummary(agent)` | anyone (view) | Returns `(totalScore, count)` for computing an agent's average. |

Happy path: `Open → Accepted → Submitted → Released`. An open bounty may become `Cancelled`; missed accepted work becomes `Refunded`; mutual approval can produce `Cancelled` from `Accepted` or `Submitted`.

Every fund-moving function follows checks-effects-interactions and uses OpenZeppelin's `nonReentrant`. The suite covers direct release, timeout finalization, deadline refund, open and mutual cancellation, authorization, exact deadline boundaries, reputation, and a malicious reentrant receiver.

Submission evidence proves that a value was recorded before the deadline; it cannot prove subjective quality. High-value subjective work still benefits from an optional resolver in a future version.

## Local development

```bash
npm install
npx hardhat test              # contract lifecycle, deadline, cancellation, security, and deployment-output tests
npx hardhat compile
npm install --prefix frontend
npm run test:policy --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

To deploy your own instance to BOT Chain testnet:

```bash
cp .env.example .env          # fill in a funded testnet wallet's PRIVATE_KEY
npx hardhat run scripts/deploy.js --network botchainTestnet
npx hardhat verify --network botchainTestnet <deployed-address>
```

The deploy script prints `VITE_CONTRACT_ADDRESS` and `VITE_CONTRACT_DEPLOY_BLOCK`. Copy both into `frontend/.env.local` for local builds, or create GitHub repository variables with the same names before deploying Pages. The V2 frontend fails closed when either value is missing, preventing the V2 ABI from being used against the legacy V1 address.

BOT Chain testnet: chain ID `968`, RPC `https://rpc.bohr.life`, explorer `https://scan.bohr.life`, faucet `https://faucet.botchain.ai/basic`.

## Tech stack

Solidity ^0.8.24, Hardhat 3, OpenZeppelin Contracts, ethers.js v6, React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + react-router-dom + @react-three/fiber, GitHub Pages.

## Project docs

The full kickoff-to-build reasoning - rubric scoring, angle selection, spec, and the task-by-task build plan - lives in [`HACKATHON.md`](HACKATHON.md) and [`docs/hackathon-build/`](docs/hackathon-build/).
