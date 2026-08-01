# Presentation Links

## Goal

Make the Agent Escrow X presentation easy to find from the landing page and README while keeping the private Claude handoff local.

## Design

- Add an external `Presentation` item to the landing-page hamburger menu between `GitHub` and `Launch App`.
- Open the presentation in a new browser tab with the same safe external-link attributes used by the GitHub item.
- Add a `Presentation` link to the README header beside the existing Live App, Verified Contract, and Source links.
- Use this URL in both locations: `https://x.com/shisonokyojin39/status/2083593014170247349`.
- Add `/CLAUDE.md` to the root `.gitignore` and remove `CLAUDE.md` from Git tracking without deleting the local file.

## Content Constraints

- Do not add em dashes or emoji to README content.
- Do not change the existing menu styling or primary Launch App treatment.
- Do not add an icon, dependency, route, or X embed.

## Verification

- Confirm the same exact X URL appears in the landing menu and README.
- Confirm the menu link opens externally and includes safe relationship attributes.
- Confirm the README contains no em dash characters or emoji.
- Run the frontend production build and lint.
- Confirm `CLAUDE.md` remains on disk but is ignored and no longer tracked.
