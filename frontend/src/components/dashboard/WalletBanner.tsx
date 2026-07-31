import { Button } from "@/components/ui/button";
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
        {!connected && <Button onClick={onConnect}>Connect Wallet</Button>}
        {connected && (
          <Button variant="outline" onClick={onSwitchAccount}>
            Switch Account
          </Button>
        )}
      </div>
    </div>
  );
}
