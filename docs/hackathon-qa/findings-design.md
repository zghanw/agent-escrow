# Design QA findings: Agent Escrow

Reviewed against `docs/hackathon-ui/design-system.md` (original hackathon-ui token doc) and `DESIGN.md` (repo root, an `impeccable`-generated doc capturing the tokens actually shipped after the React/Vite migration and redesign). Live-tested against https://zghanw.github.io/agent-escrow/ with Playwright MCP at 1440x900 and 390x844. The wallet-gated `/app` dashboard was reached by injecting a mock EIP-1193 `window.ethereum` before the app mounted (fake account, chain `0x3c8`) to pass `RequireWallet`. Screenshots: `docs/hackathon-qa/screenshots/`.

**Environment note:** the bug-pass reviewer appears to share the same Playwright browser session — stray form input ("QA test bounty - mock provider", bounty ID "999") and a transient "No wallet found" flash were observed but not triggered by this review. Stray tx errors in some screenshots ("Create failed: could not coalesce error", RPC 403s) are cross-session/mock-provider noise, not findings here.

### Finding 1: The shipped visual system has completely diverged from `design-system.md`'s documented tokens
- **Severity:** Important
- **Platform:** web
- **How found:** Code read (`design-system.md` vs `DESIGN.md` vs `frontend/src/index.css`) + Live (all screenshots)
- **Location:** `docs/hackathon-ui/design-system.md` (stale) vs `frontend/src/index.css:164-537`, `DESIGN.md`
- **What's wrong:** `design-system.md` specifies a light "Paper White" shell (`--page-bg:#F5F5F5`), dark panels on it, solid-black CTAs, Geist headings, no accent beyond status colors. The live app has no light surface anywhere — landing, gate, and dashboard are all full-bleed void-black with a gold `#ffc700` accent (absent from `design-system.md`), a Sentient serif display font, and clip-path/bracket corners. This is internally consistent and deliberately documented in `DESIGN.md`'s "Trading Terminal" system across all three surfaces — not sloppy per-screen drift — but `design-system.md`/`ui-plan.md` are now 100% stale as a reference for anyone reading them.
- **Evidence:** `design-system.md:18` `#F5F5F5` / `:31` `#000000` primary vs. live `#000000` bg + `#ffc700` accent in every screenshot; `DESIGN.md` frontmatter confirms current tokens.

### Finding 2: Undefined `--panel-muted` CSS variable breaks empty-state text hierarchy
- **Severity:** Important
- **Platform:** web
- **How found:** Live (computed style + screenshot)
- **Location:** `frontend/src/components/dashboard/RecentBountiesPanel.tsx:27,32`, `frontend/src/components/dashboard/EventFeedPanel.tsx:8`
- **What's wrong:** Both set `style={{ color: "var(--panel-muted)" }}`, but `--panel-muted` is never defined in `index.css` (only `--muted-foreground:#a3a3a3` exists). The invalid var() falls back to inherited white, so "Watching the contract for new activity...", "No bounties yet.", and "Connect your wallet..." render full-white — same weight as primary content — instead of receding like every other muted element (`.panel-heading`, `.field-label`, `.feed-time` all correctly use `--muted-foreground`).
- **Evidence:** Live `getComputedStyle` on the text returned `color: "rgb(255,255,255)"`; `getPropertyValue('--panel-muted')` returned `""`. Screenshot: `docs/hackathon-qa/screenshots/dashboard-activity-panel-muted-bug.png`.

### Finding 3: Primary "[Launch App]" CTA has no visible keyboard-focus indicator
- **Severity:** Important
- **Platform:** web
- **How found:** Live (computed style pre/post focus) + code read
- **Location:** `frontend/src/components/landing/Button.tsx:8-25` (`LandingButton`)
- **What's wrong:** Base classes set `outline-none`; the `default` variant only adds a hover shadow, with no `focus-visible:` rule anywhere. Tabbing to it leaves `outlineStyle:"none"` and a box-shadow identical to the unfocused resting state — zero visual difference when focused. This is the site's single primary CTA. Every other interactive control (WalletGate buttons, NavMenu trigger, RecentBountiesPanel link, shadcn Button/Input/Select) defines an explicit focus ring.
- **Evidence:** Focused computed style: `outlineStyle:"none"`, `boxShadow:"...rgb(255,199,0) 0px 8px 28px -10px"` (unchanged from rest state). Screenshot: `docs/hackathon-qa/screenshots/launch-app-no-focus-ring.png`.

### Finding 4: Pervasive low-opacity white text fails WCAG AA contrast on landing + wallet gate
- **Severity:** Important
- **Platform:** web
- **How found:** Live (computed color + screenshot) + code read
- **Location:** `frontend/src/pages/WalletGate.tsx:14,45,55,77,99,108`; `frontend/src/components/landing/VerificationPanel.tsx:44,56,66`; `FlowPreview.tsx:12`; `Hero.tsx:38`; `Pill.tsx` (`text-white/50`)
- **What's wrong:** `text-white/30` to `/40` used for small (0.62-0.78rem) label text on black: gate row labels ("01 · Wallet" etc.), "Access ledger" eyebrow, VerificationPanel's "Contract/Status/Bounties created" labels, FlowPreview step labels, Hero's MetaMask disclaimer. Measured: "Contract" label = `rgba(255,255,255,0.4)` at 12px ≈ 3.7:1 contrast, below the ~4.5:1 AA threshold; `white/30` ≈ 2.5:1. Also contradicts `DESIGN.md`'s own documented landing "Muted Signal" of `white/60%` (~7.4:1, which `Hero.tsx`'s subcopy correctly uses) — most label instances are dimmer than the system's own spec.
- **Evidence:** `getComputedStyle` on "Contract" label: `color: oklab(.../ 0.4)`, `font-size:12px`. Screenshots: `connect-1440.png`, `connect-390.png`.

### Finding 5: Bounty-ID input and rating selector have no associated label
- **Severity:** Minor
- **Platform:** web
- **How found:** Code read
- **Location:** `frontend/src/components/dashboard/BountyDetailPanel.tsx:58-66` (Input), `:133-144` (Select)
- **What's wrong:** The "View a bounty" ID field uses only `placeholder="Bounty ID"`, no `id`/`<label>`/`aria-label`; the rating `Select` has no label at all. Inconsistent with `CreateBountyPanel` in the same tab set, which pairs every field with `.field-label` + matching `htmlFor`/`id`.
- **Evidence:** `BountyDetailPanel.tsx:58-66` vs. `CreateBountyPanel.tsx:25-27,35-37`.

### Finding 6: Nav-menu hamburger trigger is a 36x36px tap target
- **Severity:** Minor
- **Platform:** web
- **How found:** Live (bounding box)
- **Location:** `frontend/src/components/landing/NavMenu.tsx:25-35` (`size-9`)
- **What's wrong:** The only nav-menu trigger on landing/gate measures 36x36px, under the ~44x44 recommended phone tap-target minimum.
- **Evidence:** `getBoundingClientRect()` → `{width:36, height:36}`.
