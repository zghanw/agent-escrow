import { ethers } from "ethers";
import { readBountyWithNotFoundRetry } from "./bountyRead.ts";
import {
  mergeBountyIds,
  normalizeWalletAddress,
  summarizeWalletHistory,
  type WalletBounty,
  type WalletHistoryResult,
} from "./walletHistory.ts";
import type { StatusName } from "./contract.ts";

const MAX_LOG_RANGE = 4_500;
const HYDRATION_BATCH_SIZE = 4;
const BOUNTY_STATUS_NAMES: readonly StatusName[] = ["Open", "Accepted", "Submitted", "Released", "Refunded", "Cancelled"];

export function makeBlockRanges(
  fromBlock: number,
  toBlock: number,
  maximumRange = MAX_LOG_RANGE,
): Array<[number, number]> {
  if (fromBlock > toBlock) return [];
  const ranges: Array<[number, number]> = [];
  for (let from = fromBlock; from <= toBlock; from += maximumRange) {
    ranges.push([from, Math.min(toBlock, from + maximumRange - 1)]);
  }
  return ranges;
}

function mapBounty(id: bigint, bounty: any): WalletBounty {
  return {
    id,
    requester: bounty.requester,
    agent: bounty.agent,
    amount: bounty.amount,
    description: bounty.description,
    status: BOUNTY_STATUS_NAMES[Number(bounty.status)],
  };
}

async function queryBountyIds(
  contract: ethers.Contract,
  filter: ethers.ContractEventName,
  ranges: readonly [number, number][],
): Promise<bigint[]> {
  const groups = await Promise.all(
    ranges.map(async ([fromBlock, toBlock]) => {
      const logs = await contract.queryFilter(filter, fromBlock, toBlock);
      return logs
        .filter((log): log is ethers.EventLog => "args" in log)
        .map((log) => BigInt(log.args.id));
    }),
  );
  return groups.flat();
}

async function hydrateBounties(
  contract: ethers.Contract,
  ids: readonly bigint[],
  wait: () => Promise<void>,
): Promise<WalletBounty[]> {
  const bounties: WalletBounty[] = [];
  for (let start = 0; start < ids.length; start += HYDRATION_BATCH_SIZE) {
    const batch = ids.slice(start, start + HYDRATION_BATCH_SIZE);
    const values = await Promise.all(
      batch.map(async (id) => {
        const value = await readBountyWithNotFoundRetry(async () => {
          const bounty = await contract.bounties(id);
          return bounty.requester === ethers.ZeroAddress ? null : mapBounty(id, bounty);
        }, wait);
        if (!value) throw new Error(`Bounty #${id.toString()} could not be loaded.`);
        return value;
      }),
    );
    bounties.push(...values);
  }
  return bounties;
}

function defaultRetryWait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1_000));
}

export async function readWalletHistory(
  contract: ethers.Contract,
  provider: ethers.Provider,
  addressInput: string,
  deployBlock: number,
  wait: () => Promise<void> = defaultRetryWait,
): Promise<WalletHistoryResult> {
  const address = normalizeWalletAddress(addressInput);
  if (!address) throw new Error("Enter a valid wallet address.");

  const latestBlock = await provider.getBlockNumber();
  const ranges = makeBlockRanges(deployBlock, latestBlock);
  const requesterFilter = contract.filters.BountyCreated(null, address, null);
  const agentFilter = contract.filters.BountyCreated(null, null, address);
  const [requesterIds, agentIds] = await Promise.all([
    queryBountyIds(contract, requesterFilter, ranges),
    queryBountyIds(contract, agentFilter, ranges),
  ]);
  const ids = mergeBountyIds(requesterIds, agentIds);
  const bounties = await hydrateBounties(contract, ids, wait);
  const rating = await contract.getAgentRatingSummary(address);

  return {
    address,
    bounties,
    summary: summarizeWalletHistory(address, bounties, rating.totalScore, rating.count),
  };
}
