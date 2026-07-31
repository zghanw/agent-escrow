import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { px } from "./utils";

const buttonVariants = cva(
  "group/button inline-flex relative uppercase border font-mono cursor-pointer items-center font-medium justify-center gap-2 whitespace-nowrap ease-out transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none [clip-path:polygon(var(--poly-roundness)_0,calc(100%_-_var(--poly-roundness))_0,100%_0,100%_calc(100%_-_var(--poly-roundness)),calc(100%_-_var(--poly-roundness))_100%,0_100%,0_calc(100%_-_var(--poly-roundness)),0_var(--poly-roundness))]",
  {
    variants: {
      variant: {
        default:
          "bg-black border-[color:var(--landing-primary)] text-white shadow-[0_8px_28px_-10px_var(--landing-primary)] hover:shadow-[0_10px_36px_-6px_var(--landing-primary)] focus-visible:ring-2 focus-visible:ring-[color:var(--landing-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
      },
      size: {
        default: "h-16 px-6 text-base",
        sm: "h-14 px-6 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function LandingButton({
  className,
  variant,
  size,
  children,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  const polyRoundness = 16;
  const hypotenuse = polyRoundness * 2;
  const hypotenuseHalf = polyRoundness / 2 - 1.5;

  return (
    <Comp
      style={{ "--poly-roundness": px(polyRoundness) } as React.CSSProperties}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      <span
        style={{ "--h": px(hypotenuse), "--hh": px(hypotenuseHalf) } as React.CSSProperties}
        className="absolute inline-block w-[var(--h)] top-[var(--hh)] left-[var(--hh)] h-[2px] -rotate-45 origin-top -translate-x-1/2 bg-[color:var(--landing-primary)]"
      />
      <span
        style={{ "--h": px(hypotenuse), "--hh": px(hypotenuseHalf) } as React.CSSProperties}
        className="absolute w-[var(--h)] bottom-[var(--hh)] right-[var(--hh)] h-[2px] -rotate-45 translate-x-1/2 bg-[color:var(--landing-primary)]"
      />
      <span className="landing-btn-pulse" aria-hidden="true" />
      {children}
    </Comp>
  );
}

export { LandingButton, buttonVariants };
