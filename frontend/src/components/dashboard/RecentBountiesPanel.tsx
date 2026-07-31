import { Panel } from "./Panel";
import type { RecentBounty } from "@/hooks/useEscrow";

export function RecentBountiesPanel({
  connected,
  bounties,
  error,
  onSelect,
  onCreateClick,
}: {
  connected: boolean;
  bounties: RecentBounty[] | null;
  error: string | null;
  onSelect: (id: bigint) => void;
  onCreateClick: () => void;
}) {
  const noBountiesYet = connected && !error && bounties && bounties.length === 0;
  const emptyMessage = !connected
    ? "Connect your wallet to see recent bounties here."
    : error
      ? error
      : null;

  return (
    <Panel heading="Recent bounties">
      {emptyMessage && (
        <p className="text-sm" style={{ color: "var(--panel-muted)" }}>
          {emptyMessage}
        </p>
      )}
      {noBountiesYet && (
        <p className="text-sm" style={{ color: "var(--panel-muted)" }}>
          No bounties yet.{" "}
          <button
            type="button"
            onClick={onCreateClick}
            className="underline hover:text-[var(--foreground)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-sm"
          >
            Create the first one
          </button>
          .
        </p>
      )}
      {bounties?.map((bounty) => (
        <button type="button" className="bounty-row" key={bounty.id.toString()} onClick={() => onSelect(bounty.id)}>
          <span className="bounty-id">#{bounty.id.toString()}</span>
          <span className="bounty-desc">{bounty.description}</span>
          <span className={`status-badge status-${bounty.status}`}>{bounty.status}</span>
        </button>
      ))}
    </Panel>
  );
}
