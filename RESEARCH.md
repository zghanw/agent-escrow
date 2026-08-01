# Agent Escrow Research Report

## Design and evaluation of deadline-bounded on-chain escrow for agent work on BOT Chain

**Report status:** Implemented, tested on BOT Chain testnet, and deployed to BOT Chain mainnet
**Live application:** [https://www.agent-escrow.online/](https://www.agent-escrow.online/)
**Verified mainnet contract:** [`0x9DC2e2cB2850680EC74Fd3A4c006B0982972F62B`](https://scan.botchain.ai/address/0x9DC2e2cB2850680EC74Fd3A4c006B0982972F62B#code)
**Network:** BOT Chain mainnet, chain ID `677` (development and settlement evidence were produced first on BOT Chain testnet, chain ID `968`, contract `0xf6C2Fb86E1f172c1aFddB665768827402C438592`)

## 1. Executive summary

Agent Escrow investigates a narrow question: how can two unrelated wallet holders exchange payment for digital work without trusting either party to behave after the work begins?

The implemented answer is a non-custodial application built around a Solidity state machine. A requester funds a bounty for one designated agent. The agent must accept and submit before a requester-defined work deadline. Once work is submitted, the requester can release payment immediately; if the requester becomes inactive, anyone can finalize payment after the review deadline. The requester can recover funds before acceptance, after missed work, or when both parties approve cancellation. Successful work can produce one on-chain rating for the agent address.

The project consists of:

- a Solidity `0.8.24` contract deployed and verified on BOT Chain mainnet, with the identical source proven earlier on BOT Chain testnet;
- a static React and TypeScript client that communicates directly with the chain through ethers.js;
- MetaMask connection and one-click BOT Chain network configuration;
- an event-backed activity feed, bounty lookup, recent-bounty view, indexed wallet history, transaction links, and reputation summaries;
- 16 passing Hardhat tests covering contract and deployment behavior;
- 26 passing frontend policy and ABI tests;
- two published end-to-end testnet settlement cycles with transaction receipts.

The prototype demonstrates that bounded deadlines can reduce the two central failure modes of informal agent work: an agent accepting payment terms but never delivering, and a requester receiving delivery but refusing to settle. It does not solve subjective disputes, identity verification, data confidentiality, or production governance. Those limitations define the boundary between a testnet prototype and a production escrow protocol.

## 2. Problem statement

Digital work between strangers normally depends on an intermediary, an established commercial relationship, or an informal promise. Removing the intermediary creates a bilateral trust problem:

1. The requester does not want to pay an unknown agent before receiving work.
2. The agent does not want to deliver work before payment is assured.
3. Either party may become unavailable after the agreement begins.
4. A third party needs evidence of what happened without depending on one party's private records.

A simple payment transaction cannot represent acceptance, delivery, review, cancellation, or missed deadlines. A simple deposit contract is also insufficient if one party can unilaterally reclaim or release funds after the other party has already acted.

Agent Escrow therefore treats the exchange as a finite state machine rather than a single transfer. Each state restricts who may act, which next states are legal, and where the locked BOT can move.

## 3. Research context and design motivation

The project focuses on wallet-address-based work relationships. “Agent” can mean an autonomous service with a wallet or a human-operated service represented by a wallet. The contract does not attempt to prove autonomy, personhood, skill, or legal identity. It provides a settlement primitive for two addresses that have already agreed on a task.

Three design observations shaped the implementation:

### 3.1 Payment assurance must begin before work

The requester deposits the complete bounty principal when creating the bounty. Acceptance therefore occurs against visible, already-locked funds rather than a promise to fund later.

### 3.2 Time must protect both roles

A single expiry favors one side. Agent Escrow uses two periods:

- **Work duration:** begins when the designated agent accepts. The agent must submit strictly before the resulting work deadline.
- **Review period:** begins when work is submitted. The requester may release during this period, and anyone may finalize once it expires.

This symmetry gives the requester a refund path after missed work and gives the agent a payment path after requester inactivity.

### 3.3 Public evidence should be derived, not asserted

The interface reads contract state, ratings, events, and bounty counts from BOT Chain. Explorer links expose the underlying contract and transactions. The application does not maintain a private database that could disagree with the chain.

## 4. Research questions and objectives

The implementation evaluates four questions:

1. Can a small smart contract represent a two-party work agreement without an administrator or application backend?
2. Can deadline rules prevent indefinite fund lock while avoiding unilateral cancellation after acceptance?
3. Can a static browser client make the complete lifecycle understandable and usable through a wallet?
4. Can public testnet evidence demonstrate that the designed lifecycle works end to end?

The project objectives were consequently:

- lock the complete payment principal at bounty creation;
- bind acceptance and submission to one designated agent;
- encode deterministic work and review deadlines;
- provide cancellation, refund, release, and timeout-finalization paths;
- expose all important transitions through events and explorer links;
- attach a bounded reputation signal to completed work;
- keep the frontend stateless beyond current wallet and interface state;
- fail closed when deployment configuration is absent or invalid;
- verify behavior with automated tests and live testnet transactions.

## 5. Requirements and threat model

### 5.1 Functional requirements

| Requirement | Implemented mechanism |
|---|---|
| Fund a task before work begins | `createBounty` is payable and rejects a zero payment. |
| Name the intended worker | Creation records a nonzero designated agent distinct from the requester. |
| Prevent unauthorized acceptance | Only the designated agent can call `acceptBounty`. |
| Bound delivery time | Acceptance sets `workDeadline = block.timestamp + workDuration`. |
| Record delivery evidence | The agent supplies a nonempty on-chain submission string. |
| Bound requester review | Submission sets `reviewDeadline = block.timestamp + reviewPeriod`. |
| Pay after approval | The requester calls `release` after submission. |
| Pay after requester inactivity | Anyone calls `finalize` at or after the review deadline. |
| Recover from missed work | The requester calls `refundExpiredBounty` at or after the work deadline. |
| Exit by agreement | Both parties can approve mutual cancellation while active. |
| Build address-based reputation | The requester can record one score from 1 to 5 after release. |

### 5.2 Assumed adversaries and failures

The design considers:

- an unrelated wallet attempting to accept, submit, release, refund, cancel, or rate;
- a requester attempting to reclaim funds after the agent has accepted but before the work deadline;
- an agent attempting to submit at or after the exact work deadline;
- a requester disappearing after work submission;
- a party changing its mind about mutual cancellation before the second approval arrives;
- a payment recipient attempting reentrant execution during a BOT transfer;
- an invalid frontend deployment address or missing deployment block;
- wallet rejection, network mismatch, RPC failure, and stale page state.

### 5.3 Explicitly unaddressed threats

The prototype does not determine whether submitted work is correct, original, safe, or complete. It does not verify off-chain identities, encrypt task data, moderate content, resolve subjective disputes, protect users from compromised wallets, or provide legal enforcement. The contract is tested but has not received an independent security audit.

## 6. Protocol and state-machine design

The contract defines six states:

| Code | State | Meaning |
|---:|---|---|
| `0` | `Open` | Funded and waiting for the designated agent. |
| `1` | `Accepted` | Agent accepted; work deadline is active. |
| `2` | `Submitted` | Delivery evidence recorded; review deadline is active. |
| `3` | `Released` | Principal paid to the agent. Terminal. |
| `4` | `Refunded` | Principal returned after missed work. Terminal. |
| `5` | `Cancelled` | Principal returned before acceptance or after mutual approval. Terminal. |

### 6.1 Transition diagram

```text
                              requester releases
                         +----------------------------+
                         |                            v
Open ----agent accepts----> Accepted ----agent submits----> Submitted ----> Released
 |                            |                              |       ^
 |                            |                              |       |
 | requester cancels          | work deadline reached        |       +-- anyone finalizes
 |                            |                              |           after review deadline
 v                            v                              |
Cancelled                  Refunded                         |
                               ^                            |
                               |                            |
                               +-- principal to requester   |
                                                            |
Accepted or Submitted --both parties approve cancellation--+
                         |
                         v
                      Cancelled
```

Mutual cancellation always returns the principal to the requester. It is available only in `Accepted` or `Submitted`, and either party may revoke its own approval before both approvals are simultaneously true.

### 6.2 Role and action matrix

| Operation | Allowed caller | Required state or time | Result |
|---|---|---|---|
| `createBounty` | Any address funding with BOT | Valid agent and positive durations | Creates `Open` bounty. |
| `acceptBounty` | Designated agent | `Open` | Sets `Accepted` and work deadline. |
| `cancelOpenBounty` | Requester | `Open` | Sets `Cancelled`; returns principal. |
| `submitWork` | Designated agent | `Accepted`, strictly before work deadline | Sets `Submitted` and review deadline. |
| `release` | Requester | `Submitted` | Sets `Released`; pays agent. |
| `finalize` | Any address | `Submitted`, at or after review deadline | Sets `Released`; pays agent. |
| `refundExpiredBounty` | Requester | `Accepted`, at or after work deadline | Sets `Refunded`; returns principal. |
| `setCancellationApproval` | Requester or agent | `Accepted` or `Submitted` | Records or revokes approval; both approvals cancel. |
| `rateAgent` | Requester | `Released`, bounty not previously rated | Records one score from 1 to 5. |
| `bounties` | Any address, read only | Existing bounty ID | Returns complete bounty record. |
| `getAgentRatingSummary` | Any address, read only | Any agent address | Returns total score and count. |

### 6.3 Boundary semantics

The exact inequalities are intentional:

- submission is valid only while `block.timestamp < workDeadline`;
- refund is valid when `block.timestamp >= workDeadline`;
- timeout finalization is valid when `block.timestamp >= reviewDeadline`.

There is therefore no timestamp at which both timely submission and missed-work refund are valid. At the work deadline, submission closes and refund opens. The requester may release a submitted bounty before or after the review deadline; the deadline adds a permissionless fallback rather than removing requester authority.

## 7. Smart-contract architecture

The [AgentEscrow contract](contracts/AgentEscrow.sol) stores each bounty in a private mapping keyed by an incrementing ID. The externally visible `bounties(id)` getter returns the complete struct after checking that the ID is below `bountyCount`.

Each bounty records:

- requester and designated agent addresses;
- locked amount;
- task description and submission evidence;
- current status;
- creation, work-deadline, and review-deadline timestamps;
- configured work and review durations;
- each party's current cancellation approval.

Ratings are stored per agent as arrays of requester, bounty ID, score, and timestamp records. A separate `bountyRated` mapping enforces one rating per released bounty.

Eight event types expose lifecycle and reputation changes:

1. `BountyCreated`
2. `BountyAccepted`
3. `WorkSubmitted`
4. `BountyReleased`
5. `BountyRefunded`
6. `BountyCancelled`
7. `CancellationApprovalUpdated`
8. `AgentRated`

The contract has no owner role, administrator, upgrade function, fee recipient, pause switch, or backend dependency. This reduces privileged control but also removes emergency intervention. A production deployment would need to decide whether immutability or governed upgradeability better fits its threat model.

## 8. Frontend and wallet architecture

The frontend is a static React 19 application built with TypeScript and Vite. It uses ethers.js 6 to communicate directly with BOT Chain and a hash router so client-side routes work on static hosting.

```text
MetaMask wallet
      |
      | EIP-1193 requests and signed transactions
      v
React application ---- ethers.js ---- BOT Chain testnet RPC
      |                                      |
      |                                      +-- contract reads and transactions
      |                                      +-- historical and live events
      v
GitHub Pages static assets                 BOT Chain Explorer
```

### 8.1 Wallet and network flow

The application:

- detects an injected `window.ethereum` provider;
- requests or restores authorized accounts;
- creates an ethers `BrowserProvider` in network-flexible mode;
- reads `eth_chainId` directly to avoid stale chain state during switching;
- requests `wallet_switchEthereumChain` for chain ID `0x2A5` (BOT Chain mainnet, `677`);
- falls back to `wallet_addEthereumChain` when BOT Chain is unknown to the wallet;
- reacts to account and chain changes;
- surfaces wallet rejection and pending-request errors in user-facing language.

### 8.2 Fail-closed deployment configuration

The frontend requires both:

- `VITE_CONTRACT_ADDRESS`, matching a 40-hex-character Ethereum address; and
- `VITE_CONTRACT_DEPLOY_BLOCK`, parsed as a positive safe integer.

If either value is invalid, the address becomes the zero address, `CONTRACT_CONFIGURED` is false, transaction controls are disabled, and the interface reports the configuration problem. This prevents a current ABI from silently targeting an unrelated or retired contract.

### 8.3 On-chain state projection

The browser does not maintain a separate application ledger. It reads:

- the ten most recent bounty records;
- any selected bounty by ID;
- the connected address's rating summary;
- whether the selected bounty has already been rated;
- up to 25 recent contract events;
- new lifecycle events through live listeners;
- indexed requester and agent history, settlement totals, and native BOT balance for the connected wallet or any looked-up address.

Historical event reads begin at the configured deployment block and use ranges of at most 4,500 blocks to stay below the public RPC's observed log-query limit. Failed historical chunks are treated as best-effort display failures; they do not change contract state or transaction availability.

### 8.4 Frontend policy mirroring

The pure `availableBountyActions` function maps status, signer role, cancellation approvals, and the current time to visible actions. Its boundary rules mirror the Solidity contract and are covered by frontend policy tests. The contract remains authoritative; the frontend policy improves usability and prevents presenting actions that are expected to revert.

## 9. Security controls and trust boundaries

### 9.1 Authorization

Each fund-moving or state-sensitive operation checks the expected role and state. Unrelated addresses cannot accept, submit, cancel, release, refund, approve cancellation, or rate. Permissionless finalization is deliberately narrow: it becomes available only after submitted work has waited through the complete review period, and it can only pay the designated agent.

### 9.2 Reentrancy protection and transfer ordering

Every function that transfers BOT is protected with OpenZeppelin `ReentrancyGuard`. Before an external call, the contract moves the bounty into its terminal state. If the call fails, the transaction reverts, restoring the prior state and funds atomically.

Protected transfer paths include:

- open-bounty cancellation;
- mutual cancellation;
- requester refund after missed work;
- requester release;
- timeout finalization.

The test suite includes a malicious requester contract and confirms that a reentrant cancellation attempt leaves no created bounty and no trapped principal.

### 9.3 Deadline safety

Contract tests explicitly move simulated block time to the exact work and review deadlines. They verify that late submission fails, refund opens at the work deadline, early finalization fails, and finalization opens at the review deadline.

### 9.4 Reputation constraints

Ratings are limited to the requester of a released bounty, one rating per bounty, and integer scores from 1 through 5. This prevents arbitrary addresses from rating an agent and prevents repeated ratings from a single transaction relationship. It does not prevent one requester from creating multiple genuine funded bounties with the same agent.

### 9.5 Remaining trust boundaries

The contract trusts wallet ownership and on-chain timestamps. It does not validate the meaning of description or submission strings. Users must independently evaluate deliverables and protect wallet keys. Public RPC availability affects read-only interface features, while network consensus and contract state remain authoritative.

## 10. Testing and verification methodology

### 10.1 Contract and deployment tests

The Hardhat suite contains 16 passing tests:

- 15 lifecycle, authorization, deadline, transfer, reentrancy, and rating tests;
- 1 deployment-output test confirming copy-ready frontend configuration.

The tested behaviors include:

- complete creation data and timing terms;
- invalid agent and duration rejection;
- designated-agent-only acceptance;
- full-principal open cancellation;
- exact missed-work refund boundary;
- submission requirements and role restrictions;
- requester release and agent balance increase;
- permissionless finalization after review;
- mutual cancellation in accepted and submitted states;
- cancellation-approval revocation;
- reentrant receiver behavior;
- released-only, requester-only, one-time ratings bounded to 1–5;
- rating total and count aggregation.

### 10.2 Frontend tests

The frontend suite contains 26 passing tests across six files:

- ABI tests verify every expected V2 function and every bounty struct field;
- policy tests verify role-specific actions, exact deadline changes, terminal-state behavior, cancellation approval and revocation, and all bounty-creation validations;
- activity-feed tests verify event deduplication, ordering, and the feed size limit;
- a bounty-read test verifies the one-retry behavior for a transient not-found response;
- wallet-history tests verify address normalization, role filtering, totals, BOT formatting, and pagination;
- wallet-history-reader tests verify indexed chain queries, RPC-safe block-range chunking, and bounded hydration.

TypeScript compilation, Vite production builds, and Oxlint provide additional static verification. Lint currently reports non-blocking fast-refresh warnings in shared component files; these warnings do not indicate contract or settlement failures.

### 10.3 Evidence model

Automated tests establish expected behavior in a local deterministic environment. Testnet transactions establish that deployment, wallet signing, chain execution, event indexing, and the browser integration work together. Neither form of evidence replaces independent security review.

## 11. Deployment and on-chain evidence

The current application is served from [agent-escrow.online](https://www.agent-escrow.online/) through GitHub Pages. Pushes to `master` trigger a locked-dependency frontend build, upload the generated static artifact, and deploy it to the GitHub Pages environment.

The frontend now points at the mainnet contract:

```text
0x9DC2e2cB2850680EC74Fd3A4c006B0982972F62B
```

| Field | Value |
|---|---|
| Contract address | `0x9DC2e2cB2850680EC74Fd3A4c006B0982972F62B` |
| Network | BOT Chain mainnet, chain ID `677` |
| Deployer | `0x1221C500Dfd0D3E477ed741a849edEa303d689Ca` |
| Deployment transaction | `0x9fc27618bd9f4475fd0583a75cd030764e5ef49e72ae07f19a6f95ebd4c13b56` |
| Deployment block | `18167177` |
| Deployment date | `2026-08-01` |
| Compiler version | Solidity `0.8.24` |

No bounty has been created on the mainnet contract yet. The settlement cycles below were produced on the earlier BOT Chain testnet deployment during development and remain the published evidence for end-to-end execution mechanics.

### 11.1 Prior BOT Chain testnet deployment

The same source was first deployed and verified on BOT Chain testnet at:

```text
0xf6C2Fb86E1f172c1aFddB665768827402C438592
```

### 11.2 Published settlement cycle: bounty #1

| Transition | BOT Chain testnet transaction |
|---|---|
| Create and fund `0.001 BOT` bounty | [`0x89c3…50d4`](https://scan.bohr.life/tx/0x89c3b37b8df0f7f3f3543a3558b378bbabd085f33ac4be0be6b9c0827cb350d4) |
| Designated agent accepts | [`0xb0ed…34fc`](https://scan.bohr.life/tx/0xb0ed17ea6d82dd62c5971cb971702f7aacc38e1af68bd0cf367e9bde811434fc) |
| Agent submits delivery evidence | [`0x5936…fb15`](https://scan.bohr.life/tx/0x593667572a0a6eac7c98e0965a53f0c69f562a51ac563c8ec338fdef233fb15f) |
| Requester releases payment | [`0xd31c…e994`](https://scan.bohr.life/tx/0xd31c3b89e3993ae1234b326f2eec04a0c56780fe86f5b063b6717460999e2994) |
| Requester records `5 / 5` rating | [`0x5c80…aab9`](https://scan.bohr.life/tx/0x5c8046673819a6a99b3ddaba57b73ff2bf07e5abd4ae2226e8c11a720702aab9) |

### 11.3 Published settlement cycle: bounty #0

| Transition | BOT Chain testnet transaction |
|---|---|
| Create and fund bounty | [`0xf3fc…1602`](https://scan.bohr.life/tx/0xf3fcbeedd32f79b8483d19a041368099bc68a8abe97da5eadba09c9c5e661602) |
| Designated agent accepts | [`0x4557…4d0`](https://scan.bohr.life/tx/0x45571dae8b2dab7041385cef6ddd22aaad0ad0d8dc553c17ddc1500541fc84d0) |
| Agent submits delivery evidence | [`0x2e59…6517`](https://scan.bohr.life/tx/0x2e59661415a9581fee1e20c7381e9d30e91735cf93ab3834e4af6ee6599f6517) |
| Requester releases payment | [`0x76d1…38a0`](https://scan.bohr.life/tx/0x76d1b4f14f03e7d01ff4436f158a4e95ebaf210b0cfcd2f1911ea70ac58838a0) |
| Requester records rating | [`0xa00a…8020`](https://scan.bohr.life/tx/0xa00ad9e09dbf3b6c924eec43d2a06202ca79a064ffaef33bc1ea074248168020) |

These transactions used disposable wallets and testnet BOT. They demonstrate execution mechanics, not commercial adoption or mainnet economic security.

## 12. User-experience and visual-system rationale

The interface uses a “trading terminal” visual model: near-black surfaces, a single gold signal color, monospace operational text, bracketed panels, and explicit status indicators. The design goal is to make fund state feel monitored and inspectable rather than decorative.

The main interface separates five tasks:

- **Bounties:** recent records, lookup, state visualization, and permitted actions;
- **Create:** designated-agent address, BOT amount, description, work duration, and review period;
- **Activity:** historical and live event feed;
- **Wallets:** read-only requester and agent history, settlement totals, and rating lookup for any valid address;
- **Profile:** the same history view applied automatically to the connected wallet.

Three surfaces reduce cold-start uncertainty:

1. The landing verification panel links the contract, reports verification, and reads the live bounty count without requiring a wallet.
2. The wallet gate separates wallet connection, network configuration, and application access.
3. The dashboard maps contract state to status trackers, transaction messages, explorer links, and action availability.

The animated vault is driven by the selected bounty's actual status rather than an independent timer. Reduced-motion preferences suppress ambient movement. These choices keep the visual layer subordinate to on-chain state.

## 13. Results and evaluation

The prototype met its core objectives:

| Objective | Result |
|---|---|
| Lock payment before work | Implemented and exercised on testnet. |
| Restrict work to a designated agent | Enforced by contract and tests. |
| Protect requester from missed work | Deadline refund implemented and boundary-tested. |
| Protect agent from requester inactivity | Permissionless post-review finalization implemented and tested. |
| Prevent unilateral active cancellation | Mutual approval required after acceptance. |
| Provide public lifecycle evidence | Contract events, explorer links, screenshots, and two receipt sets published. |
| Provide reputation signal | One requester rating per released bounty implemented and exercised. |
| Avoid backend state divergence | Static client reads and writes directly to BOT Chain. |
| Support a cold wallet flow | MetaMask detection and BOT Chain add/switch flow implemented. |

The result is best understood as a working protocol prototype. It demonstrates deterministic settlement and browser usability on a public test network. It does not establish production safety, legal sufficiency, market demand, or resistance to every economic attack.

## 14. Limitations

### 14.1 No subjective dispute resolution

Submission proves only that a nonempty string was recorded before a deadline. The contract cannot judge quality. Before the review deadline, a dissatisfied requester can withhold voluntary release, but cannot unilaterally refund submitted work. The available exits are release, timeout finalization, or mutual cancellation.

### 14.2 Public task and submission data

Descriptions and submission strings are stored on-chain. Users must not place confidential data, secrets, private links, or personal information in these fields. A production design should store compact content identifiers and define a privacy-preserving evidence strategy.

### 14.3 Unbounded string and rating growth

The contract does not cap description or submission length, so unusually large strings increase transaction gas. Rating summaries iterate over every stored rating for an agent, making read cost grow linearly. Pagination or aggregate counters would scale better.

### 14.4 No protocol fee or treasury

The deployed contract transfers the complete principal to the agent on release and the complete principal back to the requester on cancellation or refund. No fee is charged.

### 14.5 No upgrade or emergency control

There is no administrator, pause function, or proxy. This removes privileged intervention but means defects cannot be patched in place. Users must choose whether to interact with a particular deployed address.

### 14.6 Wallet and RPC scope

The browser flow targets injected MetaMask-compatible providers and BOT Chain testnet. Public RPC degradation can hide live counts or activity history. Wallet transaction execution remains subject to provider behavior, gas availability, and network conditions.

### 14.7 Mainnet deployed, not yet exercised

The contract is deployed and verified on BOT Chain mainnet, but no bounty has been created there yet. The published settlement cycles used testnet BOT, which has no monetary value. They validate integration but do not yet reproduce the incentives, liquidity, congestion, adversaries, or operational responsibilities of a real mainnet settlement.

## 15. Future work

Future work should follow the risks identified above rather than add unrelated features:

1. **Independent security review:** contract audit, invariant testing, fuzzing, and static analysis before real-value use.
2. **Evidence design:** bounded content identifiers, clear permitted formats, optional encrypted off-chain delivery, and privacy guidance.
3. **Dispute policy:** carefully scoped arbitration or bonded adjudication without undermining timeout guarantees.
4. **Scalable reputation:** aggregate counters, pagination, sybil-resistance research, and context-aware ratings.
5. **Discovery layer:** optional indexing for searchable bounties without making the indexer authoritative for settlement.
6. **Economic model:** explicit fee rules, recipient governance, withdrawal safety, and transparent UI before enabling fees.
7. **Operational resilience:** multiple RPC endpoints, monitoring, deployment checks, and incident documentation.
8. **Mainnet settlement evidence:** the contract is deployed and verified on BOT Chain mainnet; a real, small-value settlement cycle and updated on-chain evidence remain outstanding. Independent audit findings, if any, should be resolved before larger-value use.

These are proposals, not features of the current deployment.

## 16. Reproducibility and local development

### 16.1 Prerequisites

- Node.js compatible with the locked dependencies;
- npm;
- MetaMask or another compatible injected wallet for browser interaction;
- testnet BOT only when deploying or sending testnet transactions.

### 16.2 Install and verify the contract

```bash
npm install
npm test
npx hardhat compile
```

The expected contract-suite result is 16 passing tests.

### 16.3 Install and verify the frontend

```bash
npm install --prefix frontend
npm run test:policy --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
npm run dev --prefix frontend
```

The policy suite should report 7 passing tests. The development server prints the local URL after startup.

### 16.4 Deploy to BOT Chain mainnet or testnet

Create a local `.env` from the provided example and set a funded deployment key. Never commit this value.

```bash
cp .env.example .env
npx hardhat run scripts/deploy.js --network botchainMainnet
npx hardhat verify --network botchainMainnet <deployed-address>
```

Replace `botchainMainnet` with `botchainTestnet` for a development deployment using disposable testnet BOT.

The deployment script prints the address, explorer link, and two frontend variables:

```text
VITE_CONTRACT_ADDRESS=<deployed-address>
VITE_CONTRACT_DEPLOY_BLOCK=<deployment-block>
```

Place those values in `frontend/.env.local`, rebuild the frontend, and confirm the application shows the intended address before signing transactions.

### 16.5 Network reference

| Field | BOT Chain mainnet | BOT Chain testnet |
|---|---|---|
| Chain ID | `677` (`0x2A5`) | `968` (`0x3C8`) |
| Native currency | BOT, 18 decimals | BOT, 18 decimals |
| RPC | `https://rpc.botchain.ai` | `https://rpc.bohr.life` |
| Explorer | `https://scan.botchain.ai` | `https://scan.bohr.life` |

## 17. Conclusion

Agent Escrow demonstrates a small, inspectable settlement protocol for work between two wallet addresses. Its contribution is not a claim that smart contracts can judge work. Instead, it shows that funding, designation, acceptance, delivery evidence, review, timeout settlement, refunds, mutual cancellation, and reputation can be represented as explicit rules with public evidence.

The testnet deployment and two complete settlement cycles support the central result: deadline-bounded escrow can reduce both non-delivery risk and requester-inactivity risk without an application custodian. The same source is now deployed and verified on BOT Chain mainnet. The remaining limitations include subjective disputes, public data, scaling, audit coverage, and a real mainnet settlement cycle. They are substantial and intentionally visible.

For a concise demonstration and screenshots, return to the [project README](README.md). For executable behavior, inspect the [Solidity contract](contracts/AgentEscrow.sol) and [test suite](test/AgentEscrow.test.js).
