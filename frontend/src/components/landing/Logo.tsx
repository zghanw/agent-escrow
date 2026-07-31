import { cn } from "@/lib/utils";
import logoMark from "@/assets/logo.png";

export const Logo = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)} {...props}>
      <img src={logoMark} alt="" className="h-5 w-5 md:h-6 md:w-6 object-contain shrink-0" />
      <span className="font-mono uppercase tracking-wide text-white text-[13px] md:text-[15px] leading-none whitespace-nowrap">
        AGENT ESCROW
      </span>
    </div>
  );
};
