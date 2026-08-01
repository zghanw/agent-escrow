import assert from "node:assert/strict";
import test from "node:test";

async function loadReader() {
  try {
    return await import("../src/lib/walletHistoryReader.ts");
  } catch {
    return {};
  }
}

const wallet = "0x00000000000000000000000000000000000000AA";
const other = "0x00000000000000000000000000000000000000bb";

function bounty(requester, agent, amount, description, status) {
  return {
    requester,
    agent,
    amount,
    description,
    submission: "",
    status,
    createdAt: 1n,
    workDeadline: 0n,
    reviewDeadline: 0n,
    workDuration: 1n,
    reviewPeriod: 1n,
    requesterCancellationApproved: false,
    agentCancellationApproved: false,
  };
}

test("splits an inclusive block span into RPC-safe ranges", async () => {
  const { makeBlockRanges } = await loadReader();
  assert.equal(typeof makeBlockRanges, "function");

  assert.deepEqual(makeBlockRanges(1, 10_000, 4_500), [
    [1, 4_500],
    [4_501, 9_000],
    [9_001, 10_000],
  ]);
  assert.deepEqual(makeBlockRanges(10, 9, 4_500), []);
});

test("queries indexed requester and agent history and hydrates each bounty once", async () => {
  const { readWalletHistory } = await loadReader();
  assert.equal(typeof readWalletHistory, "function");

  const filterCalls = [];
  const queryCalls = [];
  const bountyReads = new Map();
  const records = new Map([
    [7n, bounty(wallet, other, 2_000000000000000000n, "requester release", 3n)],
    [4n, bounty(other, wallet, 4_000000000000000000n, "agent release", 3n)],
    [2n, bounty(wallet, other, 1n, "open", 0n)],
  ]);

  const contract = {
    filters: {
      BountyCreated(id, requester, agent) {
        filterCalls.push([id, requester, agent]);
        return { role: requester ? "requester" : "agent" };
      },
    },
    async queryFilter(filter, from, to) {
      queryCalls.push({ role: filter.role, from, to });
      if (from !== 1) return [];
      const ids = filter.role === "requester" ? [7n, 2n] : [4n, 2n];
      return ids.map((id) => ({ args: { id } }));
    },
    async bounties(id) {
      bountyReads.set(id, (bountyReads.get(id) ?? 0) + 1);
      return records.get(id);
    },
    async getAgentRatingSummary() {
      return { totalScore: 9n, count: 2n };
    },
  };
  const provider = { async getBlockNumber() { return 10_000; } };

  const result = await readWalletHistory(contract, provider, wallet, 1, async () => {});

  assert.deepEqual(filterCalls, [
    [null, wallet, null],
    [null, null, wallet],
  ]);
  assert.equal(queryCalls.length, 6);
  assert.equal(queryCalls.every(({ from, to }) => to - from + 1 <= 4_500), true);
  assert.deepEqual(result.bounties.map((item) => item.id), [7n, 4n, 2n]);
  assert.equal(bountyReads.get(2n), 1);
  assert.equal(result.summary.totalEarned, 4_000000000000000000n);
  assert.equal(result.summary.totalPaidOut, 2_000000000000000000n);
  assert.equal(result.summary.ratingAverage, 4.5);
});

test("rejects malformed addresses before making chain reads", async () => {
  const { readWalletHistory } = await loadReader();
  assert.equal(typeof readWalletHistory, "function");
  let reads = 0;
  const provider = { async getBlockNumber() { reads += 1; return 1; } };

  await assert.rejects(
    readWalletHistory({ filters: {} }, provider, "bad address", 1, async () => {}),
    /valid wallet address/i,
  );
  assert.equal(reads, 0);
});
