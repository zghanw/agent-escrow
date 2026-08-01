# Agent Escrow: Codex Handoff

Last updated: 2026-08-02
Code baseline when this handoff was written: `a0c9726` on `master`
Repository: <https://github.com/zghanw/agent-escrow>
Live site: <https://www.agent-escrow.online/>

This file summarizes the work completed with Codex and the decisions behind the current implementation. Read it before changing the contract, frontend chain configuration, polling, or deployment workflow. The public-facing product documentation remains in [README.md](README.md) and [RESEARCH.md](RESEARCH.md).

## Current state

Agent Escrow is a static React dApp with no backend. A requester locks BOT for one designated agent, the agent accepts and submits evidence, and the escrow settles through requester release or timeout finalization. The contract also supports failure recovery and on-chain agent ratings.

The complete V2 flow is deployed and verified on BOT Chain testnet:

- Network: BOT Chain Testnet, chain ID `968`
- RPC: `https://rpc.bohr.life`
- Explorer: `https://scan.bohr.life`
- Current V2 contract: `0xf6C2Fb86E1f172c1aFddB665768827402C438592`
- Verified source: <https://scan.bohr.life/address/0xf6C2Fb86E1f172c1aFddB665768827402C438592#code>
- Two full designated-agent bounty cycles were completed on testnet; transaction links and screenshots are in the README.

Mainnet has **not** been deployed as of this handoff. The user added BOT Chain Mainnet to MetaMask and prepared a request for mainnet BOT, but funding, deployment, source verification, and frontend cutover are still pending.

## What Codex built

### 1. Project foundation and deployment

- Created the Hardhat 3 project with Solidity `0.8.24`, ethers.js 6, OpenZeppelin Contracts, and dotenv.
- Added BOT Chain Testnet configuration and deployment scripts.
- Removed duplicated RPC configuration from the deploy script; deployment uses Hardhat's selected network provider.
- Deployed and verified the first testnet contract, then later deployed the current designated-agent V2 contract.
- Added BOT Chain Mainnet to Hardhat:
  - Chain ID `677`
  - RPC `https://rpc.botchain.ai`
  - Explorer `https://scan.botchain.ai`
- Made `scripts/deploy.js` chain-aware and added copy-ready frontend configuration output.
- Added `.env.example` and `frontend/.env.example`; real private keys must never be committed.

### 2. Escrow contract evolution

The initial open-claim escrow was replaced by the current designated-agent V2 state machine in [contracts/AgentEscrow.sol](contracts/AgentEscrow.sol).

Current lifecycle:

```text
Open -> Accepted -> Submitted -> Released
Open -> Cancelled
Accepted -> Refunded after the work deadline
Accepted or Submitted -> Cancelled after both parties approve
Submitted -> Released by requester or finalized after the review deadline
```

Implemented contract behavior:

- `createBounty`: requester supplies an agent, task, BOT amount, work duration, and review period.
- `acceptBounty`: only the designated agent can accept; acceptance starts the work deadline.
- `cancelOpenBounty`: requester can cancel before acceptance and recover the principal.
- `submitWork`: only the agent can submit, and only before the work deadline.
- `release`: requester pays the agent after submission.
- `finalize`: anyone can pay the agent once the review deadline expires.
- `refundExpiredBounty`: requester recovers funds if accepted work misses its deadline.
- `setCancellationApproval`: requester and agent can independently approve or revoke mutual cancellation.
- `rateAgent`: requester can rate a released bounty once with a score from 1 to 5.
- `getAgentRatingSummary`: returns the agent's total score and rating count.

Important boundary decisions:

- Submission is valid only while `block.timestamp < workDeadline`.
- Refund becomes valid at `block.timestamp >= workDeadline`.
- Timeout finalization becomes valid at `block.timestamp >= reviewDeadline`.
- Fund-moving paths use checks-effects-interactions and `ReentrancyGuard`.
- The contract has no owner, admin, upgrade path, backend, or off-chain ledger.
- Submission evidence proves that data was recorded before a deadline; it does not judge work quality.

### 3. Contract and policy tests

