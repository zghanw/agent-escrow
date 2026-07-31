# Designated-Agent Escrow V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the requester-controlled claimed refund with a designated-agent escrow that has symmetric work/review timeouts, submission evidence, and mutual cancellation without a mandatory administrator.

**Architecture:** `AgentEscrow` becomes a six-state contract: `Open`, `Accepted`, `Submitted`, `Released`, `Refunded`, and `Cancelled`. The requester designates the agent and durations at creation; the agent accepts, submits an evidence URI/hash, and is paid either by requester release or permissionless timeout finalization. The frontend consumes the V2 ABI only when a new deployment address and deployment block are configured, so it cannot accidentally send V2 calls to immutable V1.

**Tech Stack:** Solidity 0.8.24, OpenZeppelin `ReentrancyGuard`, Hardhat 3, ethers 6, React 19, TypeScript 6, Vite 8, Node 24 test runner

## Global Constraints

- Keep the protocol administrator-free: no owner, privileged resolver, mandatory arbitration, bond, or milestone machinery.
- Preserve direct BOT escrow funding and `rateAgent` reputation after successful release.
- The requester may cancel only while `Open`, recover after an accepted agent misses the work deadline, receive a mutually approved cancellation, or receive a later optional resolver outcome outside this scope.
- Once work is submitted, requester silence resolves to the agent after the configured review period through a permissionless `finalize` transaction.
- Existing V1 at `0x956E373A71dA8836FF6a5d5Fe5A5e2d05AF55Cc1` is immutable and remains untouched; V2 deployment is a separate explicit operation.
- Never commit, overwrite, or otherwise modify the pre-existing untracked `docs/superpowers/plans/2026-07-31-readme-demo-gallery.md` file.
- Use checks-effects-interactions and `nonReentrant` on every path that sends BOT.
- Use real contract integration tests; do not mock the escrow.

---

### Task 1: Designated creation and acceptance

**Files:**
- Modify: `test/AgentEscrow.test.js`
- Modify: `contracts/AgentEscrow.sol`
- Modify: `contracts/test/MaliciousRequester.sol` (compile-compatible V2 creation call; reentrancy behavior is rewritten in Task 3)

**Interfaces:**
- Produces: `createBounty(address designatedAgent, string description, uint256 workDuration, uint256 reviewPeriod) payable returns (uint256)`
- Produces: `acceptBounty(uint256 id)`
- Produces: `Status.Open = 0`, `Status.Accepted = 1`
- Produces: bounty fields `requester`, `agent`, `amount`, `description`, `submission`, `status`, `createdAt`, `workDeadline`, `reviewDeadline`, `workDuration`, `reviewPeriod`, `requesterCancellationApproved`, `agentCancellationApproved`

- [x] **Step 1: Write failing creation and authorization tests**

  Add tests that create a 1 BOT bounty for `agent.address`, assert every stored parameter, reject zero/self agent addresses and zero durations, reject a third-party acceptance, and accept only from the designated agent. The successful acceptance must set `status` to `1` and `workDeadline` to the acceptance block timestamp plus the configured duration.

- [x] **Step 2: Run the focused tests and verify RED**

  Run: `npx hardhat test test/AgentEscrow.test.js --grep "designated|accept"`

  Expected: FAIL because the existing `createBounty(string)` and `claimBounty` API cannot satisfy the V2 calls.

- [x] **Step 3: Implement the minimal Open-to-Accepted state transition**

  Add `bountyExists(id)` validation, the expanded `Bounty` struct, V2 `BountyCreated` event, and `BountyAccepted`. `acceptBounty` must require the designated agent and set `workDeadline = block.timestamp + workDuration`; it must not move BOT.

- [x] **Step 4: Run the focused tests and verify GREEN**

  Run: `npx hardhat test test/AgentEscrow.test.js --grep "designated|accept"`

  Expected: all focused tests PASS.

