# Judge-First README Design

## Goal

Turn the repository README into a concise proof page for hackathon judges, while giving GitHub visitors enough technical depth to trust, run, and star the project.

## Audience order

1. Hackathon judges validating the working product, originality, and deployment.
2. GitHub visitors deciding whether the project is credible and worth starring.
3. Developers evaluating the contract, architecture, tests, and local setup.

## Content hierarchy

The first screen will contain the project name, one-line value proposition, live app link, verified contract link, compact status badges, and a strong live-product screenshot.

The remaining sections will follow this order:

1. Visible proof points
2. Sixty-second demo flow
3. Screenshot gallery
4. Problem and differentiation
5. Contract flow and security
6. Architecture
7. Local development and deployment
8. Contract reference
9. Project documentation and contribution call to action

## Screenshot strategy

Screenshots will be captured from the live website at a consistent desktop viewport and stored under `docs/readme/` with short, descriptive filenames.

The complete capture set is:

- Landing page
- Wallet access ledger
- Bounties tab
- Create tab
- Activity tab
- Profile tab
- Bounty created state
- Bounty claimed state
- Bounty released state
- Agent rating state
- Refund state

The README will not display eleven large images in a single vertical sequence. It will use:

- One full-width landing image near the top
- A compact happy-path sequence for Create, Claim, Release, and Rate
- A two-column product gallery for the remaining pages and the Refund branch

If a live wallet transaction cannot be captured safely in the automated browser, existing verified QA captures may be reused only when they accurately match the current UI. Missing transaction states will be reported instead of fabricated.

## Accuracy rules

- State the verified testnet deployment as testnet.
- Do not imply that a mainnet contract exists unless a verified address is present in the repository.
- Derive contract behavior, security claims, commands, and test counts from source code and passing commands.
- Do not invent usage metrics, testimonials, partners, or audit claims.
- Distinguish tested security properties from an external security audit.

## Visual rules

- No em dashes.
- No emojis.
- Use restrained badges and tables.
- Keep paragraphs short and front-load evidence.
- Use one visual per distinct product state.
- Use descriptive alt text for every image.
- Keep image paths relative so they render on GitHub forks.

## Verification

- Open the live site and inspect every route and tab.
- Confirm screenshot files are readable and use consistent dimensions.
- Run the contract tests and frontend build.
- Validate all local README links and image paths.
- Scan the README for em dashes, emoji-style symbols, placeholders, stale claims, and unsupported statements.

