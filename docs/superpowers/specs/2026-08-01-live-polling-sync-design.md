# Live Frontend Polling Synchronization

## Goal

Keep Activity, Recent Bounties, and the currently selected bounty synchronized when BOT Chain's HTTP event polling does not reliably deliver `contract.on(...)` updates.

## Design

- Keep the existing contract event listeners as a fast path.
- While the document is visible and the wallet is connected to BOT Chain, run a read-only synchronization every 5 seconds.
- Pause the interval while the document is hidden.
- When the document becomes visible, synchronize immediately before restarting the interval.
- Refresh Recent Bounties and the currently selected bounty silently, without replacing successful transaction messages or surfacing transient background errors.
- Refresh Activity incrementally from the last checked block rather than rereading the entire deployment history every 5 seconds.
- Deduplicate Activity entries so an event delivered by both the listener and poller appears only once.

## Safety Constraints

- No contract changes.
- No wallet writes, transaction calls, automatic retries, routing changes, or RPC-provider replacement.
- Never overlap polling cycles; skip a tick while a prior synchronization is still running.
- Preserve the existing initial historical backfill and existing event listeners.
- A polling failure is silent and the next scheduled synchronization may recover naturally.

## Verification

- Unit-test the incremental activity merge/deduplication helper.
- Run the frontend test suite and production build.
- Run the existing 16-contract-test suite to confirm no contract behavior changed.
