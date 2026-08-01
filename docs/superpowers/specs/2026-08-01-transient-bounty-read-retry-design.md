# Transient Bounty Read Retry

## Goal

Prevent a single stale BOT Chain RPC response from incorrectly telling the user that an existing bounty does not exist.

## Design

- Recognize both forms of a not-found read: a zero/default bounty result and an RPC revert containing `Bounty does not exist`.
- On that specific result, wait 1 second and retry the same read once.
- If the retry succeeds, update the bounty normally and show no error.
- If the retry also reports not found, show the existing not-found error.
- Preserve the currently displayed bounty throughout the first failed read and retry; clear it only after the second confirmed not-found response.
- Keep polling/background reads silent as they are today.

## Safety Constraints

- No contract, wallet-write, transaction, routing, polling-frequency, or RPC-provider changes.
- Do not retry arbitrary errors, user-rejected wallet actions, or failed transactions.
- At most one additional RPC read, and only for the specific not-found condition.

## Verification

- Unit-test immediate success, first-not-found-then-success, and repeated-not-found behavior with a deterministic injected delay.
- Run frontend tests, build, and lint.
- Run the complete contract test suite to verify no on-chain behavior changed.
