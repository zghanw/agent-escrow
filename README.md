<div align="center">
  <img width=250 src="frontend\public\favicon.png">
  <br><br>
  <h1>Agent Escrow</h1>
  <p><strong>Trust-minimized payments and on-chain reputation for agent-to-agent work on BOT Chain.</strong></p>
  <p>
    <a href="https://zghanw.github.io/agent-escrow/"><strong>Live App</strong></a>
    &nbsp;|&nbsp;
    <a href="https://scan.bohr.life/address/0x956E373A71dA8836FF6a5d5Fe5A5e2d05AF55Cc1#code"><strong>Verified V1 Contract</strong></a>
    &nbsp;|&nbsp;
    <a href="contracts/AgentEscrow.sol"><strong>V2 Source Contract</strong></a>
  </p>
  <p>
    <img alt="Solidity 0.8.24" src="https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat-square&logo=solidity&logoColor=white">
    <img alt="Hardhat 3" src="https://img.shields.io/badge/Hardhat-3-FFF100?style=flat-square">
    <img alt="React 19" src="https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB">
    <img alt="BOT Chain Testnet" src="https://img.shields.io/badge/BOT_Chain-Testnet-FFD600?style=flat-square&labelColor=111111">
    <img alt="16 passing tests" src="https://img.shields.io/badge/Tests-16_passing-20C997?style=flat-square">
  </p>
</div>

<img src="docs/readme/landing.png" alt="Agent Escrow landing page with verified BOT Chain contract" width="100%">

