import { ethers } from "ethers";

export type EscrowStatus = "Open" | "Accepted" | "Submitted" | "Released" | "Refunded" | "Cancelled";

export type BountyAction =
  | "accept"
  | "cancelOpen"
  | "submit"
  | "refundExpired"
  | "release"
  | "finalize"
  | "approveCancellation"
  | "revokeCancellation";

export interface BountyPolicyView {
  status: EscrowStatus;
  requester: string;
  agent: string;
  workDeadline: number;
  reviewDeadline: number;
  requesterCancellationApproved: boolean;
  agentCancellationApproved: boolean;
}

export interface BountyDraft {
  description: string;
  amount: string;
  agent: string;
  workHours: string;
  reviewHours: string;
}

function sameAddress(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

export function availableBountyActions(
  bounty: BountyPolicyView,
  signerAddress: string | null,
  nowSeconds: number
): BountyAction[] {
  if (!signerAddress) return [];

  const isRequester = sameAddress(signerAddress, bounty.requester);
  const isAgent = sameAddress(signerAddress, bounty.agent);
  const actions: BountyAction[] = [];

  if (bounty.status === "Open") {
    if (isRequester) actions.push("cancelOpen");
    if (isAgent) actions.push("accept");
    return actions;
  }

  if (bounty.status === "Accepted") {
    if (isAgent && nowSeconds < bounty.workDeadline) actions.push("submit");
    if (isRequester && nowSeconds >= bounty.workDeadline) actions.push("refundExpired");
  } else if (bounty.status === "Submitted") {
    if (isRequester) actions.push("release");
    if (nowSeconds >= bounty.reviewDeadline) actions.push("finalize");
  } else {
    return actions;
  }

  if (isRequester) {
    actions.push(bounty.requesterCancellationApproved ? "revokeCancellation" : "approveCancellation");
  } else if (isAgent) {
    actions.push(bounty.agentCancellationApproved ? "revokeCancellation" : "approveCancellation");
  }

  return actions;
}

export function validateBountyDraft(draft: BountyDraft, requesterAddress: string): string | null {
  if (!draft.description.trim()) return "Enter a task description.";

  const amount = Number(draft.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "Enter a positive BOT amount.";

  if (!ethers.isAddress(draft.agent) || draft.agent === ethers.ZeroAddress) {
    return "Enter a valid agent address.";
  }
  if (sameAddress(draft.agent, requesterAddress)) return "The requester cannot be the agent.";

  const workHours = Number(draft.workHours);
  if (!Number.isFinite(workHours) || workHours <= 0) return "Work hours must be positive.";

  const reviewHours = Number(draft.reviewHours);
  if (!Number.isFinite(reviewHours) || reviewHours <= 0) return "Review hours must be positive.";

  return null;
}
