export const Logo = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="1" y="1" width="18" height="18" rx="2" stroke="white" strokeWidth="2" />
      <path d="M6 16V8l4 5 4-5v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="28" y="21" fill="white" fontFamily="Geist Mono Variable, monospace" fontSize="15" letterSpacing="0.5">
        AGENT ESCROW
      </text>
    </svg>
  );
};