- [x] **Step 5: Commit the independently working transition**

  Stage only `contracts/AgentEscrow.sol` and `test/AgentEscrow.test.js`, then commit `feat: add designated agent acceptance`.

### Task 2: Symmetric deadlines and settlement

**Files:**
- Modify: `test/AgentEscrow.test.js`
- Modify: `contracts/AgentEscrow.sol`

**Interfaces:**
- Consumes: Task 1 bounty fields and states
- Produces: `cancelOpenBounty(uint256 id)`
- Produces: `refundExpiredBounty(uint256 id)`
- Produces: `submitWork(uint256 id, string submission)`
- Produces: `release(uint256 id)`
- Produces: `finalize(uint256 id)`
- Produces: `Status.Submitted = 2`, `Status.Released = 3`, `Status.Refunded = 4`, `Status.Cancelled = 5`

- [x] **Step 1: Write a failing open-cancellation test**

  Assert that the requester recovers the full principal before acceptance, the status becomes `Cancelled`, a non-requester is rejected, and a cancelled bounty cannot be accepted.

- [x] **Step 2: Verify RED, implement `cancelOpenBounty`, then verify GREEN**

  Run the test by its exact Mocha title. Implement CEI ordering and a guarded BOT transfer, then rerun until it passes.

- [x] **Step 3: Write failing missed-deadline tests**

  Assert that `refundExpiredBounty` rejects calls before the work deadline and rejects non-requesters, then advances time to the deadline and asserts a full principal refund and `Refunded` status. Also assert the requester has no generic refund path after acceptance.

- [x] **Step 4: Verify RED, implement `refundExpiredBounty`, then verify GREEN**

  Use `network.provider.send("evm_setNextBlockTimestamp", [Number(deadline)])` followed by a mined transaction. Require `block.timestamp >= workDeadline` and `Status.Accepted`.

- [x] **Step 5: Write failing submission and requester-release tests**

  Assert that only the designated agent may submit a non-empty evidence string before the work deadline, submission stores the exact string, sets `Submitted`, and sets `reviewDeadline = submission block timestamp + reviewPeriod`. Assert requester release transfers the full principal and produces `Released`.

- [x] **Step 6: Verify RED, implement `submitWork` and `release`, then verify GREEN**

  Run the focused submission/release tests around the real contract until all pass.

- [x] **Step 7: Write failing timeout-finalization tests**

  Assert `finalize` reverts before `reviewDeadline`, succeeds from an unrelated wallet at the deadline, transfers the full principal to the designated agent, and produces `Released`.

- [x] **Step 8: Verify RED, implement `finalize`, then verify GREEN**

  The finalizer never receives funds; settlement always targets `bounty.agent`.

- [x] **Step 9: Commit the independently working settlement engine**

  Stage only the contract and its tests, then commit `feat: add escrow deadlines and optimistic settlement`.

### Task 3: Mutual cancellation, reentrancy, and reputation

**Files:**
- Modify: `test/AgentEscrow.test.js`
- Modify: `contracts/AgentEscrow.sol`
- Modify: `contracts/test/MaliciousRequester.sol`

**Interfaces:**
- Produces: `setCancellationApproval(uint256 id, bool approved)`
- Produces: `CancellationApprovalUpdated(uint256 indexed id, address indexed party, bool approved)`
- Produces: `BountyCancelled(uint256 indexed id, address indexed requester, uint256 amount, bool mutual)`
- Preserves: `rateAgent`, `agentRatings`, `bountyRated`, `getAgentRatingSummary`

- [x] **Step 1: Write failing mutual-cancellation tests**

  Assert that requester or agent may approve/revoke cancellation during `Accepted` or `Submitted`, unrelated wallets are rejected, one approval moves no BOT, and the second approval atomically sets `Cancelled` and returns principal to the requester.

- [x] **Step 2: Verify RED, implement cancellation approvals, then verify GREEN**

  Store approvals in the bounty, emit each update, and settle only when both booleans are true.

