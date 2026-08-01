import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { shortAddr } from "@/lib/contract";
import { formatBotAmount } from "@/lib/walletHistory";

export function WalletBanner({
  signerAddress,
  botBalance,
  onConnect,
  onSwitchAccount,
}: {
  signerAddress: string | null;
  botBalance: bigint | null;
  onConnect: () => void;
  onSwitchAccount: () => void;
}) {
  const connected = Boolean(signerAddress);
  return (
    <div className={`banner ${connected ? "good" : "warn"}`}>
      <span>{connected ? `Connected: ${shortAddr(signerAddress!)}` : "Wallet not connected."}</span>
      <div className="flex gap-2">
        {connected && (
          <span className="wallet-balance" aria-label="Connected wallet BOT balance">
            {botBalance === null ? "Balance loading" : `${formatBotAmount(botBalance, 4)} BOT`}
          </span>
        )}
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
