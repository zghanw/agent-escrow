import { useState } from "react";
import { Link } from "react-router-dom";
import { GL } from "./gl";
import { Pill } from "./Pill";
import { LandingButton } from "./Button";

export function Hero() {
  const [hovering, setHovering] = useState(false);
  return (
    <div className="flex flex-col h-svh justify-between">
      <GL hovering={hovering} />

      <div className="pb-16 mt-auto text-center relative">
        <Pill className="mb-6">BOT CHAIN TESTNET</Pill>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient">
          Trust-minimized <br />
          <i className="font-light">agent escrow</i>
        </h1>
        <p className="font-mono text-sm sm:text-base text-white/60 text-balance mt-8 max-w-[440px] mx-auto">
          Post a BOT bounty, an agent claims it and delivers, you release payment on-chain. No middleman, no "trust me" IOU.
        </p>

        <Link className="contents max-sm:hidden" to="/app">
          <LandingButton className="mt-14" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            [Launch App]
          </LandingButton>
        </Link>
        <Link className="contents sm:hidden" to="/app">
          <LandingButton size="sm" className="mt-14" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            [Launch App]
          </LandingButton>
        </Link>
      </div>
    </div>
  );
}
