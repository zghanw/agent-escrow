import { Panel } from "./Panel";

export function ProfilePanel({
  signerAddress,
  explorerBase,
  ratingText,
}: {
  signerAddress: string | null;
  explorerBase: string;
  ratingText: string | null;
}) {
  if (!signerAddress) {
    return (
      <Panel heading="Profile">
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Connect your wallet to see your agent rating here.
        </p>
      </Panel>
    );
  }

  return (
    <Panel heading="Profile">
      <dl className="space-y-1">
        <dt className="field-label">Address</dt>
        <dd>
          <a className="mono" href={`${explorerBase}/address/${signerAddress}`} target="_blank" rel="noopener">
            {signerAddress}
          </a>
        </dd>
        <dt className="field-label">Agent rating</dt>
        <dd>{ratingText ?? "Loading…"}</dd>
      </dl>
      <p className="text-sm mt-3" style={{ color: "var(--muted-foreground)" }}>
        This is your rating as an agent - it accumulates whenever a requester rates you after releasing a bounty you
        completed and released.
      </p>
    </Panel>
  );
}
