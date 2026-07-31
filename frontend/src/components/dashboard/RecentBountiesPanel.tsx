import { Panel } from "./Panel";
import type { RecentBounty } from "@/hooks/useEscrow";

export function RecentBountiesPanel({
  connected,
  bounties,
  error,
  onSelect,
}: {
  connected: boolean;
  bounties: RecentBounty[] | null;
  error: string | null;
  onSelect: (id: bigint) => void;
}) {
  const emptyMessage = !connected
    ? "Connect your wallet to see recent bounties here."
    : error
      ? error
      : bounties && bounties.length === 0
        ? "No bounties yet - create the first one above."
        : null;

  return (
    <Panel heading="Recent bounties">
      {emptyMessage && (
        <p className="text-sm" style={{ color: "var(--panel-muted)" }}>
          {emptyMessage}
        </p>
      )}
      {bounties?.map((bounty) => (
        <div className="bounty-row" key={bounty.id.toString()} onClick={() => onSelect(bounty.id)}>
          <span className="bounty-id">#{bounty.id.toString()}</span>
          <span className="bounty-desc">{bounty.description}</span>
          <span className={`status-badge status-${bounty.status}`}>{bounty.status}</span>
        </div>
      ))}
    </Panel>
  );
}
