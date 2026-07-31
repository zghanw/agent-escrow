import { useState } from "react";
import { Link } from "react-router-dom";
import { GL } from "./gl";
import { Pill } from "./Pill";
import { LandingButton } from "./Button";
import { VerificationPanel } from "./VerificationPanel";
import { FlowPreview } from "./FlowPreview";

export function Hero() {
  const [hovering, setHovering] = useState(false);
  return (
    <div className="flex flex-col h-svh justify-between">
      <GL hovering={hovering} />

      <div className="pb-16 mt-auto text-center relative px-5 sm:px-6">
        <Pill className="mb-6">BOT CHAIN TESTNET</Pill>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient">
          Trust-minimized <br />
          <i className="font-light">agent escrow</i>
        </h1>
        <p className="font-mono text-sm sm:text-base text-white/60 text-balance mt-8 max-w-[440px] mx-auto">
          Fund a designated agent, verify submitted work, and release payment on-chain. Symmetric deadlines protect both sides.
        </p>

        <VerificationPanel />
        <FlowPreview />

        <Link className="contents max-sm:hidden" to="/connect">
          <LandingButton className="mt-10" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            [Launch App]
          </LandingButton>
        </Link>
        <Link className="contents sm:hidden" to="/connect">
          <LandingButton size="sm" className="mt-10" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            [Launch App]
          </LandingButton>
        </Link>
        <p className="font-mono text-[0.7rem] text-white/60 mt-3 uppercase tracking-wide">Needs MetaMask &middot; BOT Chain testnet</p>
      </div>
    </div>
  );
}
