import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/landing/Logo";
import { useEscrow } from "@/hooks/useEscrow";
import { shortAddr } from "@/lib/contract";

// SEED: established with the user before implementation; re-run
// `/impeccable document` once this build settles so DESIGN.md captures its
// real tokens. Direction: "Signature Ritual" - connecting a wallet reads as
// entering it into a ledger, not clicking through a checklist. Assigned by
// concept-seed.mjs --scope surface --mode operate (seed 5a756c22, index 6).

const ROW = {
  pending: "text-white/30",
  active: "text-white/70",
  bad: "text-[var(--gate-bad)]",
  good: "text-[var(--gate-good)]",
} as const;

export default function WalletGate() {
  const navigate = useNavigate();
  const escrow = useEscrow();
  const { signerAddress, onBotChain, log, busy } = escrow;

  const walletDone = Boolean(signerAddress);
  const networkDone = walletDone && onBotChain;
  const granted = walletDone && networkDone;

  useEffect(() => {
    if (!granted) return;
    const t = setTimeout(() => navigate("/app"), 1100);
    return () => clearTimeout(t);
  }, [granted, navigate]);

  return (
    <div className="landing-theme min-h-svh flex flex-col">
      <header className="pt-8 md:pt-10 px-5 md:px-8">
        <Link to="/" className="inline-block">
          <Logo />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px]">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-white/40 text-center mb-2">Access ledger</p>
          <h1 className="font-sentient text-3xl sm:text-4xl text-center font-light mb-8">Sign in to continue</h1>

          <div className="gate-ledger relative border border-[color:var(--landing-border)] bg-black/50 backdrop-blur-sm">
            <span className="verify-bracket verify-bracket-tl" aria-hidden="true" />
            <span className="verify-bracket verify-bracket-br" aria-hidden="true" />

            {/* Wallet row */}
            <div className="gate-row flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-white/40 mb-1">01 &middot; Wallet</p>
                <p className={`font-mono text-sm ${walletDone ? ROW.good : ROW.active}`}>
                  {walletDone ? shortAddr(signerAddress!) : "Not connected"}
                </p>
              </div>
              {!walletDone && (
                <button
                  onClick={escrow.connectWallet}
                  disabled={busy}
                  className="font-mono text-xs uppercase tracking-wide border border-[color:var(--landing-primary)] text-[color:var(--landing-primary)] px-3.5 py-2 hover:bg-[color:var(--landing-primary)]/10 transition-colors duration-150 disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--landing-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Connect
                </button>
              )}
              {walletDone && <CheckMark />}
            </div>

            <div className="gate-divider" />

            {/* Network row */}
            <div className={`gate-row flex items-center justify-between gap-4 px-5 py-4 transition-opacity duration-300 ${walletDone ? "opacity-100" : "opacity-35"}`}>
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-white/40 mb-1">02 &middot; Network</p>
                <p className={`font-mono text-sm ${!walletDone ? ROW.pending : networkDone ? ROW.good : ROW.bad}`}>
                  {!walletDone ? "—" : networkDone ? "BOT Chain testnet" : "Wrong network"}
                </p>
              </div>
              {walletDone && !networkDone && (
                <button
                  onClick={escrow.addOrSwitchNetwork}
                  disabled={busy}
                  className="font-mono text-xs uppercase tracking-wide border border-[color:var(--landing-primary)] text-[color:var(--landing-primary)] px-3.5 py-2 hover:bg-[color:var(--landing-primary)]/10 transition-colors duration-150 disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--landing-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Switch
                </button>
              )}
              {networkDone && <CheckMark />}
            </div>

            <div className="gate-divider" />

            {/* Access row */}
            <div className={`gate-row flex items-center justify-between gap-4 px-5 py-4 transition-opacity duration-300 ${networkDone ? "opacity-100" : "opacity-35"}`}>
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-white/40 mb-1">03 &middot; Access</p>
                <p className={`font-mono text-sm ${granted ? ROW.good : ROW.pending}`}>{granted ? "Granted - entering app" : "Locked"}</p>
              </div>
              {granted && <Stamp />}
            </div>
          </div>

          {log.kind === "err" && <p className="font-mono text-xs text-[var(--gate-bad)] text-center mt-4">{log.message}</p>}

          <p className="font-mono text-[0.7rem] text-white/35 text-center mt-6">
            You'll approve this in your wallet. No funds move here &mdash; this only reads your address and network.
          </p>
        </div>
      </main>
    </div>
  );
}

function CheckMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 10 10" fill="none" className="gate-check shrink-0" aria-hidden="true">
      <path d="M1.5 5.2L3.8 7.5L8.5 2.5" stroke="var(--gate-good)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Stamp() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="gate-stamp shrink-0" aria-hidden="true">
      <circle cx="15" cy="15" r="13" stroke="var(--gate-good)" strokeWidth="1.5" />
      <path d="M9 15.5L13 19.5L21 10.5" stroke="var(--gate-good)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
