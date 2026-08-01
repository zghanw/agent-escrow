import { useState } from "react";
import { Input } from "@/components/ui/input";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { normalizeWalletAddress, type WalletHistoryResult } from "@/lib/walletHistory";
import { Panel } from "./Panel";
import { WalletHistoryPanel } from "./WalletHistoryPanel";

export function WalletLookupPanel({
  explorerBase,
  loadHistory,
  onSelectBounty,
}: {
  explorerBase: string;
  loadHistory: (address: string, force?: boolean) => Promise<WalletHistoryResult>;
  onSelectBounty: (id: bigint) => void;
}) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<WalletHistoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (force: boolean) => {
    const address = normalizeWalletAddress(force && result ? result.address : input);
    if (!address) {
      setError("Enter a valid non-zero wallet address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await loadHistory(address, force);
      setResult(next);
      setInput(next.address);
    } catch {
      setError("Could not load wallet history. Try refreshing the website.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel heading="Look up any wallet">
      <form
        className="wallet-lookup-form"
        onSubmit={(event) => {
          event.preventDefault();
          void load(false);
        }}
      >
        <div className="min-w-0 flex-1">
          <label className="field-label mt-0!" htmlFor="wallet-lookup-address">
            Wallet address
          </label>
          <Input
            id="wallet-lookup-address"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="0x..."
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <LiquidButton type="submit" disabled={loading} className="wallet-lookup-submit">
          {loading && !result ? "Loading" : "View history"}
        </LiquidButton>
      </form>

      {error && <p className="mt-3 text-sm text-[var(--bad)]">{error}</p>}
      {!result && !error && (
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          Enter any BOT Chain wallet to view its read-only escrow history and agent rating.
        </p>
      )}
      {result && (
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <WalletHistoryPanel
            result={result}
            explorerBase={explorerBase}
            onSelectBounty={onSelectBounty}
            onRefresh={() => void load(true)}
            refreshing={loading}
          />
        </div>
      )}
    </Panel>
  );
}
