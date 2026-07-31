# spec.md: Agent Escrow

<!-- Filled in by hackathon-spec. Read by hackathon-build to drive the
     implementation loop; keep it current if the team pivots mid-build. -->

**Time budget:** this is the "Spec" checkpoint from HACKATHON.md's phase plan - Thu Jul 30, tonight. Feature Zero is due Fri Jul 31 EOD. That's less than 24h from now to a deployed, verified, working contract + connected frontend.

## Architecture

Two options considered:

1. **(Recommended) Single static `index.html`, no backend, no build step.** Vanilla JS + ethers.js loaded via CDN `<script>` tag, talking directly to the `AgentEscrow.sol` contract on BOT Chain. Contract dev/deploy via Hardhat (JS-based - shares tooling with the frontend, has verify plugins for Blockscout/Etherscan-style explorers). Deployed to GitHub Pages straight from the same repo the guidebook already requires (`.sol` + README) - one artifact satisfies both the "GitHub repo" and "live domain" submission requirements, no extra hosting account. *Trade-off: less ergonomic for complex UI state than a framework, but there is no complex UI state here - a handful of buttons and a status tracker.*
2. React + Vite + wagmi/viem, deployed to Vercel. *Trade-off: nicer component reuse for the reputation stamp / progress tracker, but adds a build pipeline, a larger dependency surface, and framework-version risk for a solo 5-day build - and it works against the guidebook's own advice ("One HTML file is enough!").*

**Going with option 1.** It's also just less to break: a judge opening the link gets a page that already loaded, no build artifact to go stale, no framework hydration bug to hit at demo time.

## Tech stack

- **Contract:** Solidity ^0.8.24, Hardhat, OpenZeppelin `ReentrancyGuard`.
- **Frontend:** *Originally* a single `index.html`, inline `<script>`, ethers.js v6 via CDN, no bundler (per the "Architecture" decision above). **Pivoted mid-build** ("Migrate frontend to React + Vite + shadcn/ui" and "Redesign frontend: wallet-gate flow, 3D vault, tabbed dashboard" commits): the shipped frontend is React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui, with `react-router-dom` (`HashRouter`) for client-side routing and a `@react-three/fiber`/`three` 3D vault component on the dashboard. Still no backend and still ethers.js v6 talking directly to the contract - only the UI layer changed. See `README.md`'s Architecture section for the current, accurate description.
- **Deploy:** GitHub Pages (frontend + repo in one place); Vercel as a fallback only if Pages caching becomes a problem mid-hack.
- **Chain - BOT Chain testnet** (build and demo here; only touch mainnet once the full flow is proven):
  - Chain ID: `968`
  - RPC: `https://rpc.bohr.life`
  - Explorer: `https://scan.bohr.life/`
  - Faucet: `https://faucet.botchain.ai/basic`
  - Docs: `https://dev-docs.botchain.ai/docs/intro`
- **BOT Chain mainnet** (submission target, deploy last): Chain ID `677`, RPC `https://rpc.botchain.ai`, Explorer `https://scan.botchain.ai`.
- **Open item to confirm during Task 4 (not blocking):** token decimals (assume standard 18) and whether the explorer's verify API is Blockscout- or Etherscan-style - the dev docs site 403'd on fetch, confirm live in-browser when setting up the Hardhat verify plugin.

## Data model (on-chain state, not a database)

- `Bounty` struct: `id (uint256)`, `requester (address)`, `agent (address, zero until claimed)`, `amount (uint256, wei)`, `description (string)`, `status (enum: Open, Claimed, Released, Refunded)`, `createdAt (uint256)`.
- `Rating` struct: `requester (address)`, `bountyId (uint256)`, `score (uint8, 1-5)`, `ratedAt (uint256)`.
- Storage: `mapping(uint256 => Bounty) public bounties;` `uint256 public bountyCount;` `mapping(address => Rating[]) public agentRatings;`
- Events: `BountyCreated`, `BountyClaimed`, `BountyReleased`, `BountyRefunded`, `AgentRated` - every state transition emits one, since the live event feed (wow feature) reads directly off these.

## Feature Zero

Contract deployed and verified on BOT Chain testnet. `index.html` live on GitHub Pages, not localhost. Connect MetaMask (auto-adds BOT Chain testnet via `wallet_addEthereumChain` if it's not already configured) from wallet A, create a bounty with a real BOT amount, switch MetaMask to wallet B, claim it, switch back to wallet A, release. Wallet B's on-chain balance increases by the bounty amount and the UI reflects "Released" without a page reload. Every step is a real transaction against the real deployed contract - there's no mock-data path to simulate here, the on-chain state *is* the UI's source of truth from day one.

**Definition of done:** a judge (or you, cold) can open the GitHub Pages link, connect a fresh MetaMask wallet with BOT Chain not yet added, and complete a full create → claim → release cycle using two accounts, watching real BOT move and the status update live.

## Business model / market

- **Target customer:** teams building AI-agent marketplaces or bounty boards on BOT Chain - anyone who needs trust-minimized payment-on-completion between two wallets that don't know each other.
- **How this makes money:** a small protocol fee (1-2%) skimmed off each released escrow - the standard marketplace-escrow cut (Upwork's model, on-chain, no platform to trust). *(Narrative only, not built - the rubric doesn't score monetization, and skimming a fee adds a rounding/recipient-address edge case to the exact function \[`release()`\] the guidebook warns is irreversible if buggy. State it in the README as "a production version would take 1-2% here"; don't add the code.)*
- **Why someone adopts this:** BOT Chain wants live dApps at launch, and escrow is the payment primitive underneath every other bot-economy idea (task boards, data buys, agent marketplaces) - whoever ships it first becomes infrastructure everyone else builds on, not just another submission.
