import { ethers } from "ethers";
import type { StatusName } from "./contract";

export type WalletRole = "requester" | "agent";

export interface WalletBounty {
  id: bigint;
  requester: string;
  agent: string;
  amount: bigint;
  description: string;
  status: StatusName;
}

export interface WalletHistorySummary {
  totalEarned: bigint;
  totalPaidOut: bigint;
  activeCount: number;
  totalCount: number;
  ratingAverage: number | null;
  ratingCount: number;
}

export interface WalletHistoryResult {
  address: string;
  bounties: WalletBounty[];
  summary: WalletHistorySummary;
}

const ACTIVE_STATUSES = new Set<StatusName>(["Open", "Accepted", "Submitted"]);

export function normalizeWalletAddress(input: string): string | null {
  try {
    const address = ethers.getAddress(input.trim());
    return address === ethers.ZeroAddress ? null : address;
  } catch {
    return null;
  }
}

export function mergeBountyIds(...groups: readonly (readonly bigint[])[]): bigint[] {
  return [...new Set(groups.flat())].sort((a, b) => (a === b ? 0 : a > b ? -1 : 1));
}

export function filterWalletBounties(
  address: string,
  bounties: readonly WalletBounty[],
  role: WalletRole,
): WalletBounty[] {
  const normalized = address.toLowerCase();
  return bounties.filter((bounty) => bounty[role].toLowerCase() === normalized);
}

export function summarizeWalletHistory(
  address: string,
  bounties: readonly WalletBounty[],
  totalScore: bigint,
  ratingCount: bigint,
): WalletHistorySummary {
  const normalized = address.toLowerCase();
  const unique = [...new Map(bounties.map((bounty) => [bounty.id, bounty])).values()];
  let totalEarned = 0n;
  let totalPaidOut = 0n;
  let activeCount = 0;

  for (const bounty of unique) {
    if (ACTIVE_STATUSES.has(bounty.status)) activeCount += 1;
    if (bounty.status !== "Released") continue;
    if (bounty.agent.toLowerCase() === normalized) totalEarned += bounty.amount;
    if (bounty.requester.toLowerCase() === normalized) totalPaidOut += bounty.amount;
  }

  return {
    totalEarned,
    totalPaidOut,
    activeCount,
    totalCount: unique.length,
    ratingAverage: ratingCount === 0n ? null : Number(totalScore) / Number(ratingCount),
    ratingCount: Number(ratingCount),
  };
}

export function formatBotAmount(value: bigint, maximumFractionDigits = 4): string {
  const amount = Number(ethers.formatEther(value));
  if (value > 0n && amount < 10 ** -maximumFractionDigits) {
    return `<${(10 ** -maximumFractionDigits).toFixed(maximumFractionDigits)}`;
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    useGrouping: true,
  }).format(amount);
}

export function takeWalletBounties(
  bounties: readonly WalletBounty[],
  limit: number,
): { items: readonly WalletBounty[]; hasMore: boolean } {
  const safeLimit = Math.max(0, Math.floor(limit));
  return { items: bounties.slice(0, safeLimit), hasMore: bounties.length > safeLimit };
}
