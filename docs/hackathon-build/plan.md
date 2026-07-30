# plan.md: Agent Escrow

<!-- Filled in by hackathon-spec. hackathon-build reads this file and drives
     the loop task by task; docs/hackathon-build/progress.md tracks status
     against it. -->

## Task list

Feature Zero's tasks come first. Every task carries a model tier: **haiku**
for mechanical/repetitive work (boilerplate, config, transcription-style
tasks), **sonnet** for judgment or multi-file work (the default for most
feature tasks).

| # | Task | Tier | Feature Zero? |
|---|---|---|---|
| 1 | Hardhat project scaffold + BOT Chain testnet network config | haiku | yes |
| 2 | `AgentEscrow.sol` - createBounty/claimBounty/release/refund, ReentrancyGuard, checks-effects-interactions | sonnet | yes |
| 3 | Hardhat test: happy-path create→claim→release moves funds correctly, refund returns funds, reentrancy guard holds | sonnet | yes |
| 4 | Deploy script; deploy to BOT Chain testnet; verify on scan.bohr.life | haiku | yes |
| 5 | `index.html`: wallet connect, one-click "Add BOT Chain" network button, ABI + deployed address wired via ethers.js | sonnet | yes |
| 6 | Create-bounty form + claim button + release button wired to contract calls, live balance/status updates | sonnet | yes |
| 7 | Deploy `index.html` to GitHub Pages; verify full create→claim→release flow end to end with two MetaMask accounts against the live deployed contract | haiku | yes |
| 8 | `rateAgent` function + `AgentRated` event; reputation display (avg score, count) in UI | sonnet | no |
| 9 | Live on-chain event feed: `contract.on()` listeners rendering Created/Claimed/Released/Refunded/Rated as a running feed | sonnet | no |
| 10 | Bounty list view: iterate `bountyCount`, render every open/claimed bounty, not just the last one | sonnet | no |
| 11 | 3-step progress tracker UI (Created → Claimed → Released) + block-explorer deep links per bounty/tx | haiku | no |
| 12 | Refund flow wired into the UI (contract function already exists from task 2 - this is the button + state handling) | haiku | no |
| 13 | Demo GIF recording + `README.md` (what it does, how to use it, contract address, live link) | haiku | no |

## Task details

<!-- The `### Task N: <name>` heading format below is required verbatim:
     hackathon-build's bundled task-brief script matches on this exact
     pattern. Don't reword it or number tasks non-sequentially. -->

### Task 1: Hardhat project scaffold + BOT Chain testnet network config

