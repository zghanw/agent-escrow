import { useState } from "react";
import { DropdownMenu } from "radix-ui";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavMenuProps {
  className?: string;
}

// Universal nav menu (desktop + mobile) - GitHub and Launch App both live
// here now instead of one centered link and one top-right link, which used
// to collide with the hero's pill on shorter viewports.
export const NavMenu = ({ className }: NavMenuProps) => {
  // Radix portals to document.body by default, which sits outside
  // .landing-theme's DOM subtree - CSS custom properties scoped to that
  // class (--landing-primary etc.) don't inherit there, so the menu falls
  // back to the root (light-theme) tokens. Portal inside .landing-theme
  // instead so the themed variables stay in scope.
  const [container, setContainer] = useState<HTMLElement | null>(null);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          ref={(el) => setContainer(el?.closest(".landing-theme") ?? null)}
          className={cn(
            "group relative size-11 grid place-items-center text-white/70 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--landing-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            className
          )}
          aria-label="Open menu"
        >
          <Menu className="absolute transition-all duration-300 ease-out group-data-[state=open]:rotate-90 group-data-[state=open]:opacity-0 group-data-[state=open]:scale-75" size={22} />
          <X className="absolute transition-all duration-300 ease-out rotate-[-90deg] opacity-0 scale-75 group-data-[state=open]:rotate-0 group-data-[state=open]:opacity-100 group-data-[state=open]:scale-100" size={22} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal container={container ?? undefined}>
        <DropdownMenu.Content
          align="end"
          sideOffset={14}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="nav-menu-content z-50 min-w-[190px] bg-black/90 backdrop-blur-md border border-[color:var(--landing-border)] p-1.5
            data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 duration-200"
        >
          <span className="verify-bracket verify-bracket-tl" aria-hidden="true" />
          <span className="verify-bracket verify-bracket-br" aria-hidden="true" />

          <DropdownMenu.Item asChild className="nav-menu-item outline-none">
            <a href="https://github.com/zghanw/agent-escrow" target="_blank" rel="noopener">
              GitHub
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className="nav-menu-item outline-none">
            <a
              href="https://x.com/shisonokyojin39/status/2083593014170247349"
              target="_blank"
              rel="noopener"
            >
              Presentation
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className="nav-menu-item nav-menu-item-primary outline-none">
            <Link to="/connect">Launch App</Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
