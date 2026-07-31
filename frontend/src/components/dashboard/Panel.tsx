import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  heading,
  children,
  className,
}: {
  heading: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      <h2 className="panel-heading">{heading}</h2>
      {children}
    </section>
  );
}
