# Refresh Hint for Frontend Errors

## Goal

Help users recover from occasional first-load frontend synchronization errors without changing application behavior.

## Design

- Append `Try refreshing the website.` to caught runtime errors that may be caused by stale frontend state or an initial RPC read.
- The resulting message may read: `Load failed: execution reverted: "Bounty does not exist". Try refreshing the website.`
- Do not add `try again`, automatic retry behavior, timers, reload buttons, or RPC changes.
- Do not alter validation messages, wallet-not-installed messages, or deliberate wallet rejection messages because refreshing does not resolve those conditions.

## Implementation

Centralize the suffix in the frontend escrow hook and apply it only where caught operation failures are converted into user-facing error logs. Preserve the original error detail for diagnosis.

## Verification

- Run the frontend production build.
- Confirm the affected caught-error strings include the refresh hint.
- Confirm validation and wallet-rejection strings remain unchanged.
