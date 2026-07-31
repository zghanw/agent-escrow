import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

export const Header = () => {
  return (
    <div className="fixed z-50 pt-8 md:pt-14 top-0 left-0 w-full">
      <header className="flex items-center justify-between container mx-auto px-4 md:px-8">
        <Link to="/">
          <Logo className="w-[140px] md:w-[160px]" />
        </Link>
        <a
          className="max-lg:hidden absolute left-1/2 -translate-x-1/2 uppercase font-mono text-white/60 hover:text-white duration-150 transition-colors ease-out"
          href="https://github.com/zghanw/agent-escrow"
          target="_blank"
          rel="noopener"
        >
          GitHub
        </a>
        <Link
          className="uppercase max-lg:hidden transition-colors ease-out duration-150 font-mono text-[color:var(--landing-primary)] hover:text-[color:var(--landing-primary)]/80"
          to="/app"
        >
          Launch App
        </Link>
        <MobileMenu />
      </header>
    </div>
  );
};
