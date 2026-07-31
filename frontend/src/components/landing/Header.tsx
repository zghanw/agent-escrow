import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { NavMenu } from "./NavMenu";

export const Header = () => {
  return (
    <div className="fixed z-50 pt-8 md:pt-14 top-0 left-0 w-full">
      <header className="flex items-center justify-between container mx-auto px-4 md:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <NavMenu />
      </header>
    </div>
  );
};