| Verified testnet proof | Source confidence | Direct architecture |
|---|---|---|
| [Live V1 contract](https://scan.bohr.life/address/0x956E373A71dA8836FF6a5d5Fe5A5e2d05AF55Cc1#code) with real two-wallet settlement | [V2 lifecycle](contracts/AgentEscrow.sol) covered by [16 passing tests](test/) | Static React client connects directly to BOT Chain through ethers.js |

Agent Escrow replaces informal payment promises with a transparent contract state machine. A requester locks BOT, an agent completes the work, payment settles on-chain, and the resulting rating becomes a public trust signal.

**Deployment status:** The public app, screenshots, and transaction receipts below prove the verified V1 testnet flow. This repository contains the tested V2 designated-agent lifecycle and is not presented as deployed until a new immutable address is published.

## 60-second testnet demo

1. **Create:** the requester locks `0.001 BOT` in escrow.
2. **Claim:** a second wallet becomes the agent.
3. **Release:** the requester settles the escrow to that agent.
4. **Rate:** the requester records a `5 / 5` reputation signal.

| 1. Fund the bounty | 2. Claim from a second wallet |
|---|---|
| <img src="docs/readme/created.png" alt="Newly funded open bounty" width="100%"> | <img src="docs/readme/claimed.png" alt="Bounty claimed by a second wallet" width="100%"> |
| The contract holds the requester's BOT. | The bounty records an independent agent address. |

| 3. Release payment | 4. Record reputation |
|---|---|
| <img src="docs/readme/released.png" alt="Released bounty with completed settlement" width="100%"> | <img src="docs/readme/rated.png" alt="Agent profile showing a five star on-chain rating" width="100%"> |
| Escrow pays the recorded agent. | The released bounty contributes one permanent rating. |

### On-chain receipts

| Action | Testnet proof |
|---|---|
| Create bounty #1 | [Transaction `0x070f...c13b`](https://scan.bohr.life/tx/0x070fda6b70ede515cec7c1bd0d9dd05511bf2741c69b4d05c478e604c16ac13b) |
| Claim bounty #1 | [Transaction `0x0f10...a3fc`](https://scan.bohr.life/tx/0x0f10ed4087f8d120c6ed74cdc8921454f2bc62ac2ea9bfd375497b9a47c0a3fc) |
| Release bounty #1 | [Transaction `0xefd0...5bcd`](https://scan.bohr.life/tx/0xefd08a8a0df82e686771d40249b9c8b7b744f3be28634e7b285444821e8f5bcd) |
| Rate bounty #1 | [Transaction `0xb548...db5`](https://scan.bohr.life/tx/0xb548ab315093db60ff3a2fd29e43c6ea66e8fcec4d101efa59affe478afc4db5) |
| Refund bounty #2 | [Transaction `0x8fb3...b89`](https://scan.bohr.life/tx/0x8fb3ab738c812628123fcd56c7795703c760fd5a7748e9b8351efe92475bdb89) |

All demo transactions used disposable wallets and testnet BOT only.

## Product tour

| Wallet access ledger | Bounty dashboard |
|---|---|
| <img src="docs/readme/access-ledger.png" alt="Wallet, network, and access checks" width="100%"> | <img src="docs/readme/bounties.png" alt="Bounty dashboard with recent escrow states" width="100%"> |

| Create flow | Live activity |
|---|---|
| <img src="docs/readme/create.png" alt="Create bounty form" width="100%"> | <img src="docs/readme/activity.png" alt="On-chain escrow activity feed" width="100%"> |

| Agent profile | Refund branch |
|---|---|
| <img src="docs/readme/profile.png" alt="Agent reputation profile" width="100%"> | <img src="docs/readme/refunded.png" alt="Refunded bounty state" width="100%"> |

## Why Agent Escrow

- **Independent parties:** value moves between separate requester and agent wallets.
- **Explicit state:** every lifecycle transition is inspectable on-chain.
- **Recoverable failure paths:** open cancellation, missed-deadline refund, and mutual cancellation prevent permanent lockup.
- **Portable reputation:** ratings attach to agent addresses after successful settlement.
- **Small trust surface:** there is no application backend or off-chain ledger.

## V2 contract lifecycle

```text
Open -> Accepted -> Submitted -> Released
Open -> Cancelled
Accepted -> Refunded after a missed work deadline
Accepted or Submitted -> Cancelled after both parties approve
Submitted -> Released by requester, or finalized after review expires
```

V2 designates the agent at creation, starts the work clock at acceptance, records submission evidence, and gives the requester a bounded review period. This removes open claiming and unilateral post-acceptance refunds from the live V1 model.

### Contract reference

| Function | Caller | Result |
|---|---|---|
| `createBounty(agent, description, workDuration, reviewPeriod)` | Anyone, with BOT | Creates and funds a bounty for one designated agent. |
| `acceptBounty(id)` | Designated agent | Accepts the task and starts the work deadline. |
| `cancelOpenBounty(id)` | Requester | Cancels an unaccepted bounty and returns its principal. |
| `submitWork(id, submission)` | Designated agent | Records delivery evidence and starts requester review. |
| `release(id)` | Requester | Pays the agent after submission. |
| `finalize(id)` | Anyone after review deadline | Pays the agent when requester review expires. |
| `refundExpiredBounty(id)` | Requester after work deadline | Returns principal when accepted work was not submitted. |
| `setCancellationApproval(id, approved)` | Requester or agent | Settles a cancellation only after both parties approve. |
| `rateAgent(id, score)` | Requester after release | Records one score from 1 to 5 for the bounty. |
| `getAgentRatingSummary(agent)` | Anyone, read only | Returns total score and rating count. |
| `bounties(id)` | Anyone, read only | Returns the complete bounty record. |

## Security evidence

- Fund-moving paths update contract state before external value transfer.
- OpenZeppelin `ReentrancyGuard` protects cancellation, refund, release, and finalization paths.
- Role checks restrict acceptance, submission, release, refund, cancellation, and rating.
- Exact work and review deadline boundaries are covered by tests.
- Each released bounty can contribute at most one rating.
- The suite includes a malicious reentrant receiver and verifies that no state or funds are lost.

The contract is tested, not externally audited. Submission data proves that evidence was recorded before a deadline, not the subjective quality of the work.

## Architecture

| Layer | Implementation |
|---|---|
| Contract | Solidity `0.8.24`, OpenZeppelin Contracts, Hardhat 3 |
| Client | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Chain access | ethers.js 6, wallet provider, BOT Chain testnet RPC |
| State | Contract reads and event history, with no backend database |
| Hosting | Static GitHub Pages deployment with hash-based routing |

## Local development

```bash
npm install
npm test
npx hardhat compile

npm install --prefix frontend
npm run test:policy --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
npm run dev --prefix frontend
```

Deploy V2 to BOT Chain testnet:

```bash
cp .env.example .env
# Add a funded testnet wallet PRIVATE_KEY to .env
npx hardhat run scripts/deploy.js --network botchainTestnet
npx hardhat verify --network botchainTestnet <deployed-address>
```

The deploy script prints copy-ready `VITE_CONTRACT_ADDRESS` and `VITE_CONTRACT_DEPLOY_BLOCK` values. Put them in `frontend/.env.local`, then build the frontend. The app fails closed when either V2 value is missing, preventing the V2 ABI from being used against the legacy V1 address.

BOT Chain testnet uses chain ID `968`, RPC `https://rpc.bohr.life`, and explorer `https://scan.bohr.life`.

## Project documentation

- [Hackathon strategy and scored angle](HACKATHON.md)
- [Product definition](PRODUCT.md)
- [Design system](DESIGN.md)
- [Build plans and implementation records](docs/hackathon-build/)

If Agent Escrow is useful to your work, star the repository so more builders can find it.
