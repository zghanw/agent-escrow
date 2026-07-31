import { ethers } from "ethers";
import type { StatusName } from "@/lib/contract";

const STEPS = ["Created", "Claimed", "Released"];

export function StatusTracker({ status, agent }: { status: StatusName; agent: string }) {
  let reachedIndex: number;
  let refunded = false;
  if (status === "Open") reachedIndex = 0;
  else if (status === "Claimed") reachedIndex = 1;
  else if (status === "Released") reachedIndex = 2;
  else {
    refunded = true;
    reachedIndex = agent === ethers.ZeroAddress ? 0 : 1;
  }

  return (
    <div className={`tracker${refunded ? " refunded" : ""}`}>
      {STEPS.map((label, i) => (
        <div className="flex items-center" key={label}>
          {i > 0 && <div className={`tracker-line${i <= reachedIndex ? " done" : ""}`} />}
          <div
            className={`tracker-step${
              i < reachedIndex || (i === reachedIndex && status === "Released") ? " done" : i === reachedIndex ? " current" : ""
            }`}
          >
            <div className="tracker-dot" />
            <div className="tracker-label">{label}</div>
          </div>
        </div>
      ))}
      {refunded && <span className="tracker-refunded-tag">&rarr; Refunded</span>}
    </div>
  );
}
