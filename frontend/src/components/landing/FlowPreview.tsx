const STEPS = ["Funded", "Accepted", "Submitted", "Released"];

// Static mechanism preview - not bound to any real bounty, just teaches the
// state machine before the visitor is asked to trust it with funds.
export function FlowPreview() {
  return (
    <div className="flow-preview flex items-center justify-center mx-auto mt-5 max-w-[360px]" aria-hidden="true">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <span className="flow-dot" style={{ "--i": i } as React.CSSProperties} />
            <span className="font-mono uppercase text-[0.62rem] tracking-wide text-white/60">{step}</span>
          </div>
          {i < STEPS.length - 1 && <span className="flow-line" />}
        </div>
      ))}
    </div>
  );
}
