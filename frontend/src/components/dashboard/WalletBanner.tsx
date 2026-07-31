import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { shortAddr } from "@/lib/contract";

export function WalletBanner({
  signerAddress,
  onConnect,
  onSwitchAccount,
}: {
  signerAddress: string | null;
  onConnect: () => void;
  onSwitchAccount: () => void;
}) {
  const connected = Boolean(signerAddress);
  return (
    <div className={`banner ${connected ? "good" : "warn"}`}>
      <span>{connected ? `Connected: ${shortAddr(signerAddress!)}` : "Wallet not connected."}</span>
      <div className="flex gap-2">
        {!connected && <LiquidButton onClick={onConnect}>Connect Wallet</LiquidButton>}
        {connected && (
          <LiquidButton variant="outline" onClick={onSwitchAccount}>
            Switch Account
          </LiquidButton>
        )}
      </div>
    </div>
  );
}
