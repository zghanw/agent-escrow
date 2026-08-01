import { useCallback, useEffect, useState } from "react";
import type { WalletHistoryResult } from "@/lib/walletHistory";
import { Panel } from "./Panel";
import { WalletHistoryPanel } from "./WalletHistoryPanel";

export function ProfilePanel({
  signerAddress,
  explorerBase,
  loadHistory,
  historyVersion,
  onSelectBounty,
}: {
  signerAddress: string | null;
  explorerBase: string;
  loadHistory: (address: string, force?: boolean) => Promise<WalletHistoryResult>;
  historyVersion: number;
  onSelectBounty: (id: bigint) => void;
}) {
  const [result, setResult] = useState<WalletHistoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentResult = signerAddress && result?.address.toLowerCase() === signerAddress.toLowerCase() ? result : null;

  const load = useCallback(async (force: boolean) => {
    if (!signerAddress) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await loadHistory(signerAddress, force));
    } catch {
      setError("Could not load your profile. Try refreshing the website.");
    } finally {
      setLoading(false);
    }
  }, [loadHistory, signerAddress]);

  useEffect(() => {
    let active = true;
    if (!signerAddress) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    loadHistory(signerAddress).then(
      (next) => {
        if (active) setResult(next);
      },
      () => {
        if (active) setError("Could not load your profile. Try refreshing the website.");
      },
    ).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [historyVersion, loadHistory, signerAddress]);

  return (
    <Panel heading="Profile">
      {!signerAddress && <p className="text-sm text-[var(--muted-foreground)]">Connect your wallet to view your profile.</p>}
      {signerAddress && loading && !currentResult && <p className="text-sm text-[var(--muted-foreground)]">Loading profile...</p>}
      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
      {currentResult && (
        <WalletHistoryPanel
          result={currentResult}
          explorerBase={explorerBase}
          onSelectBounty={onSelectBounty}
          onRefresh={() => void load(true)}
          refreshing={loading}
        />
      )}
    </Panel>
  );
}
