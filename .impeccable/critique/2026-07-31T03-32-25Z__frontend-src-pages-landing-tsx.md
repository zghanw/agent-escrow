---
target: landing page (frontend/src/pages/Landing.tsx)
total_score: 23
max_score: 36
na_heuristics: 7
p0_count: 1
p1_count: 1
timestamp: 2026-07-31T03-32-25Z
slug: frontend-src-pages-landing-tsx
---
Method: dual-agent (A: general-purpose design review · B: general-purpose detector/browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Reveal animation + hover-coupled particles give life; no indication of what "Launch App" leads to |
| 2 | Match System / Real World | 3 | Escrow language is correct, but "testnet" vs. "real BOT" isn't clarified on-page |
| 3 | User Control and Freedom | 3 | Trivially satisfied with only 2 links; nothing to actually test |
| 4 | Consistency and Standards | 2 | Confirmed live: `MobileMenu.tsx` nav drops the `px-4 md:px-8` padding `Header.tsx` uses |
| 5 | Error Prevention | 2 | No priming for "no wallet installed" / "wrong network" before the click that leads there |
| 6 | Recognition Rather Than Recall | 4 | Two clear, plainly-labeled actions |
| 7 | Flexibility and Efficiency | n/a | No shortcuts/customization concept applies to a 2-link landing page |
| 8 | Aesthetic and Minimalist Design | 3 | Striking execution of the existing system, but minimalism trades away trust-building the product needs |
| 9 | Error Recovery | 1 | No error states exist because nothing on this page anticipates the errors one click away |
| 10 | Help and Documentation | 2 | GitHub link is the only help surface; no in-page "how it works" |
| **Total** | | **23/36** | **Acceptable (64%)** |

## Design Specificity Verdict

**Start here — this is the headline finding.** The page fails the "could an unrelated product use it unchanged" test. `Landing.tsx` renders exactly `Header` + `Hero`, and the hero's own WebGL particle wave is sourced from a reference template (its code comments say so directly: "tuned defaults from the reference design"). Nothing in the composition — particle ribbon, reveal animation, hover perturbation — encodes escrow, agents, bounties, two wallets, or BOT Chain. Swap the headline text and this ships unchanged for an NFT mint or generic AI SaaS. Per PRODUCT.md, the entire differentiator is "real value moving between two independent, unrelated wallets," and trust is supposed to be earned "visually as much as functionally" — the landing page currently carries zero visual argument for that claim.

**Deterministic scan**: `detect.mjs` CLI ran clean (0 findings) against `Landing.tsx` + `components/landing/`. But the live browser overlay (injected detector, not the static CLI pass) caught 3 anti-patterns across 7 instances: `dark-glow` (zero-offset box-shadow glow, ×4), `gpt-thin-border-wide-shadow` (0.8px border + 54px shadow blur, ×2), and `body-text-viewport-edge` (a `<p>` bleeding flush to both viewport edges, ×1).

**Where the two assessments disagree — worth your attention specifically**: Assessment A named the LandingButton's "inset gold glow + clip-path corners" as a top strength — a signature, product-appropriate shape. Assessment B's mechanical detector flags that same glow/thin-border technique as `gpt-thin-border-wide-shadow` and `dark-glow`, patterns it associates with generic AI-generated visual tells rather than intentional craft. Both can be true at once: the *shape* (clip-path cut corners) is genuinely distinctive and DESIGN.md-consistent; the *glow treatment* riding on top of it is the part reading as a stock AI-design signature. Worth deciding deliberately rather than defending on reflex.

The `body-text-viewport-edge` finding is a second, separate bug from Assessment A's confirmed mobile-menu padding bug — both are edge-bleed issues on mobile but in different components (hero `<p>` vs. nav), so both need fixing, not just one.

## Overall Impression

Technically polished, atmospherically confident, and almost entirely product-agnostic. The execution quality (particle interactivity, type pairing discipline, signature button shape) is real, but it's in service of a generic "sleek dark crypto site" mood rather than this specific product's trust proposition. For a page whose entire job is convincing a stranger to send real funds into a contract, that's the wrong thing to be confident about.

## What's Working

- **LandingButton's clip-path cut corners + diagonal accent lines** (`Button.tsx`) is a genuinely distinctive, consistently-reused signature shape matching DESIGN.md's Cut-or-Bracket Rule — reads like a physical console toggle. (The glow riding on top of it is the part to reconsider, see above.)
- **Mono-first + Sentient-only-for-headline pairing** is executed with real discipline — the jump from weight-200 Sentient hero text into uppercase Geist Mono for everything else lands the intended "console with one elegant headline" feel.
- **Hover-to-particle coupling** (CTA hover drives a live `introspect` perturbation in the WebGL scene) gives the one interactive element on the page a connected, responsive feel.

## Priority Issues

**[P0] No trust-building content before a real-funds ask.**
Why it matters: The page is hero-only — nothing previews the two-wallet flow, verifies the contract, or explains testnet safety before the visitor is asked to click through into a wallet-connect flow that leads toward moving real value.
Fix: Add a compact "how it works" / legitimacy block (verified-contract badge, 3-step flow preview) before or alongside the CTA.
Suggested command: `/impeccable onboard`

**[P1] Visual language is borrowed, not product-specific — and the detector independently flags part of the technique used to deliver it.**
Why it matters: The hero motif has no escrow/agent semantics (confirmed by source: ported from a reference template); the glow/shadow treatment carrying much of its "premium" feel is mechanically flagged as a generic AI-design tell (`dark-glow`, `gpt-thin-border-wide-shadow`).
Fix: Art-direct the hero motif around the two-wallet/lock/escrow concept specifically; when revisiting the button treatment, keep the clip-path signature shape but reconsider the zero-offset glow shadow rather than defaulting to it.
Suggested command: `/impeccable adapt` (or fold into the redesign work already planned for stage 4)

**[P2] Two confirmed mobile edge-bleed bugs.**
Why it matters: Live screenshots at 390px show the mobile nav's "GITHUB"/"LAUNCH APP" text touching the left viewport edge (`MobileMenu.tsx` is missing the `px-4 md:px-8` padding `Header.tsx` uses), and separately the hero's subcopy `<p>` bleeds flush to both edges (0px/0px) on the same viewport.
Fix: Add matching horizontal padding to `MobileMenu`'s nav; add horizontal padding or a max-width constraint to the hero paragraph at narrow widths.
Suggested command: `/impeccable polish`

**[P3] No wallet/network error-prevention priming.**
Why it matters: First-timers get no warning before landing in `/app` without MetaMask installed or on the wrong network — the failure happens one click later with no setup.
Fix: One line of pre-flight copy near the CTA ("You'll need MetaMask installed").
Suggested command: `/impeccable clarify`

## Persona Red Flags

**Jordan (Confused First-Timer)**: Reads the "BOT CHAIN TESTNET" pill alongside copy implying real cryptocurrency, with no clarification of which applies to them right now; clicks `[Launch App]` with no idea a wallet extension is required next.

**Riley (Deliberate Stress Tester)**: Looks for legitimacy proof (contract address, verified badge, audit note) before connecting a wallet — finds none on the landing surface; only an off-page GitHub link is available as a check.

**Casey (Distracted Mobile User)**: Opens the hamburger menu and sees nav text clipped against the left edge (confirmed P2 bug) — reads as broken on a quick glance, not intentional.

## Minor Observations

- Logo's abstract zigzag mark doesn't clearly map to "A" or "E."
- Header's "Launch App" text link uses identical gold/weight to the primary hero CTA, diluting the hero button's primacy.
- Pill text (`white/50`) risks low contrast against brighter particle streaks passing behind it.
- No underline/scale on link hover — easy to miss as interactive against a moving background.

## Questions to Consider

1. If a cold judge lands here with zero context, what on this page proves "two independent wallets, real value" rather than "another mint button"?
2. Is a hero-only landing page itself the kind of "hackathon-weekend scrappiness" PRODUCT.md explicitly warns against?
3. With "no limits" creative license, why spend it on a stock particle effect instead of one glyph that actually encodes escrow?
