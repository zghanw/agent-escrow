# Wallet History and Profile Design

Date: 2026-08-02

## Goal

Add connected-wallet BOT balance, arbitrary wallet history lookup, and a richer connected-wallet profile without changing the deployed escrow contract or increasing the existing five-second polling load significantly.

## Scope

- Display the connected wallet's native BOT balance in the wallet banner.
- Add a protected `Wallets` dashboard tab that accepts any valid EVM address.
- Show wallet-level escrow totals, aggregate agent rating, and role-based bounty history.
- Replace the current minimal Profile content with the same history view, preloaded for the connected address.
- Keep the existing contract, routes, bounty actions, Activity feed, polling behavior, and Create form persistence unchanged.

The wallet lookup remains inside `#/app` and therefore requires an already connected wallet. It is read-only for the searched address.

## Data model

Wallet history is derived from the indexed `BountyCreated` event. Two filtered event queries locate bounty IDs where the searched address is:

- the requester; or
- the designated agent.

The client deduplicates matching IDs, reads the current `bounties(id)` record for each ID, and derives all presentation data from those records. No full `bountyCount` scan is used.

Role labels are `As requester` and `As agent`. This matches the V2 contract, where an agent is designated at creation rather than claiming an open bounty.

## Derived statistics

- `Total earned`: sum of Released bounties where the wallet is the agent.
- `Total paid out`: sum of Released bounties where the wallet is the requester.
- `Active bounties`: unique Open, Accepted, or Submitted bounties involving the wallet.
- `Total bounties`: all unique bounties involving the wallet.
- `Rating`: the existing `getAgentRatingSummary(address)` result.

Refunded and cancelled principal is not counted as paid out. A self-addressed bounty cannot cause double counting because the contract rejects a requester who is also the designated agent.

## Architecture

### Pure history utilities

A focused library owns address validation, ID deduplication, status classification, role filtering, and summary calculation. These functions do not depend on React or a provider and receive test-first coverage.

### Chain reader

A wallet-history reader:

1. Gets the latest block.
2. Queries requester and agent `BountyCreated` filters from the configured deployment block in ranges no larger than the existing RPC-safe block size.
3. Deduplicates and sorts bounty IDs newest first.
4. Hydrates only matching bounties with bounded request concurrency.
5. Reads the address's rating summary.
6. Returns one normalized history result.

Full history is loaded only when the searched address changes, the user explicitly refreshes, or a successful local transaction affects the connected profile. Arbitrary searched wallets are not added to the global five-second polling cycle.

### Shared React presentation

One `WalletHistoryPanel` presents:

- address and BOTScan link;
- five compact summary cards;
- `As requester` and `As agent` role tabs;
- status, amount, counterparty, description, and bounty ID for each row;
- loading, empty, invalid-address, and recoverable RPC-error states; and
- an explicit Refresh action.

The Wallets tab wraps this panel with an address input and View history action. Profile passes the connected signer address directly and hides the lookup form. The layout uses one column on narrow screens and two columns where the current 640px dashboard permits it.

### BOT balance

The escrow hook reads `provider.getBalance(signerAddress)`, formats it as BOT, and refreshes it during the existing read synchronization and after confirmed transactions. A failed balance refresh leaves the previous value visible and does not block escrow actions.

## Error and RPC behavior

- Reject malformed and zero addresses before making RPC calls.
- Preserve the last successful result while a manual refresh is in progress.
- Query logs in RPC-safe chunks and deduplicate by bounty ID.
- Retry bounty hydration only through the existing narrowly scoped transient not-found reader.
- Surface lookup-specific errors inside the Wallets/Profile panel without replacing the global transaction log.
- Do not retry wallet transactions or broaden existing polling.

## Testing

Test-first coverage will verify:

- address validation and checksum normalization;
- deduplication and newest-first ordering;
- requester and agent role filtering;
- active, earned, paid-out, total, and rating calculations;
- refunded/cancelled amounts are excluded from paid out;
- BOT amount formatting; and
- ABI support for the indexed event filters used by the reader.

After implementation, run frontend policy tests, contract tests, lint, TypeScript/Vite production build, and inspect the final diff. Existing Fast Refresh lint warnings may remain, but no new lint errors or warnings should be introduced.

## Documentation

Update the public README to describe wallet balance, wallet lookup, and unified profile/history. Update the ignored local `CLAUDE.md` handoff with the architecture, RPC safeguards, test counts, and remaining mainnet work. `CLAUDE.md` remains untracked and must not be pushed.

## Out of scope

- Smart contract changes or redeployment
- Backend, database, subgraph, or third-party indexer
- Unauthenticated public lookup route
- Written reviews, search indexing, CSV export, or fiat conversion
- Continuous polling of arbitrary searched wallets
