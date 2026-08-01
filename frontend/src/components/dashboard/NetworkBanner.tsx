import { LiquidButton } from "@/components/ui/liquid-glass-button";

export function NetworkBanner({ show, onFix }: { show: boolean; onFix: () => void }) {
  if (!show) return null;
  return (
    <div className="banner bad">
      <span>Wrong network - this app runs on BOT Chain.</span>
      <LiquidButton variant="outline" onClick={onFix}>
        Add / Switch to BOT Chain
      </LiquidButton>
    </div>
  );
}