- Built a money-path and state-machine test suite in [test/AgentEscrow.test.js](test/AgentEscrow.test.js).
- Added a malicious requester contract to test reentrant cancellation behavior.
- Covered role restrictions, deadlines, cancellation, refund, release, finalization, ratings, and invalid creation terms.
- Added deployment-output tests.
- Added frontend policy tests for ABI compatibility, allowed actions, validation, activity merging, and transient bounty reads.

Last verified result:

- `16` contract tests passing.
- `15` frontend policy tests passing.
- Frontend TypeScript/Vite production build passing.
- Frontend lint passing with four pre-existing Fast Refresh warnings in shared component files.

### 4. Frontend migration and design

- Replaced the original single-file frontend with React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/Radix primitives, and ethers.js 6.
- Recreated the landing page using the user's visual reference, including typography, a Three.js particle background, flow preview, verification panel, and custom assets.
- Added a wallet-gate route and a tabbed application dashboard.
- Added liquid-glass buttons based on the user's supplied component example.
- Added a 3D vault/status presentation and polished desktop/mobile styling.
- Fixed accessibility issues: explicit form labels, larger navigation targets, focus treatment, and low-contrast text.
- Fixed the Released status tracker so its final checkmark appears.

Current routes in [frontend/src/App.tsx](frontend/src/App.tsx):

- `#/` - landing page
- `#/connect` - wallet connection gate
- `#/app` - protected dashboard

`HashRouter` is intentional for static GitHub Pages hosting. Vite uses `base: '/'` because the production site runs on a custom root domain.

### 5. Wallet and bounty UX

- Wallet connect with existing-account detection.
- Account switching and MetaMask account/network event handling.
- Add or switch to BOT Chain Testnet from the UI.
- Recent bounties list and direct bounty-ID lookup.
- Full requester and designated-agent action controls based on role, status, and deadlines.
- Transaction status messages and explorer links.
- Profile tab showing the connected wallet's aggregate rating.
- Creation validation for task, positive amount, valid non-zero agent, requester/agent separation, and positive time windows.
- Create form clears only after a successful transaction.
- Create form remains mounted while switching dashboard tabs, so an in-progress draft is preserved. It intentionally does not survive a page refresh or browser close.

The discussed “My created bounties / My claimed bounties” view was **not** built. V2 uses designated agents rather than open claiming, so any future version should use “assigned to me” rather than “claimed by me.”

### 6. Activity, polling, and RPC reliability

The Activity tab originally depended too heavily on live HTTP-provider listeners, so completed actions could be missing until a refresh. Codex added:

- Historical event backfill from `VITE_CONTRACT_DEPLOY_BLOCK`.
- Live contract listeners as the fast path.
- A read-only synchronization cycle every `5` seconds while the page is visible, connected, and on BOT Chain.
- Immediate synchronization when a hidden tab becomes visible again.
- Incremental Activity event queries rather than full-history rereads.
- Event deduplication by transaction/log identity, newest-first ordering, and a `25`-entry cap.
- Silent background refresh of Recent Bounties, the selected bounty, and the connected wallet's rating.
- No overlapping poll cycles.
- A recent-bounties limit of `10`.
- RPC log queries split below the provider's undocumented 5,000-block cap (`4,500` blocks per range).

Design notes are preserved in [docs/superpowers/specs/2026-08-01-live-polling-sync-design.md](docs/superpowers/specs/2026-08-01-live-polling-sync-design.md).

### 7. Error handling fixes

- Improved MetaMask rejection, pending connection, network-switch, and transaction error messages.
- Added `Try refreshing the website.` to caught runtime errors that may result from stale initial frontend/RPC state. User-rejected wallet actions do not receive that hint.
- Diagnosed an intermittent BOT Chain RPC read where an existing bounty temporarily reverted with `Bounty does not exist`.
- Added a narrowly scoped retry in [frontend/src/lib/bountyRead.ts](frontend/src/lib/bountyRead.ts):
  - Recognizes a null/default bounty or a revert containing `Bounty does not exist`.
  - Waits `1` second and retries once.
  - Preserves the currently displayed bounty during the first failure.
  - Returns not-found only after the second matching response.
  - Does not retry unrelated RPC errors, wallet rejections, or transactions.

