# design-system.md: Agent Escrow

<!-- Filled in by hackathon-ui. hackathon-build's implementers read this
     file for every later feature task, once it exists. -->

## Chosen style

- **Archetype:** Direct external reference, not a catalog pick — the user asked to replicate [Nexflow](https://www.nextjsshop.com/templates/nexflow/preview) (a Next.js/shadcn dev-tool template) specifically, which overrides the normal "pick from `references/ui-styles.md`" step. Closest catalog cousin is archetype 3, Technical/developer tool, but Nexflow's actual structure — a light "paper" page shell with near-black cards floating on it, sharp (0-4px) corners, and corner-bracket "blueprint" accents — isn't fully captured by either of that archetype's two palettes, so this is a custom-adapted token set, documented here rather than pulled as-is.
- **Palette:** Custom hybrid of two catalog palettes, chosen because Nexflow itself is a hybrid: **Paper White** (`references/ui-styles.md` palette) for the page chrome (light background, near-black text) + **Terminal Dark**'s exact token values for surfaces (the app's panels are dark cards, matching Nexflow's embedded dashboard mockups), plus custom additions the catalog doesn't have at all (sharp radii, corner-bracket accents) since this came from a direct external reference.
- **Font pairing:** **Geist + Geist Mono** — confirmed by inspecting Nexflow's live computed styles (`font-family: Geist` on `<body>`/`<h1>`, `font-family: "Geist Mono"` on nav links, badges, and buttons). Not in the catalog's 15 pairings; both are free on Google Fonts (verified: `fonts.googleapis.com/css2?family=Geist...&family=Geist+Mono...` resolves with real `@font-face` rules), so no build tooling or new dependency either way.
- **Why this fits:** Agent Escrow is itself a technical, on-chain tool — Nexflow's "validate before it ships" dev-dashboard language (status pills, connected-circle progress steppers, monospace data) maps almost one-to-one onto our own bounty-status table and Created→Claimed→Released tracker. The whole app is functionally "the dashboard," so Nexflow's embedded dark-card-on-light-page pattern becomes our entire page: light shell, dark panels.

## Design tokens

```css
:root {
  /* page chrome (light, "Paper White"-derived) */
  --page-bg: #F5F5F5;
  --page-text: #0A0A0A;
  --page-text-muted: #71717A;
  --page-border: #E4E4E7;

  /* surfaces / panels (dark, "Terminal Dark"-derived — Nexflow's embedded dashboard cards) */
  --color-surface: #111111;
  --color-surface-alt: #0A0A0A;
  --color-text: #E5E5E5;
  --color-text-muted: #A3A3A3;
  --color-border: #262626;

  /* accents */
  --color-primary: #000000;    /* solid black CTAs, matches Nexflow's primary button/badge */
  --color-primary-text: #FFFFFF;
  --color-secondary: #404040;

  /* semantic status colors — shared across every palette in the catalog, unchanged here */
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-error: #DC2626;
  --color-accent: #3B82F6;     /* "current step" / in-progress blue, not in the shared set but needed for the tracker's active state */

  /* spacing scale (catalog shared tokens) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4rem;

  /* radius — deliberately sharp, not the catalog's default scale: Nexflow's badges
     measured 0px border-radius live, cards measured 4px */
  --radius-sm: 0px;
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-full: 9999px;   /* reserved for the one genuinely circular element: tracker dots */

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.10);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.16);

  --font-heading: 'Geist', sans-serif;
  --font-body: 'Geist', sans-serif;
  --font-mono: 'Geist Mono', monospace;   /* labels, badges, buttons, addresses, IDs — Nexflow's signature move */
}
```

## Example components

### Button (primary)

```css
.btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-text);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-weight: 600;
  border: none;
}
```

### Panel (dark card on the light page — Nexflow's embedded dashboard mockup, applied to every section of our app)

```css
.panel {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  position: relative; /* for the corner-bracket ::before/::after accents */
}
```

### Status pill (bounty status / wallet banners — Nexflow's Completed/Running/Failed badges)

```css
.status-badge {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid currentColor;
  background: color-mix(in srgb, currentColor 15%, transparent);
}
.status-badge.success { color: var(--color-success); }
.status-badge.warning { color: var(--color-warning); }
.status-badge.error { color: var(--color-error); }
```

### Form input

```css
.input {
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  font-family: var(--font-body);
}
```

## Wiring

Plain CSS custom properties in `index.html`'s single `<style>` block (no build step, no framework — the whole app is one static HTML file). Fonts loaded via a Google Fonts `<link>` in `<head>`: `family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600`. `docs/hackathon-ui/ui-plan.md` lists the restyling tasks applied directly to that same file.
