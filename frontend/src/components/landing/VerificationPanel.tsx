import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, BOTCHAIN_TESTNET, EXPLORER_BASE, shortAddr } from "@/lib/contract";
import { px } from "./utils";

// Read-only proof of life: no wallet required, just the public RPC. If the
// public endpoint is unreachable the row is omitted rather than faked.
function useLiveBountyCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const provider = new ethers.JsonRpcProvider(BOTCHAIN_TESTNET.rpcUrls[0]);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    contract
      .bountyCount()
      .then((n: bigint) => {
        if (!cancelled) setCount(Number(n));
      })
      .catch(() => {
        /* public RPC hiccup - row just stays hidden, no fabricated number */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}

export function VerificationPanel() {
  const bountyCount = useLiveBountyCount();
  const polyRoundness = 8;

  return (
    <div
      style={{ "--poly-roundness": px(polyRoundness) } as React.CSSProperties}
      className="verify-panel relative bg-black/60 backdrop-blur-sm border border-[color:var(--landing-border)] text-left font-mono text-xs sm:text-sm mx-auto w-full max-w-[420px] px-4 py-3.5 sm:px-5 sm:py-4 mt-9"
    >
      <span className="verify-bracket verify-bracket-tl" aria-hidden="true" />
      <span className="verify-bracket verify-bracket-br" aria-hidden="true" />

      <div className="flex items-center justify-between gap-3">
        <span className="uppercase tracking-wide text-white/40">Contract</span>
        <a
          href={`${EXPLORER_BASE}/address/${CONTRACT_ADDRESS}#code`}
          target="_blank"
          rel="noopener"
          className="text-white hover:text-[color:var(--landing-primary)] transition-colors duration-150"
        >
          {shortAddr(CONTRACT_ADDRESS)}
        </a>
      </div>

      <div className="flex items-center justify-between gap-3 mt-2">
        <span className="uppercase tracking-wide text-white/40">Status</span>
        <span className="inline-flex items-center gap-1.5 text-[color:var(--landing-primary)]">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M1.5 5.2L3.8 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Verified on BOT Chain
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 mt-2">
        <span className="uppercase tracking-wide text-white/40">Bounties created</span>
        <span className="text-white tabular-nums">{bountyCount === null ? "—" : bountyCount}</span>
      </div>
    </div>
  );
}
