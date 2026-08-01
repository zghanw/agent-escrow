import { useEffect, useMemo, useState } from "react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { shortAddr } from "@/lib/contract";
import {
  filterWalletBounties,
  formatBotAmount,
  takeWalletBounties,
  type WalletHistoryResult,
  type WalletRole,
} from "@/lib/walletHistory";

const PAGE_SIZE = 10;

export function WalletHistoryPanel({
  result,
  explorerBase,
  onSelectBounty,
  onRefresh,
  refreshing,
}: {
  result: WalletHistoryResult;
  explorerBase: string;
  onSelectBounty: (id: bigint) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const [role, setRole] = useState<WalletRole>("requester");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filtered = useMemo(
    () => filterWalletBounties(result.address, result.bounties, role),
    [result, role],
  );
  const page = takeWalletBounties(filtered, visibleCount);
  const { summary } = result;

  useEffect(() => setVisibleCount(PAGE_SIZE), [result.address, role]);

  const stats = [
    ["Total earned", `${formatBotAmount(summary.totalEarned)} BOT`],
    ["Total paid out", `${formatBotAmount(summary.totalPaidOut)} BOT`],
    ["Active", summary.activeCount.toString()],
    ["Total bounties", summary.totalCount.toString()],
    [
      "Agent rating",
      summary.ratingAverage === null
        ? "No ratings"
        : `${summary.ratingAverage.toFixed(1)} / 5 (${summary.ratingCount})`,
    ],
  ];

  return (
    <div className="space-y-4">
      <div className="wallet-history-heading">
        <div className="min-w-0">
          <p className="field-label mt-0!">Wallet</p>
          <a
            className="mono wallet-address-link"
            href={`${explorerBase}/address/${result.address}`}
            target="_blank"
            rel="noopener"
          >
            {result.address} ↗
          </a>
        </div>
        <LiquidButton type="button" variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing" : "Refresh"}
        </LiquidButton>
      </div>

      <dl className="wallet-stats">
        {stats.map(([label, value]) => (
          <div className="wallet-stat" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <Tabs value={role} onValueChange={(value) => setRole(value as WalletRole)}>
        <TabsList className="wallet-role-tabs">
          <TabsTrigger value="requester">As requester</TabsTrigger>
          <TabsTrigger value="agent">As agent</TabsTrigger>
        </TabsList>

        {(["requester", "agent"] as const).map((tabRole) => (
          <TabsContent value={tabRole} key={tabRole} className="mt-3">
            {role === tabRole && filtered.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">
                No bounties found for this wallet as {tabRole === "requester" ? "a requester" : "an agent"}.
              </p>
            )}
            {role === tabRole && page.items.length > 0 && (
              <div className="wallet-history-list">
                {page.items.map((bounty) => {
                  const counterparty = tabRole === "requester" ? bounty.agent : bounty.requester;
                  return (
                    <button
                      type="button"
                      className="wallet-history-row"
                      key={bounty.id.toString()}
                      onClick={() => onSelectBounty(bounty.id)}
                    >
                      <span className="wallet-history-main">
                        <span className="mono">Bounty #{bounty.id.toString()}</span>
                        <span className="wallet-history-description">{bounty.description}</span>
                        <span className="wallet-history-counterparty">
                          {tabRole === "requester" ? "Agent" : "Requester"}: {shortAddr(counterparty)}
                        </span>
                      </span>
                      <span className="wallet-history-meta">
                        <span className="mono">{formatBotAmount(bounty.amount)} BOT</span>
                        <span className={`status-badge status-${bounty.status}`}>{bounty.status}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {page.hasMore && (
        <LiquidButton type="button" variant="outline" size="sm" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
          Show more
        </LiquidButton>
      )}
    </div>
  );
}
