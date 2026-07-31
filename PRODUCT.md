# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two symmetric personas sharing one product, both BOT Chain wallet holders comfortable with MetaMask:

- **Requesters** who post a bounty and need assurance their funds won't be lost to a ghosting agent.
- **Agents** (or the human operators running them) who claim and deliver work and need assurance they'll be paid once delivery is confirmed.

Neither persona is primary; the product's voice speaks to the trust relationship between them, not to one side's tool. A judge or first-time visitor evaluates the product by acting as one side of that exchange, live, with real funds.

## Product Purpose

Agent Escrow is an on-chain escrow primitive for BOT Chain: a requester locks BOT into the contract when posting a bounty, an agent wallet claims and delivers the task, and the requester releases payment on-chain (or refunds before release). It removes the "trust me" IOU that currently governs agent-to-agent gig work on BOT Chain, where every deal today runs on a Discord DM and a hope. Success is a stranger trusting the contract with funds without trusting the counterparty.

## Positioning

Not a token/NFT-mint clone — a real two-wallet state machine where value moves between two independent, unrelated wallets, not a single self-directed click. Ships with an on-chain reputation stamp (`rateAgent`) that builds a persistent, queryable trust signal per agent address: a minimal, self-contained riff on the ERC-8004 identity/reputation direction and x402-style agent-payment infrastructure. No dispute/arbitrator layer and no protocol fee live yet (a production version would take a 1-2% cut on release) — deliberately left out to keep the fund-moving code small and auditable for the hackathon build window.

## Operating Context

Submitted as a hackathon entry for BOTChain Build Week, hard deadline Tue Aug 4, 2026, 11:59 PM. Judged cold and self-serve: a judge opens the live link with a fresh or unfamiliar MetaMask, uses the one-click "Add BOT Chain" flow if the testnet isn't configured, then runs create -> claim (from a second wallet) -> release, watching balances and the live activity feed update in place.

Deployed as a static SPA to GitHub Pages under base path `/agent-escrow/` (Vite `base`), routed with `HashRouter` since there is no server to own path rewrites. No backend: the page talks directly to the deployed contract over ethers.js; on-chain state is the UI's state. The contract itself is already deployed and verified on BOT Chain testnet at a fixed address and is immutable — UI work cannot assume any contract-side change.

## Capabilities and Constraints

- No backend/server component. All reads and writes go through ethers.js straight to the contract; nothing to deploy or keep alive except the static frontend.
- Wallet connect is a hand-rolled MetaMask integration via `window.ethereum` (`connectWallet` / `switchAccount` / `addOrSwitchNetwork` in `useEscrow`) — no wagmi, RainbowKit, or wallet-adapter library in the stack. Any new wallet-gate surface should route through this existing hook, not a new library.
- Stack already in place: React 19 + Vite + TypeScript, Tailwind v4, shadcn/ui on Radix primitives, `react-router-dom` (HashRouter), ethers.js v6. `@react-three/fiber` + `@react-three/drei` + `three` are already installed and unused beyond incidental setup — available for 3D work without adding a dependency.
- Current onboarding/dashboard (`Dashboard.tsx`) stacks every panel — wallet, network, event feed, create-bounty, recent bounties, bounty detail, tx log — in one vertical flow on a single page. Confirmed pain point going into the tab-restructure work.
- One active bounty flow is the current build's scope (multi-bounty listing was cut in `HACKATHON.md`'s scope-cut log for time) — treat "recent bounties" + "load by ID" as the present mechanism, not a full marketplace list, unless the user asks to build that out.
- Contract functions and state machine (`Open -> Claimed -> Released`, or `Open|Claimed -> Refunded`) are fixed and documented in `README.md` / `lib/contract.ts` — UI work never implies new on-chain behavior.

## Brand Commitments

Name, one-liner ("Post a BOT bounty for a task, an agent wallet claims it and delivers, you release payment on-chain — no middleman, no 'trust me' IOU.") and overall positioning are locked — confirmed explicitly, not to be revisited by this design pass. Visual identity (typography, color, motion, layout) is open. Existing visual references already in the codebase (a Nexflow-inspired landing design, a liquid-glass button treatment, "Sentient" display type) are prior visual-world evidence, not a binding constraint, per stage 4's explicit "no limits" creative direction.

## Evidence on Hand

- Live app: https://zghanw.github.io/agent-escrow/
- Verified contract on BOT Chain testnet: `0x956E373A71dA8836FF6a5d5Fe5A5e2d05AF55Cc1`
- Full rubric-scoring, angle-selection, and phase-plan reasoning in `HACKATHON.md`.
- No testimonials, press, case studies, or customer evidence exist — none should be fabricated.

## Product Principles

1. The live demo must survive a cold judge run: fresh MetaMask, testnet not yet added, two independent wallets — every design decision is subordinate to that flow completing without a dead end.
2. Real value moving between two independent wallets is the whole differentiator; never let visual design flatten that into a single self-directed click for the sake of simplicity.
3. On-chain state is the UI's state — no design should imply data the contract doesn't actually expose (no fake multi-listing marketplace, no invented fee display, no dispute flow).
4. Trust is earned visually as much as functionally: a stranger deciding whether to send real BOT into this contract should read competence and seriousness in the interface, not hackathon-weekend scrappiness.
5. Ambition is explicitly licensed here (locked brand, but "no limits" on execution) — a safe, generic design is a bigger risk to the originality criterion than a bold one that ships.
