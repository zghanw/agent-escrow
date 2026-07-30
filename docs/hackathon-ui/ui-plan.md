# ui-plan.md: Agent Escrow

<!-- Filled in by hackathon-ui. Applies design-system.md to Feature Zero's
     existing UI; docs/hackathon-ui/progress.md tracks status against it. -->

## Task list

| # | Task | Tier | Feature area |
|---|---|---|---|
| 1 | Load Geist/Geist Mono fonts; replace the `:root` token block with design-system.md's tokens | haiku | Global styles |
| 2 | Restyle page shell (body background, header, wallet/network banners) to the light page + sharp corners | sonnet | Page shell |
| 3 | Restyle all panels to dark cards with corner-bracket accents | sonnet | Panels |
| 4 | Restyle buttons, inputs, and the rating select to the new tokens (Geist Mono buttons, sharp radius) | haiku | Form controls |
| 5 | Restyle status badges and the progress tracker to the sharp monospace pill / connected-circle-with-checkmark look | sonnet | Status indicators |
| 6 | Restyle recent-bounties rows and event feed items to match | haiku | Lists |
| 7 | Add a diagonal-stripe section divider between panels | haiku | Page shell |

Implemented directly (no subagent dispatch), per the team's standing decision from the hackathon-build phase after hitting a session rate limit; all tasks applied to `index.html` in one pass, verified visually in the Browser pane after each logical group.

## Task details

### Task 1: Fonts + token block

**What ships:** Google Fonts `<link>` for Geist/Geist Mono; `:root` block replaced with design-system.md's tokens (old dark-theme tokens removed, not left dangling unused).
**Files touched:** `index.html`
**Definition of done:** page still renders (no undefined CSS var fallback to browser default) once every other task re-points its rules at the new token names.

### Task 2: Page shell

**What ships:** `body` background switches to `--page-bg` (light); header/tagline text to `--page-text`/`--page-text-muted`; wallet/network banners restyled to sharp corners on the light shell.
**Files touched:** `index.html`
**Definition of done:** the outer page reads as light, matching Nexflow's shell, with no leftover dark-theme background bleeding through.

### Task 3: Panels

**What ships:** every `.panel` (Create a bounty, Recent bounties, View a bounty, Live activity) restyled to `--color-surface` dark cards floating on the light page, with a small CSS-only corner-bracket accent (no image assets) on each.
**Files touched:** `index.html`
**Definition of done:** panels visually match the "dark card on light page" structure from the reference; text inside panels uses the dark-surface text tokens, not the light-page ones (contrast check).

### Task 4: Form controls

**What ships:** buttons (primary/secondary/danger), text inputs, textarea, and the rating `<select>` restyled to the new tokens - Geist Mono on buttons, sharp `--radius-sm`/`--radius-md`.
**Files touched:** `index.html`
**Definition of done:** every interactive control reads from the new tokens, none left on the old hardcoded dark-theme values.

### Task 5: Status indicators

**What ships:** bounty status badges (Open/Claimed/Released/Refunded) and the wallet-connected/network banners restyled to the sharp monospace pill from design-system.md; the 3-step progress tracker restyled to a connected-circle-with-checkmark stepper matching Nexflow's dashboard mockup.
**Files touched:** `index.html`
**Definition of done:** status colors still map correctly (green/amber/blue/gray per existing semantics) after the restyle; the tracker's done/current/pending states remain visually distinguishable.

### Task 6: Lists

**What ships:** recent-bounties rows and live-activity feed items restyled to match the dark-card token set and Geist/Geist Mono type.
**Files touched:** `index.html`
**Definition of done:** list rows are legible against the dark panel background, hover state still visible.

### Task 7: Section divider

**What ships:** a CSS-only diagonal-stripe divider (repeating-linear-gradient, no image) between major page sections, echoing Nexflow's hazard-stripe section breaks.
**Files touched:** `index.html`
**Definition of done:** visible, subtle, doesn't fight for attention with actual content.
