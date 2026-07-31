import { useState } from "react";
import { ethers } from "ethers";
import { Panel } from "./Panel";
import { StatusTracker } from "./StatusTracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BountyDetail } from "@/hooks/useEscrow";

const RATING_OPTIONS = [
  { value: "5", label: "5 - excellent" },
  { value: "4", label: "4 - good" },
  { value: "3", label: "3 - okay" },
  { value: "2", label: "2 - poor" },
  { value: "1", label: "1 - bad" },
];

export function BountyDetailPanel({
  signerAddress,
  canInteract,
  explorerBase,
  contractAddress,
  detail,
  busy,
  onLoad,
  onClaim,
  onRelease,
  onRefund,
  onRate,
}: {
  signerAddress: string | null;
  canInteract: boolean;
  explorerBase: string;
  contractAddress: string;
  detail: BountyDetail | null;
  busy: boolean;
  onLoad: (id: string) => void;
  onClaim: (id: bigint) => void;
  onRelease: (id: bigint) => void;
  onRefund: (id: bigint) => void;
  onRate: (id: bigint, score: number) => void;
}) {
  const [idInput, setIdInput] = useState("");
  const [rating, setRating] = useState("5");

  const isRequester =
    Boolean(signerAddress) && Boolean(detail) && signerAddress!.toLowerCase() === detail!.requester.toLowerCase();

  return (
    <Panel heading="View a bounty">
      <div className="flex gap-2.5">
        <Input
          className="max-w-[140px]"
          type="number"
          min="0"
          step="1"
          placeholder="Bounty ID"
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
        />
        <Button variant="outline" disabled={!canInteract} onClick={() => onLoad(idInput)}>
          Load
        </Button>
      </div>

      {detail && (
        <dl className="mt-4 space-y-1">
          <dt className="field-label">Status</dt>
          <dd>
            <span className={`status-badge status-${detail.status}`}>{detail.status}</span>
          </dd>
          <dd className="mt-2">
            <StatusTracker status={detail.status} agent={detail.agent} />
          </dd>

          <dt className="field-label">Description</dt>
          <dd>{detail.description}</dd>

          <dt className="field-label">Amount</dt>
          <dd className="mono">{ethers.formatEther(detail.amount)} BOT</dd>

          <dt className="field-label">Requester</dt>
          <dd className="mono">{detail.requester}</dd>

          <dt className="field-label">Agent</dt>
          <dd className="mono">{detail.agent === ethers.ZeroAddress ? "(none yet)" : detail.agent}</dd>

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

      {detail && (
        <div className="flex gap-2 mt-3.5 flex-wrap">
          {detail.status === "Open" && !isRequester && (
            <Button disabled={busy} onClick={() => onClaim(detail.id)}>
              Claim Bounty
            </Button>
          )}
          {detail.status === "Open" && isRequester && (
            <Button variant="outline" disabled={busy} onClick={() => onRefund(detail.id)}>
              Cancel & Refund Myself
            </Button>
          )}
          {detail.status === "Claimed" && isRequester && (
            <>
              <Button disabled={busy} onClick={() => onRelease(detail.id)}>
                Release Payment
              </Button>
              <Button variant="destructive" disabled={busy} onClick={() => onRefund(detail.id)}>
                Refund Instead
              </Button>
            </>
          )}
        </div>
      )}

      {detail && detail.status === "Released" && isRequester && !detail.alreadyRated && (
        <div className="flex gap-2 mt-2.5 items-center">
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger className="w-auto max-w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RATING_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" disabled={busy} onClick={() => onRate(detail.id, Number(rating))}>
            Rate Agent
          </Button>
        </div>
      )}
    </Panel>
  );
}
