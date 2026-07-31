import type { StatusName } from "@/lib/contract";

const STEPS = ["Created", "Accepted", "Submitted", "Released"];

export function StatusTracker({
  status,
  workDeadline,
  reviewDeadline,
}: {
  status: StatusName;
  workDeadline: number;
  reviewDeadline: number;
}) {
  let reachedIndex: number;
  let terminalLabel: "Refunded" | "Cancelled" | null = null;
  if (status === "Open") reachedIndex = 0;
  else if (status === "Accepted") reachedIndex = 1;
  else if (status === "Submitted") reachedIndex = 2;
  else if (status === "Released") reachedIndex = 3;
  else {
    terminalLabel = status;
    reachedIndex = reviewDeadline > 0 ? 2 : workDeadline > 0 ? 1 : 0;
  }

  return (
    <div className={`tracker${terminalLabel ? " refunded" : ""}`}>
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
      {terminalLabel && <span className="tracker-refunded-tag">&rarr; {terminalLabel}</span>}
    </div>
  );
}