**What ships:** `npx hardhat init` project with a `botchainTestnet` network entry (chainId 968, RPC `https://rpc.bohr.life`) in `hardhat.config.js`, and a `.env.example` for the deployer private key.
**Files touched:** `hardhat.config.js`, `.env.example`, `package.json` (new)
**Definition of done:** `npx hardhat compile` succeeds against the default `Lock.sol` template; `npx hardhat run scripts/deploy.js --network botchainTestnet` at least connects (doesn't need a real contract yet, just proves the RPC/chainId config is correct).

### Task 2: AgentEscrow.sol

**What ships:** the core contract - `Bounty` struct, `bounties` mapping, `bountyCount`, `createBounty(string) payable`, `claimBounty(uint256)`, `release(uint256)`, `refund(uint256)`, all five events (`BountyCreated`, `BountyClaimed`, `BountyReleased`, `BountyRefunded` - `AgentRated` comes in Task 8). Inherits OpenZeppelin `ReentrancyGuard`; `release`/`refund` set status *before* the external value transfer (checks-effects-interactions), guarded with `nonReentrant`.
**Files touched:** `contracts/AgentEscrow.sol`, `package.json` (add `@openzeppelin/contracts`)
**Definition of done:** compiles clean; `claimBounty` reverts if `msg.sender == requester` or status isn't `Open`; `release`/`refund` revert if caller isn't the requester or status isn't `Claimed`.

### Task 3: Hardhat test - money-path self-check

**What ships:** one test file proving the fund-moving logic actually moves funds correctly. This is the mandatory check for a money/security path, not optional coverage.
**Files touched:** `test/AgentEscrow.test.js`
**Definition of done:** `npx hardhat test` passes three cases: (1) full create→claim→release cycle leaves the agent's balance up by the bounty amount and the requester's down by it (plus gas), (2) refund from `Claimed` returns the full amount to the requester, (3) a reentrant contract attempting to re-enter `release` during the value transfer reverts.

### Task 4: Deploy + verify on BOT Chain testnet

**What ships:** `scripts/deploy.js` deploys `AgentEscrow` to `botchainTestnet` and logs the address; the contract is verified on `scan.bohr.life` (confirm live whether the verify plugin needs Blockscout or Etherscan config - dev-docs 403'd on fetch, check in-browser).
**Files touched:** `scripts/deploy.js`, `hardhat.config.js` (verify config)
**Definition of done:** the deployed address resolves on `https://scan.bohr.life/address/<address>` showing verified source code, not just bytecode.

### Task 5: index.html - wallet connect + contract wiring

**What ships:** single-file frontend: "Connect Wallet" button (MetaMask via `window.ethereum`), a "you're not on BOT Chain" banner with a button that calls `wallet_addEthereumChain` using the Task 1 network config, and the contract ABI + deployed address (from Task 4) wired through ethers.js v6 (CDN `<script>`, no bundler).
**Files touched:** `index.html` (new)
**Definition of done:** opening the page with no BOT Chain network configured, clicking connect, and clicking "Add BOT Chain" leaves MetaMask correctly configured and connected - verified with a fresh MetaMask profile, not one that already has the network added.

### Task 6: Create / claim / release flow in the UI

**What ships:** a form to create a bounty (description + BOT amount), a claim button (visible when a bounty is `Open` and the connected wallet isn't the requester), a release button (visible to the requester when `Claimed`) - each calling the matching contract function and updating the on-screen status from the transaction receipt, no manual refresh needed.
**Files touched:** `index.html`
**Definition of done:** the Feature Zero definition of done in spec.md passes: full create → claim → release with two real MetaMask accounts, balances and status updating live.

### Task 7: Deploy to GitHub Pages + cold end-to-end verification

**What ships:** `index.html` live at the repo's GitHub Pages URL (Settings → Pages → deploy from branch/`docs` folder - pick whichever needs the least repo restructuring).
**Files touched:** repo settings (no code files, or a move of `index.html` into `/docs` if Pages requires it)
**Definition of done:** the live GitHub Pages URL (not localhost, not a `file://` path) runs the full Feature Zero flow end to end.

### Task 8: On-chain reputation stamp

**What ships:** `rateAgent(uint256 bountyId, uint8 score)` (only callable by the bounty's requester, only after `Released`, `score` 1-5) pushing to `agentRatings[agent]` and emitting `AgentRated`; a small UI element showing an agent's average score and rating count when their address appears in a bounty.
**Files touched:** `contracts/AgentEscrow.sol`, `test/AgentEscrow.test.js` (one new case: rating before Released reverts), `index.html`
**Definition of done:** releasing a bounty unlocks a 1-5 rating control in the UI; submitting it is a real transaction, and the agent's average score visibly updates.

### Task 9: Live on-chain event feed

**What ships:** an ethers.js `contract.on(eventName, handler)` listener block rendering a running feed ("Bounty #3 created for 5 BOT", "Bounty #3 claimed by 0xabc…") as events land, so a judge watches their own transaction appear without refreshing.
**Files touched:** `index.html`
**Definition of done:** triggering any contract action in one browser tab updates the feed within a few seconds in the same tab without a page reload.

### Task 10: Bounty list view

**What ships:** loop `for (i = 0; i < bountyCount; i++) getBounty(i)` and render every bounty (not just whichever was last created), so multiple bounties can exist and be browsed.
**Files touched:** `index.html`
**Definition of done:** creating three bounties from different accounts shows all three in the list with correct individual statuses.

### Task 11: Progress tracker + explorer deep links

**What ships:** a 3-node "Created → Claimed → Released" tracker per bounty (highlighting the current state) and a "view on explorer" link per bounty/transaction pointing at `scan.bohr.life`.
**Files touched:** `index.html`
**Definition of done:** the tracker's highlighted step matches the bounty's actual on-chain status; the explorer link opens the correct address/tx.

### Task 12: Refund flow in the UI

**What ships:** a refund button visible to the requester on a `Claimed` (or still-`Open`, if they want to cancel) bounty, calling the existing `refund()` contract function.
**Files touched:** `index.html`
**Definition of done:** refunding returns the bounty's status to `Refunded` in the UI and the BOT back to the requester's wallet, verified on-chain.

### Task 13: Demo GIF + README

**What ships:** a screen recording of the full create → claim → release cycle (and the reputation stamp), converted to GIF, embedded at the top of `README.md` along with what the project does, how to use it, the deployed contract address, and the live link. This GIF is also the asset used for the required X post.
**Files touched:** `README.md`, `docs/demo.gif` (or similar)
**Definition of done:** someone with zero context reads the README top-to-bottom and knows what the project is and how to try it, without opening the code.