Related design notes:

- [Refresh error hint](docs/superpowers/specs/2026-08-01-refresh-error-hint-design.md)
- [Transient bounty read retry](docs/superpowers/specs/2026-08-01-transient-bounty-read-retry-design.md)

### 8. GitHub Pages, custom domain, and CI

- Added GitHub Actions deployment from `master` in [.github/workflows/deploy.yml](.github/workflows/deploy.yml).
- The workflow installs frontend dependencies, builds with repository variables, uploads `frontend/dist`, and deploys to GitHub Pages.
- Fixed the production app showing the repository README instead of the site by aligning Pages/custom-domain routing and Vite's root base path.
- Published the app at <https://www.agent-escrow.online/>.
- Required GitHub repository variables:
  - `VITE_CONTRACT_ADDRESS`
  - `VITE_CONTRACT_DEPLOY_BLOCK`
- The frontend fails closed when either deployment coordinate is missing, preventing the V2 ABI from accidentally targeting a retired contract.

### 9. Public documentation and submission polish

- Removed the BOTCHAIN Build Week hackathon mention from the README at the user's request.
- Reworked README content for judges and public visitors.
- Added accurate technology badges, MIT license, screenshots, verified contract proof, transaction receipts, architecture, security evidence, lifecycle reference, and reproducible local commands.
- Added [RESEARCH.md](RESEARCH.md) with protocol rationale, architecture, security model, limitations, testing, and testnet evidence.
- Removed/private internal planning notes from the public-facing repository while retaining the useful public research report.
- Added the root [LICENSE](LICENSE).

### 10. Mainnet organizer communication

Codex helped draft a mainnet BOT request containing:

1. Project name: Agent Escrow
2. A short project description
3. The current testnet contract address
4. The user's MetaMask wallet address

The user also needed to tell the organizer that the Telegram group link was inaccessible. Do not invent or expose the wallet address; ask the user for it when needed.

## Architecture map

| Area | Key files | Notes |
|---|---|---|
| Contract | `contracts/AgentEscrow.sol` | Current V2 source of truth |
| Contract tests | `test/AgentEscrow.test.js`, `contracts/test/MaliciousRequester.sol` | 16 passing tests at last verification |
| Deployment | `hardhat.config.js`, `scripts/deploy.js`, `scripts/deploymentOutput.js` | Supports testnet and mainnet |
| App routes | `frontend/src/App.tsx` | Lazy routes with `HashRouter` |
| Dashboard orchestration | `frontend/src/pages/Dashboard.tsx` | Tabs and component composition |
| Chain state | `frontend/src/hooks/useEscrow.ts` | Wallet, reads, writes, listeners, polling |
| Chain config | `frontend/src/lib/contract.ts` | Currently hard-coded for testnet UI |
| ABI | `frontend/src/lib/agentEscrowAbi.ts` | Must match deployed V2 |
| Action policy | `frontend/src/lib/escrowPolicy.ts` | Role/status/deadline actions and draft validation |
| Activity merging | `frontend/src/lib/activityFeed.ts` | Dedupe, sorting, feed limit |
| RPC retry | `frontend/src/lib/bountyRead.ts` | One retry for transient not-found only |
| Dashboard UI | `frontend/src/components/dashboard/` | Bounties, Create, Activity, Profile |
| Liquid glass UI | `frontend/src/components/ui/liquid-glass-button.tsx` | Shared button and SVG filter |
| Deployment CI | `.github/workflows/deploy.yml` | GitHub Pages on `master` pushes |

## Commands future sessions should use

From the repository root:

```powershell
npm install
npm test
npx hardhat compile

npm install --prefix frontend
npm run test:policy --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
npm run dev --prefix frontend
```

