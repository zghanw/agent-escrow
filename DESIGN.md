---
name: Agent Escrow
description: Trust-minimized on-chain escrow for agent-to-agent bounties on BOT Chain
colors:
  gold-signal: "#ffc700"
  void-black: "#000000"
  ink-white: "#ffffff"
  panel-charcoal: "#111111"
  surface-graphite: "#1a1a1a"
  border-terminal: "#2a2a2a"
  border-landing: "#424242"
  muted-signal: "#a3a3a3"
  status-info: "#60a5fa"
  status-good: "#22c55e"
  status-warn: "#f59e0b"
  status-bad: "#ef4444"
typography:
  display:
    fontFamily: "Sentient, Georgia, serif"
    fontSize: "clamp(3rem, 7vw, 4.5rem)"
    fontWeight: 200
    lineHeight: 1.05
    letterSpacing: "normal"
  ui:
    fontFamily: "Geist Mono Variable, monospace"
    fontSize: "0.85rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
  body:
    fontFamily: "Geist Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  scale:
    micro: "0.62rem"
    2xs: "0.7rem"
    2xs-loose: "0.72rem"
    xs: "0.75rem"
    xs-loose: "0.78rem"
    sm-tight: "0.8rem"
    sm: "0.82rem"
    base-tight: "0.9rem"
    page-title: "2rem"
rounded:
  terminal: "4px"
  default: "10px"
  lg: "10px"
  xl: "14px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  panel:
    backgroundColor: "{colors.panel-charcoal}"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.terminal}"
    padding: "20px 22px"
  button-primary-liquid:
    backgroundColor: "transparent"
    textColor: "{colors.gold-signal}"
    rounded: "{rounded.terminal}"
    padding: "10px 24px"
  button-landing:
    backgroundColor: "{colors.void-black}"
    textColor: "{colors.ink-white}"
    padding: "0 24px"
    height: "64px"
---

# Design System: Agent Escrow

## Overview

**Creative North Star: "The Trading Terminal"**

Agent Escrow's visual system reads as a monitored, high-stakes instrument across all three surfaces — landing, wallet-connect gate, and dashboard — closer to a trading floor or mission-control console than a consumer crypto app. Void-black surfaces, a single gold signal accent, and monospace type throughout make every screen feel measured and instrumented rather than decorative. The landing page opens that instrument up into a full-bleed WebGL scene and proves its claims with a live Verification Panel; the wallet gate frames connecting as a "Signature Ritual," a ledger the visitor signs into; the dashboard closes back down into a narrow, dense, tabbed console fronted by a live 3D Vault that acts out each bounty's real on-chain status.