- [x] **Step 3: Rewrite the malicious receiver regression test before its helper**

  Test a malicious requester that creates a V2 bounty and calls `cancelOpenBounty`, then attempts to reenter the same function from `receive()`. Assert the outer transaction reverts, `bountyCount` remains zero, and the escrow balance remains zero.

- [x] **Step 4: Verify RED, update `MaliciousRequester`, then verify GREEN**

  Replace `createAndRefund` with `createAndCancel(address agent, string description, uint256 workDuration, uint256 reviewPeriod)` and reenter `cancelOpenBounty`.

- [x] **Step 5: Update reputation tests for Submitted-to-Released**

  A rating fixture must create, accept, submit, and release. Preserve tests for requester-only ratings, 1–5 scores, one rating per bounty, and aggregate summary.

- [x] **Step 6: Run the complete contract suite**

  Run: `npm test`

  Expected: all V2 lifecycle, access-control, timeout, reentrancy, and reputation tests PASS.

- [x] **Step 7: Commit the completed V2 contract**

  Stage the three task files, then commit `test: cover escrow cancellation and reputation`.

### Task 4: Frontend policy with real behavior tests

**Files:**
- Create: `frontend/src/lib/escrowPolicy.ts`
- Create: `frontend/test/escrowPolicy.test.mjs`
- Modify: `frontend/package.json`

**Interfaces:**
- Produces: `BountyAction = "accept" | "cancelOpen" | "submit" | "refundExpired" | "release" | "finalize" | "approveCancellation" | "revokeCancellation"`
- Produces: `availableBountyActions(bounty, signerAddress, nowSeconds): BountyAction[]`
- Produces: `validateBountyDraft(draft, requesterAddress): string | null`

- [x] **Step 1: Write failing Node policy tests**

  Use `node:test` and `node:assert/strict` against the real TypeScript module. Cover designated-agent-only acceptance, requester-only open cancellation, agent submission before deadline, requester timeout refund at the deadline, requester release after submission, permissionless finalization at review deadline, party-only cancellation approval/revocation, and validation of agent address, self-designation, amount, and positive durations.

- [x] **Step 2: Run policy tests and verify RED**

  Run: `npm run test:policy --prefix frontend`

  Expected: FAIL because `escrowPolicy.ts` does not exist.

- [x] **Step 3: Implement the minimal pure policy module**

  Keep the module free of React and browser globals. Use `ethers.isAddress` and case-insensitive address equality. Return literal action arrays consumed by the UI.

- [x] **Step 4: Run policy tests and verify GREEN**

  Run: `npm run test:policy --prefix frontend`

  Expected: all policy tests PASS.

- [x] **Step 5: Commit the policy layer**

  Stage the module, its tests, `frontend/package.json`, and the mechanically updated lockfile if npm changes it; commit `test: define escrow frontend action policy`.

### Task 5: Integrate V2 ABI, transactions, and dashboard controls

**Files:**
- Modify: `frontend/src/lib/contract.ts`
- Modify: `frontend/src/hooks/useEscrow.ts`
- Modify: `frontend/src/components/dashboard/CreateBountyPanel.tsx`
- Modify: `frontend/src/components/dashboard/BountyDetailPanel.tsx`
- Modify: `frontend/src/components/dashboard/StatusTracker.tsx`
- Modify: `frontend/src/components/dashboard/Vault.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/landing/FlowPreview.tsx`
- Modify: `frontend/src/components/landing/Hero.tsx`
- Create: `frontend/.env.example`

**Interfaces:**
- Consumes: Task 3 contract ABI and Task 4 policy actions
- Produces: environment-backed `VITE_CONTRACT_ADDRESS` and `VITE_CONTRACT_DEPLOY_BLOCK`
- Produces: hook actions `accept`, `cancelOpen`, `submit`, `refundExpired`, `release`, `finalize`, `setCancellationApproval`, and `rate`

- [x] **Step 1: Compile the contract and extract its ABI**

  Run: `npx hardhat compile`

  Copy the generated `AgentEscrow` ABI into `contract.ts`; replace status names with `Open`, `Accepted`, `Submitted`, `Released`, `Refunded`, `Cancelled`.