On this Windows machine, if the PowerShell npm shim fails, use the executable directly:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' test
& 'C:\Program Files\nodejs\npm.cmd' run build --prefix frontend
```

Do not run `npm audit fix --force` casually. The last clean install reported dependency audit findings and the frontend build reported a large Three.js chunk warning; neither was changed because forced upgrades or ad hoc code splitting would add submission risk.

## Mainnet work still pending

Do not assume that adding Mainnet to MetaMask means the app is mainnet-ready. The remaining sequence is:

1. Confirm the deployer wallet has real mainnet BOT.
2. Re-review the exact contract source and compile with Solidity `0.8.24` to match this repository.
3. Deploy with:

   ```powershell
   npx hardhat run scripts/deploy.js --network botchainMainnet
   ```

4. Save the contract address, deployment transaction hash, deployer address, block number, deployment date, and compiler version.
5. Verify/publish the exact source on <https://scan.botchain.ai>.
6. Update frontend network configuration in `frontend/src/lib/contract.ts`. It currently requires chain ID `968` and points to the testnet explorer/RPC; changing only the contract environment variables is insufficient.
7. Update GitHub repository variables `VITE_CONTRACT_ADDRESS` and `VITE_CONTRACT_DEPLOY_BLOCK` to the mainnet deployment.
8. Update README badges, explorer links, deployment status, and proof so they no longer claim the app is testnet-only.
9. Build and test locally, push to `master`, wait for GitHub Pages deployment, and run a small-value mainnet smoke test.

Never commit a funded wallet private key, seed phrase, `.env`, or `frontend/.env.local`.

## Known limitations and deliberate non-features

- No backend, indexer, database, dispute arbitrator, oracle, upgradeability, or admin recovery.
- Activity is polling plus event listeners, not a WebSocket subscription.
- Profile shows aggregate rating only; there is no My Bounties list.
- Recent Bounties is global and limited to the latest 10 contract entries.
- Activity is global and capped at 25 entries.
- Form drafts survive dashboard tab changes but not refreshes.
- Ratings are simple on-chain averages and do not include written reviews or weighting.
- The contract is tested and source-verified but has not received an external security audit.
- Public BOT Chain RPC consistency can be transient; the frontend handles the known false not-found case conservatively.

## High-value commits

| Commit | Outcome |
|---|---|
| `b9eb733` | Core AgentEscrow contract and money-path tests |
| `30fc928` | First testnet deployment and verification |
| `890719d` | React/Vite/shadcn frontend migration |
| `08ead6b` | Liquid-glass dashboard buttons |
| `02e502f` | Wallet gate, 3D vault, and tabbed dashboard redesign |
| `c6468b6` | Historical Activity backfill fix |
| `3900174` | Mainnet Hardhat config and Profile/ratings tab |
| `0955041` | Deadlines and optimistic settlement contract behavior |
| `6c09cf5` | Designated-agent escrow V2 frontend integration |
| `5983dba` | Consolidated V2 contract with symmetric deadlines |
| `73d7aab` | Custom-domain GitHub Pages root-path fix |
| `42f1176` | Accurate README badges and MIT license |
| `a2e9bfc` | Refresh guidance on recoverable frontend errors |
| `08daaa7` | Visibility-aware five-second live synchronization |
| `998fb29` | Narrow retry for transient missing-bounty reads |
| `a0c9726` | Preserve Create form draft across dashboard tabs |

Use `git log --reverse --oneline` for the complete 59-commit implementation ledger as of this handoff.

## Guidance for future Claude sessions

- Treat `master` and the V2 contract as the current baseline; do not revive the retired open-claim V1 flow.
- Preserve the designated-agent terminology and symmetric deadline model.
- Keep transaction retries manual. Only read-only not-found bounty reads have an automatic retry.
- Preserve successful transaction logs while background polling refreshes state.
- Keep polling silent on transient background failures and prevent overlapping cycles.
- If changing the ABI or contract struct, update `agentEscrowAbi.ts`, deployment coordinates, policy tests, UI mapping, README proof, and both test suites together.
- If switching to mainnet, update both Hardhat deployment settings and frontend network constants.
- Avoid broad UI rewrites or dependency upgrades immediately before submission unless the user explicitly accepts the risk.
- Before claiming completion, run contract tests, frontend policy tests, lint, and the production build.