The system was deliberately amplified across four build stages, not replaced: every new surface inherits the same tokens, bracket-corner language, and mono-first type system established here, and every mechanical design-detector finding along the way was either fixed (a zero-offset button glow, a 3px side-bar banner) or deliberately kept and explained (the wallet-gate stamp's overshoot easing, as literal stamp physics).

**Key Characteristics:**
- One accent color (gold, `#ffc700`) against near-total black-and-white; no secondary or tertiary hue in use.
- Corners are either cut (clip-path polygon, landing surfaces) or bracketed (gold L-shaped corner marks) — now shared across dashboard panels, the landing verification panel, the wallet-gate ledger, and the dashboard vault frame; border-radius is the exception, not the default, on primary surfaces.
- Monospace is the dominant UI voice; a light-weight serif-adjacent display face (Sentient) is reserved for large hero/page-title moments only.
- Depth comes from offset+blur accent glow (never zero-offset) and bracket marks, not shadow elevation — flat at rest, with exactly one authored motion moment per surface.
- The dashboard is deliberately narrow (max 640px), now organized into three tabs (Bounties/Create/Activity) instead of one long stack.
- State is proven, not decorated: the landing panel reads the real chain, the dashboard Vault is a pure function of real bounty status.

## Colors

Effectively monochrome (black/white/gray) with a single reserved accent; semantic status colors exist only inside the dashboard's transaction and bounty-state surfaces.

### Primary
- **Gold Signal** (`#ffc700`): The system's only accent. Used for primary button text/border, panel bracket-corner marks, focus rings, links, the landing pill's status dot, and the "launch app" call to action. Its rarity across otherwise black-and-white surfaces is what gives it weight.

### Neutral
- **Void Black** (`#000000`): Page background on both landing and dashboard.
- **Ink White** (`#ffffff`): Primary text on dark surfaces.
- **Panel Charcoal** (`#111111`): Dashboard card/panel background, one step off pure black.
- **Surface Graphite** (`#1a1a1a`): Dashboard secondary/muted surface fill (hover states, secondary buttons).
- **Border Terminal** (`#2a2a2a`): Dashboard panel and input borders.
- **Border Landing** (`#424242`): Landing-surface borders (pill, dividers) — lighter than the dashboard's border for a slightly softer full-bleed context.
- **Muted Signal** (`#a3a3a3` on dashboard; `white/60%` on landing): Secondary text — field labels, timestamps, supporting copy.

### Named Rules
**The One Accent Rule.** Gold is the only hue in the system. It never gets a second saturated color to share the stage with; new UI reaches for gray-scale or the fixed semantic status set before introducing another accent.

## Typography

**Display Font:** Sentient (extralight 200 / light italic 300), with Georgia/serif fallback
**Body Font:** Geist Variable (sans-serif)
**UI/Label Font:** Geist Mono Variable (monospace)

**Character:** A quiet, humanist display face for the one or two largest words on a page, set against a mechanical monospace that carries almost every other piece of visible text — labels, nav, buttons, body copy, timestamps, log lines. The pairing reads as "console with one elegant headline," not as a conventional sans/serif editorial pairing.

### Hierarchy
- **Display** (weight 200, `clamp(3rem, 7vw, 4.5rem)`, line-height ~1.05): Hero headline only (landing `<h1>`, dashboard page title). Sentient, often mixed with an italic light-weight span for emphasis within the same line.
- **Body** (weight 400, ~1rem, line-height 1.5): Landing hero subcopy and any long-form paragraph text. Geist Variable sans, `text-balance` wrapping.
- **UI / Label** (weight 500, ~0.7–0.9rem, letter-spacing 0.04–0.06em, uppercase): Nearly everything else — nav links, buttons, panel headings, field labels, status badges, feed/log lines, bounty IDs. Geist Mono Variable, almost always uppercase with wide tracking.

The UI/Label role isn't one fixed size; it's a micro-scale (documented in the frontmatter as `typography.scale`) that grew organically across dashboard, landing, and gate: 0.62rem (flow-preview step labels) up through 0.9rem (banner text), stepping through 0.7 / 0.72 / 0.75 / 0.78 / 0.8 / 0.82rem for labels, badges, timestamps, and log lines at slightly different densities. Treat these as the real, established steps — reach for one of them before inventing a new arbitrary size.

### Named Rules
**The Mono-First Rule.** Default to Geist Mono for any new interface text. Sentient is earned only by the single largest headline on a page — it is never used for body copy, labels, or buttons.

## Layout

Two distinct spatial grammars for two distinct modes:

- **Landing (Persuade):** Full-bleed, full-viewport (`h-svh`) hero with a fixed WebGL canvas layer behind all content. Content is centered and vertically pinned to the bottom third of the viewport. Fixed header overlays the canvas at the top. Responsive type scales via breakpoint classes (`text-5xl sm:text-6xl md:text-7xl`) rather than a single fluid clamp in the implementation (the frontmatter's `clamp()` is a normalized approximation of that stepped scale).
- **Dashboard (Operate):** Single centered column, `max-w-[640px]`, deliberately narrower than a typical wide app shell — every panel is full-width within that column and stacked vertically with `space-y-4.5` (~18px) rhythm. No sidebar, no multi-column grid. Reads as a single console feed rather than a dashboard-with-widgets.

## Elevation & Depth

Flat with accent glow. Surfaces carry no shadow-based elevation system — panels and cards sit at a single flat layer, distinguished only by a 1px border and a slightly lighter fill than the page background. Depth and emphasis are instead signaled by the gold accent: bracket-shaped corner marks on dashboard (and, as of the landing redesign, landing) panels, a soft offset+blur shadow on the landing primary button (revised from a zero-offset inset halo, which the design detector correctly flagged as a generic AI-glow tell — see Named Rule below), and a glass-distortion filter (SVG `feTurbulence`/`feDisplacementMap`) behind the dashboard's primary action button. There is no ambient shadow vocabulary to catalogue; treat any new "elevated" surface as an offset glow or bracket-mark treatment, not a zero-offset halo or a `box-shadow` stack.

### Named Rules
**The Offset Glow Rule.** Any glow shadow carries an offset and a blur radius (e.g. `0 8px 28px -10px`); a zero-offset colored halo reads as decoration, not craft, and is the specific pattern this system's detector flags as a generic AI-design tell.

## Shapes

Corners are either **cut** or **bracketed** — plain `border-radius` is the fallback, not the signature move. Landing buttons and the status pill use a `clip-path` polygon with two opposing corners cut at a fixed size (16px on buttons, 6px on the pill), with a thin diagonal accent line drawn across each cut corner in the accent/border color. Dashboard panels instead use full `border-radius` (from the `--radius` token, 4px on dashboard vs. 10px on the default/shadcn theme) but add gold L-shaped bracket marks at the top-left and bottom-right corners via `::before`/`::after`. Status badges and small tags use plain small-radius pills.

### Named Rules
**The Cut-or-Bracket Rule.** A primary interactive surface earns a signature corner treatment (clip-path cut on landing, bracket marks on dashboard panels) rather than a plain rounded rectangle. Secondary/utility elements (inputs, tags, generic shadcn buttons) may use plain `border-radius`.

## Components

### Buttons
Three distinct button implementations currently coexist, each scoped to its surface:

- **LandingButton** (`components/landing/Button.tsx`) — the landing page's only button. Black fill, gold border, inset glow shadow in the accent color, clip-path cut corners with diagonal accent lines, uppercase mono, `h-16` default / `h-14` on the `sm` variant. This is the landing system's signature interactive shape.
- **LiquidButton** (`components/ui/liquid-glass-button.tsx`) — the dashboard's primary action button (Create Bounty, Claim, Release, Refund, Rate). Transparent background, gold text, a glass-refraction backdrop filter driven by an SVG turbulence/displacement filter, subtle layered inset shadows, scales to 1.05 on hover, standard `rounded-md` corners (no clip-path here). Distinctive to this project; not a generic shadcn pattern.
- **Button** (`components/ui/button.tsx`, shadcn base) — the generic fallback: solid `bg-primary` fill, `rounded-lg`, uppercase mono, hover scale 1.03 / active scale 0.97, full size ramp (`xs` through `icon-lg`). Used where a scoped landing/dashboard treatment isn't warranted.

### Panels / Cards (dashboard)
- **Corner Style:** `border-radius` from `--radius` (4px on the dashboard theme) plus gold bracket marks (10x10px `::before`/`::after`) at the top-left and bottom-right corners only.
- **Background:** Panel Charcoal (`#111111`) on Void Black page background.
- **Border:** 1px solid Border Terminal (`#2a2a2a`).
- **Heading:** Mono, uppercase, 0.8rem, Muted Signal color, wide letter-spacing — sits above panel content, not inside a card header bar.
- **Internal Padding:** ~1.25rem × 1.375rem.

### Status Badges
Small mono pills, 1px border in `currentColor`, small radius, background is a 12%-opacity tint of the same semantic color as the border/text. Four fixed states map to fixed colors: Open → warn (amber), Claimed → info (blue), Released → good (green), Refunded → muted gray.

### Status Tracker (signature component)
A horizontal 3-step progress stepper (Created → Claimed → Released, with a Refunded branch) unique to this project. Dots are small filled circles: pending = muted fill, current = blue ring with a soft glow (`box-shadow` halo), done = green fill with an inline checkmark. Connecting lines fill green as steps complete; the whole tracker flips to red/bad coloring when a bounty was refunded instead of released. Labels are mono, uppercase, small, below each dot.

### Inputs / Fields (shadcn-derived)
- **Style:** Standard shadcn `Input`/`Textarea`/`Select` — bordered, dashboard-theme border/background tokens, no distinctive treatment beyond the shared radius/border/mono-label system.
- **Label:** A separate `.field-label` element (mono, uppercase, Muted Signal) always precedes the field rather than a floating/inline label.

### Banners
Flat panels signaling state (neutral/warn/good/bad) via a small colored status dot before the message and a subtly state-tinted 1px border (not a thick side bar — revised from an earlier 3px colored `border-left`, which the design detector correctly flagged as a generic AI-UI tell) — used for the wallet-connect prompt and the wrong-network warning. Flex row layout, message + action button side by side, wraps on narrow widths.

### Event Feed / Transaction Log
Mono, small text, timestamp + message pairs, divided by 1px bottom borders (last item undivided). The transaction log below it uses the same mono voice but colors the single active line by outcome (pending = amber, ok = green, err = red) rather than listing a history.

### Verification Panel (landing, signature component)
A bracket-cornered mono readout on the landing hero proving the product's claims instead of asserting them: real contract address (linked to the block explorer), a "Verified on BOT Chain" status line, and a live bounty count read directly from the contract over a read-only RPC call (no wallet required; the row is omitted rather than faked if the public RPC is unreachable). Extends the dashboard panel's bracket-corner language onto the landing surface — first instance of a dashboard pattern reused on landing, and the model for future cross-surface consistency.

### Flow Preview (landing)
A static three-dot mechanism preview (Created → Claimed → Released) beneath the verification panel, using the same dot-and-connecting-line grammar as the dashboard's Status Tracker but non-interactive and not bound to a real bounty — it teaches the state machine before the visitor is asked to trust it with funds.

### The Vault (dashboard, signature component — stage 4 "no limits" build)
A live, contained WebGL scene (react-three-fiber, already-installed dependency) sitting atop the Bounties tab: a gold wireframe icosahedron shell containing a glowing orb, acting out the *selected* bounty's real on-chain status rather than illustrating it abstractly. Sealed and dim at rest (no bounty loaded, or Open); the shell expands and a thin blue scanning ring orbits it while Claimed; the shell expands further and fades toward transparent as the orb rises and disappears on Released (funds escaping to the agent); the whole scene tints red and contracts, the orb shrinking back toward center, on Refunded (funds returned, not paid out). Pure function of `status` — every frame eases toward targets derived from the current on-chain state, so it can never drift out of sync with the real bounty and needs no timers or animation phases. Confirmed with the user over a 2D/CSS alternative specifically for its originality value; kept self-contained (procedural geometry, no external HDR/texture fetches) so a judge's cold load never depends on a third-party asset. Respects `prefers-reduced-motion` (ambient spin and idle bob drop to near-zero).

### Access Ledger (wallet-connect gate, signature component)
The `/connect` gate's core surface: a bracket-cornered, three-row ledger (Wallet → Network → Access) the visitor "signs" into rather than a checklist they click through. Each row locks (dimmed, 35% opacity) until the row above resolves; a resolved row shows a small animated checkmark, and full access shows a larger circular stamp (scale+rotate-in, echoing a notary seal) before auto-advancing into the app. Reuses the verification panel's bracket-corner treatment and the same good/bad status colors as the dashboard, wired entirely through the existing `useEscrow` hook (`connectWallet`, `addOrSwitchNetwork`) — no new wallet-connect logic. Direction: "Signature Ritual," assigned via the surface concept-seed roll (operate mode).

### Tabs (dashboard)
Underline style, not pill or boxed: mono uppercase labels, a 1px bottom rule across the full tab list, a 2px gold underline plus gold text on the active tab. Inactive tabs are muted-foreground, brightening to full foreground on hover. Chosen over a boxed/pill treatment to keep Operate-mode chrome quiet and let the gold accent carry the "active" signal, consistent with the One Accent Rule. Introduced to split the dashboard's onboarding (previously seven stacked panels) into three tabs — Bounties (default), Create, Activity — with wallet/network status and the tx log staying as persistent chrome above/below the tabs rather than becoming tabs themselves.

### Logo / Wordmark
The brand mark (`src/assets/logo.png`): a solid white abstract bird/dove silhouette with a black ellipse "eye," alpha-transparent everywhere else — supplied pre-inverted for permanent use on this system's void-black ground, where the eye reads as a cutout to the page behind it rather than a flat black shape. Paired with the `AGENT ESCROW` mono wordmark as an icon+text lockup (`Logo.tsx`) on landing and the wallet gate; paired with the large Sentient page title on the dashboard. Content-sized (no fixed viewBox to scale), so callers size it via icon/text classes rather than a wrapping width. The favicon (`public/favicon.png`) is a separate composite — the same mark inset into a rounded black square — because a plain white silhouette would be invisible against a light browser tab bar; the black backing also doubles as the "framed icon" container the original placeholder mark used.

## Do's and Don'ts

### Do:
- **Do** keep gold (`#ffc700`) as the system's only accent color; reach for the fixed semantic status set (info/good/warn/bad) before introducing a second brand hue.
- **Do** default new UI text to Geist Mono, uppercase, wide tracking; reserve Sentient strictly for the single largest headline on a page.
- **Do** give primary interactive surfaces a signature corner treatment (clip-path cut or bracket marks) rather than a plain rounded rectangle.
- **Do** keep the dashboard a narrow, single-column console (640px cap) organized into tabs, with wallet/network status and the tx log as persistent chrome rather than tabs themselves.
- **Do** let new UI prove product claims with real on-chain data (contract reads, live status) before reaching for decorative motion or copy that only asserts them — the Verification Panel and the Vault are the model.

### Don't:
- **Don't** introduce `box-shadow`-based elevation layering or a zero-offset glow halo; this system signals depth with offset+blur accent glow (see the Offset Glow Rule) and bracket marks, not shadow stacks or decorative halos.
- **Don't** add a colored `border-left`/`border-right` thicker than 1px on any card, banner, or callout — use a status dot plus a subtly tinted 1px border instead (see Banners).
- **Don't** duplicate the button implementations (LandingButton, LiquidButton, base Button) without reason — each is scoped to a specific surface; a fourth ad hoc button style is a regression, not a new pattern.
- **Don't** animate a state the contract doesn't actually report — the Vault, status trackers, and badges are pure functions of real on-chain data, never a timed or optimistic guess.