- [x] **Step 2: Fail closed when V2 is not deployed**

  Read address and deployment block from Vite environment variables. Export a configuration flag, avoid constructing an ethers contract at the zero address, disable writes, and show a clear dashboard banner that V2 deployment configuration is required.

- [x] **Step 3: Update contract reads and event feed**

  Load work/review timestamps, submission evidence, cancellation approvals, and the designated agent. Format `BountyAccepted`, `WorkSubmitted`, `BountyReleased`, `BountyRefunded`, `BountyCancelled`, cancellation approval, and rating events.

- [x] **Step 4: Update creation and action transactions**

  Creation collects designated agent, amount, work duration in hours, and review duration in hours, converts durations to seconds, validates through `validateBountyDraft`, and calls V2 `createBounty`. Detail actions call only the methods allowed by `availableBountyActions`.

- [x] **Step 5: Update the dashboard state presentation**

  Show the designated agent, work deadline, review deadline, submission evidence, and cancellation approvals. Replace the old three-step tracker and old claimed/refunded animation mapping with the V2 states. Remove every `Refund Instead` path.

- [x] **Step 6: Update product copy for designated acceptance and submission**

  The landing/dashboard copy must describe `Fund → Accept → Submit → Release`, symmetric deadlines, and requester-silence finalization without claiming automated execution.

- [x] **Step 7: Run frontend policy, lint, and production build**

  Run: `npm run test:policy --prefix frontend`

  Run: `npm run lint --prefix frontend`

  Run: `npm run build --prefix frontend`

  Expected: every command exits 0 with no TypeScript or lint errors.

- [x] **Step 8: Commit the V2 frontend integration**

  Stage only the listed frontend files and commit `feat: integrate designated-agent escrow v2`.

### Task 6: Deployment tooling, documentation, and final verification

**Files:**
- Modify: `scripts/deploy.js`
- Create: `scripts/deploymentOutput.js`
- Create: `test/DeploymentOutput.test.js`
- Modify: `.env.example`
- Modify: `.github/workflows/deploy.yml`
- Modify: `README.md`
- Modify: `PRODUCT.md`
- Modify: `docs/superpowers/plans/2026-08-01-designated-agent-escrow-v2.md`

**Interfaces:**
- Consumes: compiled V2 contract and frontend environment keys
- Produces: deployment output for contract address and receipt block number

- [x] **Step 1: Improve deployment handoff output**

  After deployment, wait for the deployment transaction receipt and print `VITE_CONTRACT_ADDRESS=<address>` plus `VITE_CONTRACT_DEPLOY_BLOCK=<blockNumber>` for direct frontend configuration. Do not write secrets or deploy automatically.

- [x] **Step 2: Update project documentation**

  Document the V2 state machine, role permissions, deadline semantics, residual subjective-quality risk, test commands, and explicit deployment/configuration steps. Clearly label the existing address as V1 rather than claiming V2 is live.

- [x] **Step 3: Mark every completed plan checkbox**

  Update this file only for steps whose commands and behavior were actually observed.

- [x] **Step 4: Run fresh full verification**

  Run: `npm test`

  Run: `npm run test:policy --prefix frontend`

  Run: `npm run lint --prefix frontend`

  Run: `npm run build --prefix frontend`

  Run: `git diff --check`

  Expected: all commands exit 0; contract tests report zero failures; frontend tests report zero failures; lint/build report no errors; diff check prints nothing.

- [x] **Step 5: Review the final diff and configuration safety**

  Confirm there is no private key, no hardcoded V2 placeholder address, no V2 ABI pointed at V1, no requester refund path from `Accepted` or `Submitted`, and no modifications to the pre-existing untracked plan.

- [x] **Step 6: Commit documentation and deployment tooling**

  Stage only Task 6 files and commit `docs: document designated-agent escrow v2`.
