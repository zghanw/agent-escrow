import assert from "node:assert/strict";
import test from "node:test";
import { ethers } from "ethers";

async function loadHistoryModel() {
  try {
    return await import("../src/lib/walletHistory.ts");
  } catch {
    return {};
  }
}

const wallet = "0x00000000000000000000000000000000000000AA";
const other = "0x00000000000000000000000000000000000000bb";

const fixtures = [
  { id: 6n, requester: wallet, agent: other, amount: 9n, description: "cancelled", status: "Cancelled" },
  {
    id: 5n,
    requester: wallet,
    agent: other,
    amount: 2_000000000000000000n,
    description: "paid",
    status: "Released",
  },
  {
    id: 4n,
    requester: other,
    agent: wallet,
    amount: 4_000000000000000000n,
    description: "earned",
    status: "Released",
  },
  { id: 3n, requester: other, agent: wallet, amount: 3n, description: "working", status: "Accepted" },
  { id: 2n, requester: wallet, agent: other, amount: 8n, description: "open", status: "Open" },
  { id: 1n, requester: wallet, agent: other, amount: 7n, description: "refunded", status: "Refunded" },
];

test("normalizes valid wallet addresses and rejects malformed or zero addresses", async () => {
  const { normalizeWalletAddress } = await loadHistoryModel();
  assert.equal(typeof normalizeWalletAddress, "function");

  assert.equal(
    normalizeWalletAddress(" 0x00000000000000000000000000000000000000aa "),
    "0x00000000000000000000000000000000000000AA",
  );
  assert.equal(normalizeWalletAddress("not-an-address"), null);
  assert.equal(normalizeWalletAddress(ethers.ZeroAddress), null);
});

test("deduplicates bounty ids and orders them newest first", async () => {
  const { mergeBountyIds } = await loadHistoryModel();
  assert.equal(typeof mergeBountyIds, "function");
  assert.deepEqual(mergeBountyIds([1n, 3n], [2n, 3n]), [3n, 2n, 1n]);
});

test("filters wallet history by requester and agent roles", async () => {
  const { filterWalletBounties } = await loadHistoryModel();
  assert.equal(typeof filterWalletBounties, "function");

  assert.deepEqual(filterWalletBounties(wallet, fixtures, "requester").map((item) => item.id), [6n, 5n, 2n, 1n]);
  assert.deepEqual(filterWalletBounties(wallet, fixtures, "agent").map((item) => item.id), [4n, 3n]);
});

test("calculates wallet totals from current bounty states", async () => {
  const { summarizeWalletHistory } = await loadHistoryModel();
  assert.equal(typeof summarizeWalletHistory, "function");

  assert.deepEqual(summarizeWalletHistory(wallet, fixtures, 9n, 2n), {
    totalEarned: 4_000000000000000000n,
    totalPaidOut: 2_000000000000000000n,
    activeCount: 2,
    totalCount: 6,
    ratingAverage: 4.5,
    ratingCount: 2,
  });
});

test("formats native BOT amounts without scientific notation", async () => {
  const { formatBotAmount } = await loadHistoryModel();
  assert.equal(typeof formatBotAmount, "function");

  assert.equal(formatBotAmount(0n), "0");
  assert.equal(formatBotAmount(4_590000000000000000n), "4.59");
  assert.equal(formatBotAmount(1_234567890000000000n, 4), "1.2346");
  assert.equal(formatBotAmount(1n, 6), "<0.000001");
});

test("returns a bounded page and whether more history remains", async () => {
  const { takeWalletBounties } = await loadHistoryModel();
  assert.equal(typeof takeWalletBounties, "function");

  assert.deepEqual(takeWalletBounties(fixtures, 2), { items: fixtures.slice(0, 2), hasMore: true });
  assert.deepEqual(takeWalletBounties(fixtures, 10), { items: fixtures, hasMore: false });
});
