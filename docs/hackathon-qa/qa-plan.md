# qa-plan.md: Agent Escrow

<!-- Filled in by hackathon-qa's triage step, grouping findings from
     docs/hackathon-qa/findings-bugs.md and findings-design.md into tasks.
     docs/hackathon-qa/progress.md tracks status against it. -->

## Task list

| # | Task | Severity | Tier | Platform |
|---|---|---|---|---|
| 1 | Fix wallet/tx state bugs in useEscrow (form data loss, stuck network state, opaque tx errors) | Important | sonnet | web |
| 2 | Accessibility & legibility pass (undefined muted-text var, low-contrast labels, missing focus ring) | Important | sonnet | web |
| 3 | Update stale docs to match shipped React/Vite app and current design tokens | Important | sonnet | web |
| 4 | Minor polish: label form controls, enlarge nav tap target | Minor | haiku | web |

## Task details

### Task 1: Fix wallet/tx state bugs in useEscrow

**What ships:**
- `createBounty` (and the create-bounty form) preserves the user's typed description/amount when the transaction fails, clearing the form only on success. Currently `CreateBountyPanel.handleCreate` clears unconditionally because `createBounty` swallows every error internally and never signals failure back to the caller.
- The app correctly detects a mid-session MetaMask network switch instead of getting stuck believing it's still on BOT Chain. `ethers.BrowserProvider` throws `NETWORK_ERROR` on a runtime chain change unless constructed with `{ network: "any" }` (or the error is caught); today `refreshNetwork()`/`onChainChanged` have no error handling, so `onBotChain` never flips to `false`, the wrong-network banner never appears, and the live-activity event listeners re-throw the same error on every poll indefinitely.
- Write-transaction failures (`createBounty`/`claim`/`release`/`refund`/`rate`) surface the underlying provider error message where one exists, instead of ethers' opaque "could not coalesce error" - the same class of error already fixed once for wallet-connect (see `docs/hackathon-build/progress.md`'s "Post-Task-7 fixes" note) but not for the write-tx path.

**Findings addressed:** findings-bugs.md #2, #3, #4
**Files touched:** `frontend/src/hooks/useEscrow.ts`, `frontend/src/components/dashboard/CreateBountyPanel.tsx`
**Definition of done:** Reviewer can read the diff and confirm: (a) the create-bounty form only clears on a successful transaction, not on every attempt; (b) `refreshNetwork`/`onChainChanged` (or the `BrowserProvider` construction) is wrapped so a runtime chain change updates `onBotChain` to `false` and shows the wrong-network banner instead of throwing repeatedly; (c) a simulated chain-change (mock `window.ethereum` `chainChanged` event, since no real MetaMask is available for review either) flips the banner rather than filling the console with repeated `NETWORK_ERROR`; (d) failed write-tx error messages reflect the underlying RPC error where the provider supplies one.

### Task 2: Accessibility & legibility pass

**What ships:**
- Define the `--panel-muted` CSS variable (or replace its two usages with the existing `--muted-foreground` token) so `RecentBountiesPanel`'s and `EventFeedPanel`'s empty-state text ("No bounties yet.", "Watching the contract for new activity...", "Connect your wallet...") renders visibly dimmer than primary content instead of falling back to full white.
- Add a visible `focus-visible` ring to the landing page's primary "[Launch App]" CTA (`Button.tsx`'s `default` variant), matching the ring style already used by WalletGate's buttons, NavMenu's trigger, and the shadcn `Button`/`Input`/`Select` components elsewhere in the app.
- Raise low-opacity label text (`text-white/30`, `text-white/40`) on `WalletGate.tsx`, `VerificationPanel.tsx`, `FlowPreview.tsx`, `Hero.tsx`, and `Pill.tsx` to at least `white/60` - the opacity `DESIGN.md` itself documents as the landing page's "Muted Signal" token (~7.4:1 contrast) and which `Hero.tsx`'s own subcopy already correctly uses - so these labels clear roughly WCAG AA contrast at their small font sizes instead of measuring 2.5-3.7:1.

**Findings addressed:** findings-design.md #2, #3, #4
**Files touched:** `frontend/src/index.css`, `frontend/src/components/landing/Button.tsx`, `frontend/src/pages/WalletGate.tsx`, `frontend/src/components/landing/VerificationPanel.tsx`, `frontend/src/components/landing/FlowPreview.tsx`, `frontend/src/components/landing/Hero.tsx`, `frontend/src/components/landing/Pill.tsx`
**Definition of done:** Reviewer confirms via computed styles or a screenshot that: (a) the empty-state panel text is visibly dimmer than primary dashboard text and no longer resolves to `rgb(255,255,255)`; (b) tabbing to the Launch App button shows a visible focus ring; (c) the previously-flagged label instances measure at/above `white/60` opacity (or equivalent contrast) instead of `white/30`-`/40`.

### Task 3: Update stale docs to match shipped app

**What ships:** `README.md`'s Architecture section and `docs/hackathon-build/spec.md`'s Tech stack section are rewritten to accurately describe the shipped frontend - React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + `react-router-dom` (HashRouter) + a `@react-three/fiber`/`three` 3D vault component - rather than the original "single static `index.html`, vanilla JS, no build step, no framework" plan, which no longer matches the app after the "Migrate frontend to React + Vite + shadcn/ui" and "Redesign frontend" commits. `docs/hackathon-ui/design-system.md` and `docs/hackathon-ui/ui-plan.md` gain a short note at the top marking them as superseded by the currently-shipped design system (documented in `DESIGN.md`), so a reader isn't misled by the old Nexflow/light-page token set without requiring a full rewrite of a doc about a since-abandoned first design pass.

**Findings addressed:** findings-bugs.md #1, findings-design.md #1
**Files touched:** `README.md`, `docs/hackathon-build/spec.md`, `docs/hackathon-ui/design-system.md`, `docs/hackathon-ui/ui-plan.md`
**Definition of done:** Reviewer confirms `README.md` and `spec.md` no longer claim "no build step, no framework, no backend" or "single static index.html" for the current app, and that `design-system.md`/`ui-plan.md` each carry a clear pointer to `DESIGN.md` as the current source of truth.

### Task 4: Minor polish: label form controls, enlarge nav tap target

**What ships:** The dashboard's "View a bounty" ID input gets a proper `<label>`/`aria-label` matching `CreateBountyPanel`'s existing `.field-label` + `htmlFor`/`id` pattern; the agent-rating `Select` gets an associated label. `NavMenu`'s hamburger trigger grows from `size-9` (36x36px) to at least 44x44px.

**Findings addressed:** findings-design.md #5, #6
**Files touched:** `frontend/src/components/dashboard/BountyDetailPanel.tsx`, `frontend/src/components/landing/NavMenu.tsx`
**Definition of done:** Reviewer confirms both form controls have an accessible name (via `aria-label` or an associated `<label>`), and the nav trigger's rendered bounding box is at least 44x44px.
