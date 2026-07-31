# Bug-pass QA findings: Agent Escrow

Live-tested against https://zghanw.github.io/agent-escrow/ with Playwright MCP at 1440x900 and 390x844. Reached the wallet-gated `/app` dashboard by injecting a mock EIP-1193 `window.ethereum` (fake account, `eth_chainId 0x3c8`) before mount, forwarding unhandled RPC methods to the real public RPC (`https://rpc.bohr.life`) so contract reads reflected real chain state. No real transactions were signed (not achievable without real MetaMask).

### Finding 1: README.md and spec.md describe an architecture the app no longer has
- **Severity:** Important
- **Platform:** web
- **How found:** Code read
- **Location:** `README.md:34-38,73-75`, `docs/hackathon-build/spec.md:8-29`; actual: `frontend/` (React 19 + Vite + TS + Tailwind v4 + shadcn/ui + react-router + `@react-three/fiber`/`three`)
- **What happens:** Both docs claim "Single static `index.html` - vanilla JavaScript, ethers.js v6 loaded via CDN, no build step, no framework, no backend." The shipped app is a React SPA with client-side routing (`HashRouter`), shadcn/ui components, and a Three.js 3D vault on the dashboard, per the "Migrate frontend to React + Vite + shadcn/ui" and "Redesign frontend..." commits, which post-date both docs.
- **Why it matters:** the disqualifier checklist requires "README explains what changed if based on any template." A judge who reads "no build step, no framework" then opens a visibly modern SPA gets a contradiction that undermines trust in the rest of the README's claims (e.g. contract verification).
- **Evidence:** `README.md:36` quoted above; `frontend/package.json` deps: `react@19.2.8`, `react-router-dom@7.18.2`, `@react-three/fiber@9.6.1`, `three@0.185.1`, `shadcn@4.16.0`.

### Finding 2: Create-bounty form silently discards the user's input whenever the transaction doesn't succeed
- **Severity:** Important
- **Platform:** web
- **How found:** Live (screenshot evidence) + code read
- **Location:** `frontend/src/components/dashboard/CreateBountyPanel.tsx:17-21`; root cause `frontend/src/hooks/useEscrow.ts:300-338`
- **What happens:** `handleCreate` unconditionally clears both fields after `await onCreate(...)`. `createBounty` never rethrows on failure - every error path (validation, wallet rejection, gas failure, RPC error) is caught internally, logged, and returns normally. So `handleCreate` always proceeds to wipe the form. Live-reproduced: typed a description + "0.01", clicked Create Bounty, the tx failed ("Create failed: could not coalesce error"), and both fields had already reverted to empty placeholders underneath the error.
- **Why it matters:** this is the app's single primary write action (30%-weighted "main action works" criterion). Any real-world hiccup (habitual MetaMask "Reject", insufficient gas, flaky RPC) forces the user to retype the whole bounty instead of retrying.
- **Evidence:** `docs/hackathon-qa/screenshots/create-bounty-failed-cleared.png` - empty placeholders directly under the red failure log line.

### Finding 3: Switching MetaMask networks mid-session leaves the app believing it's still on BOT Chain (uncaught ethers NETWORK_ERROR, repeating console-error loop)
- **Severity:** Important
- **Platform:** web
- **How found:** Live (console + DOM evidence) + code read
- **Location:** `frontend/src/hooks/useEscrow.ts:133-143` (`refreshNetwork`), `:370-374` (`onChainChanged`), `:147` (`BrowserProvider` constructed without `{network:"any"}`)
- **What happens:** ethers' `BrowserProvider` treats a runtime chain change as fatal (`NETWORK_ERROR`) unless constructed with `{network:"any"}`. `refreshNetwork()` has no try/catch around `provider.getNetwork()`, and `onChainChanged` has no `.catch`, so `setOnBotChain(...)` never runs - `onBotChain` stays stuck `true`. Live-reproduced: connected on chain 968, fired the wallet's `chainChanged` for chain `0x1`; `.banner.bad` (wrong-network banner) stayed absent from the DOM, and the console captured the same `NETWORK_ERROR` **159 times** in under a minute (ethers' event-polling for the live-activity feed retries and re-throws every tick, forever).
- **Why it matters:** the rubric's proof point ("balances update on screen in seconds, no reload") depends on these listeners working. Anyone whose MetaMask defaults to a different chain and switches after auto-connect gets a dashboard that keeps claiming the network is fine, with the wrong-network safety net silently dead and the console filling indefinitely.
- **Evidence:** `docs/hackathon-qa/screenshots/network-switch-banner-missing.png`; console capture, 159x `Error: network changed: 968 => 1 (event="changed", code=NETWORK_ERROR, version=6.17.0)` at `useEscrow-yosovrup.js:1:9540`.

### Finding 4: Failed write transactions can surface ethers' opaque "could not coalesce error" instead of an actionable message
- **Severity:** Minor
- **Platform:** web
- **How found:** Live (partial repro via synthetic error) + code read
- **Location:** `frontend/src/hooks/useEscrow.ts:227-229` (`requireSignerContract`), `:280-298` (`runTx`)
- **What happens:** `docs/hackathon-build/progress.md` already documents this exact error message occurring once, for wallet-connect, fixed by bypassing ethers via direct `window.ethereum.request()`. That fix (`useEscrow.ts:165-185`) was applied only to `connectWallet`. `createBounty`/`claim`/`release`/`refund`/`rate` all still route through `requireSignerContract()` → plain `ethers.Contract` + `signerRef.current`, the same `BrowserProvider` machinery implicated originally. If BOT Chain's RPC returns a non-standard error shape (already shown to happen once), users get "could not coalesce error" instead of something actionable. Directly observed during Finding 2's repro, though via a synthetic mock signer - not proof the exact failure recurs with real MetaMask, hence Minor.
- **Evidence:** `docs/hackathon-build/progress.md` "Post-Task-7 fixes" entry; side-by-side of `useEscrow.ts:165-185` vs `:227-229`/`:340-355`.

**Checked, no bug found:** HashRouter deep-links (`#/`, `#/connect`, `#/app`) all load cleanly, no GH Pages 404; no-wallet error state renders correctly with no console errors; WalletGate auto-detects an already-authorized wallet and auto-navigates to `/app`; loading a non-existent bounty ID shows a clean error, not a blank screen; landing/dashboard both read real on-chain state (bounty count = 0, consistent with progress.md's redeployed contract having no bounties yet); no 404s on initial asset load; landing + `/connect` responsive at 1440x900 and 390x844.
