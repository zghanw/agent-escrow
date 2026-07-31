import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Panel } from "./Panel";
import { StatusTracker } from "./StatusTracker";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { availableBountyActions } from "@/lib/escrowPolicy";
import type { BountyDetail } from "@/hooks/useEscrow";

const RATING_OPTIONS = [
  { value: "5", label: "5 - excellent" },
  { value: "4", label: "4 - good" },
  { value: "3", label: "3 - okay" },
  { value: "2", label: "2 - poor" },
  { value: "1", label: "1 - bad" },
];

function formatDeadline(timestamp: number, fallback: string): string {
  return timestamp > 0 ? new Date(timestamp * 1000).toLocaleString() : fallback;
}

function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  return `${hours.toLocaleString(undefined, { maximumFractionDigits: 2 })} hour${hours === 1 ? "" : "s"}`;
}

export function BountyDetailPanel({
  signerAddress,
  canInteract,
  explorerBase,
  contractAddress,
  detail,
  busy,
  onLoad,
  onAccept,
  onCancelOpen,
  onSubmit,
  onRefundExpired,
  onRelease,
  onFinalize,
  onSetCancellationApproval,
  onRate,
}: {
  signerAddress: string | null;
  canInteract: boolean;
  explorerBase: string;
  contractAddress: string;
  detail: BountyDetail | null;
  busy: boolean;
  onLoad: (id: string) => void;
  onAccept: (id: bigint) => void;
  onCancelOpen: (id: bigint) => void;
  onSubmit: (id: bigint, submission: string) => void;
  onRefundExpired: (id: bigint) => void;
  onRelease: (id: bigint) => void;
  onFinalize: (id: bigint) => void;
  onSetCancellationApproval: (id: bigint, approved: boolean) => void;
  onRate: (id: bigint, score: number) => void;
}) {
  const [idInput, setIdInput] = useState("");
  const [submission, setSubmission] = useState("");
  const [rating, setRating] = useState("5");
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const isRequester =
    Boolean(signerAddress) && Boolean(detail) && signerAddress!.toLowerCase() === detail!.requester.toLowerCase();
  const actions = new Set(
    detail && canInteract ? availableBountyActions(detail, signerAddress, nowSeconds) : []
  );

  return (
    <Panel heading="View a bounty">
      <label className="field-label" htmlFor="bountyIdInput">
        Bounty ID
      </label>
      <div className="flex gap-2.5">
        <Input
          id="bountyIdInput"
          className="max-w-[140px]"
          type="number"
          min="0"
          step="1"
          placeholder="Bounty ID"
          value={idInput}
          onChange={(event) => setIdInput(event.target.value)}
        />
        <LiquidButton variant="outline" disabled={!canInteract} onClick={() => onLoad(idInput)}>
          Load
        </LiquidButton>
      </div>

      {detail && (
        <dl className="mt-4 space-y-1">
          <dt className="field-label">Status</dt>
          <dd>
            <span className={`status-badge status-${detail.status}`}>{detail.status}</span>
          </dd>
          <dd className="mt-2">
            <StatusTracker
              status={detail.status}
              workDeadline={detail.workDeadline}
              reviewDeadline={detail.reviewDeadline}
            />
          </dd>

          <dt className="field-label">Description</dt>
          <dd>{detail.description}</dd>

          <dt className="field-label">Amount</dt>
          <dd className="mono">{ethers.formatEther(detail.amount)} BOT</dd>

          <dt className="field-label">Requester</dt>
          <dd className="mono break-all">{detail.requester}</dd>

          <dt className="field-label">Designated agent</dt>
          <dd className="mono break-all">{detail.agent}</dd>

          <dt className="field-label">Work window</dt>
          <dd>{formatHours(detail.workDuration)}</dd>

          <dt className="field-label">Work deadline</dt>
          <dd>{formatDeadline(detail.workDeadline, "Starts when the agent accepts")}</dd>

          <dt className="field-label">Review window</dt>
          <dd>{formatHours(detail.reviewPeriod)}</dd>

          <dt className="field-label">Review deadline</dt>
          <dd>{formatDeadline(detail.reviewDeadline, "Starts when work is submitted")}</dd>

          <dt className="field-label">Submission evidence</dt>
          <dd className="mono break-all">{detail.submission || "(not submitted)"}</dd>

          <dt className="field-label">Cancellation approvals</dt>
          <dd>
            Requester: {detail.requesterCancellationApproved ? "approved" : "not approved"}; agent:{" "}
            {detail.agentCancellationApproved ? "approved" : "not approved"}
          </dd>

          <dt className="field-label">Agent rating</dt>
          <dd>{detail.agentRatingText}</dd>

          <dt className="field-label">Contract</dt>
          <dd>
            <a href={`${explorerBase}/address/${contractAddress}`} target="_blank" rel="noopener">
              View on BOT Chain Explorer ↗
            </a>
          </dd>
        </dl>
      )}

      {detail && actions.has("submit") && (
        <div className="mt-4">
          <label className="field-label" htmlFor="submissionInput">
            Deliverable URL or content hash
          </label>
          <div className="flex gap-2.5">
            <Input
              id="submissionInput"
              type="text"
              placeholder="ipfs://… or https://…"
              value={submission}
              onChange={(event) => setSubmission(event.target.value)}
            />
            <LiquidButton disabled={busy} onClick={() => onSubmit(detail.id, submission)}>
              Submit Work
            </LiquidButton>
          </div>
        </div>
      )}

      {detail && (
        <div className="flex gap-2 mt-3.5 flex-wrap">
          {actions.has("accept") && (
            <LiquidButton disabled={busy} onClick={() => onAccept(detail.id)}>
              Accept Bounty
            </LiquidButton>
          )}
          {actions.has("cancelOpen") && (
            <LiquidButton variant="destructive" disabled={busy} onClick={() => onCancelOpen(detail.id)}>
              Cancel Open Bounty
            </LiquidButton>
          )}
          {actions.has("refundExpired") && (
            <LiquidButton variant="destructive" disabled={busy} onClick={() => onRefundExpired(detail.id)}>
              Refund Missed Deadline
            </LiquidButton>
          )}
          {actions.has("release") && (
            <LiquidButton disabled={busy} onClick={() => onRelease(detail.id)}>
              Release Payment
            </LiquidButton>
          )}
          {actions.has("finalize") && (
            <LiquidButton disabled={busy} onClick={() => onFinalize(detail.id)}>
              Finalize After Review
            </LiquidButton>
          )}
          {actions.has("approveCancellation") && (
            <LiquidButton
              variant="outline"
              disabled={busy}
              onClick={() => onSetCancellationApproval(detail.id, true)}
            >
              Approve Mutual Cancellation
            </LiquidButton>
          )}
          {actions.has("revokeCancellation") && (
            <LiquidButton
              variant="outline"
              disabled={busy}
              onClick={() => onSetCancellationApproval(detail.id, false)}
            >
              Revoke Cancellation Approval
            </LiquidButton>
          )}
        </div>
      )}

      {detail && detail.status === "Released" && isRequester && !detail.alreadyRated && (
        <div>
          <label className="field-label" htmlFor="agentRating">
            Agent rating
          </label>
          <div className="flex gap-2 mt-2.5 items-center">
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger id="agentRating" className="w-auto max-w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <LiquidButton variant="outline" disabled={busy} onClick={() => onRate(detail.id, Number(rating))}>
              Rate Agent
            </LiquidButton>
          </div>
        </div>
      )}
    </Panel>
  );
}
