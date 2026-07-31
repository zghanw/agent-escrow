import { Button } from "@/components/ui/button";

export function NetworkBanner({ show, onFix }: { show: boolean; onFix: () => void }) {
  if (!show) return null;
  return (
    <div className="banner bad">
      <span>Wrong network - this app runs on BOT Chain testnet.</span>
      <Button variant="outline" onClick={onFix}>
        Add / Switch to BOT Chain
      </Button>
    </div>
  );
}
