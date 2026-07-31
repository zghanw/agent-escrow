import test from "node:test";
import assert from "node:assert/strict";
import { availableBountyActions, validateBountyDraft } from "../src/lib/escrowPolicy.ts";

const requester = "0x0000000000000000000000000000000000000001";
const agent = "0x0000000000000000000000000000000000000002";
const other = "0x0000000000000000000000000000000000000003";

function bounty(overrides = {}) {
  return {
    status: "Open",
    requester,
    agent,
    workDeadline: 2000,
    reviewDeadline: 3000,
    requesterCancellationApproved: false,
    agentCancellationApproved: false,
    ...overrides,
  };
}

test("only the designated agent can accept while the requester can cancel Open", () => {
  assert.deepEqual(availableBountyActions(bounty(), requester, 1000), ["cancelOpen"]);
  assert.deepEqual(availableBountyActions(bounty(), agent, 1000), ["accept"]);
  assert.deepEqual(availableBountyActions(bounty(), other, 1000), []);
});

test("Accepted actions switch deterministically at the work deadline", () => {
  const accepted = bounty({ status: "Accepted" });

  assert.deepEqual(availableBountyActions(accepted, agent, 1999), ["submit", "approveCancellation"]);
  assert.deepEqual(availableBountyActions(accepted, requester, 1999), ["approveCancellation"]);
  assert.deepEqual(availableBountyActions(accepted, agent, 2000), ["approveCancellation"]);
  assert.deepEqual(availableBountyActions(accepted, requester, 2000), [
    "refundExpired",
    "approveCancellation",
  ]);
});

test("Submitted work can be released, mutually cancelled, or finalized after review", () => {
  const submitted = bounty({ status: "Submitted" });

  assert.deepEqual(availableBountyActions(submitted, requester, 2999), ["release", "approveCancellation"]);
  assert.deepEqual(availableBountyActions(submitted, agent, 2999), ["approveCancellation"]);
  assert.deepEqual(availableBountyActions(submitted, other, 2999), []);
  assert.deepEqual(availableBountyActions(submitted, other, 3000), ["finalize"]);
  assert.deepEqual(availableBountyActions(submitted, requester, 3000), [
    "release",
    "finalize",
    "approveCancellation",
  ]);
});

test("a party can revoke its own cancellation approval and terminal states have no actions", () => {
  assert.deepEqual(
    availableBountyActions(bounty({ status: "Accepted", agentCancellationApproved: true }), agent, 1500),
    ["submit", "revokeCancellation"]
  );
  assert.deepEqual(availableBountyActions(bounty({ status: "Released" }), requester, 4000), []);
  assert.deepEqual(availableBountyActions(bounty({ status: "Refunded" }), requester, 4000), []);
  assert.deepEqual(availableBountyActions(bounty({ status: "Cancelled" }), requester, 4000), []);
});

test("validates every on-chain bounty creation precondition", () => {
  const valid = {
    description: "Audit the payment flow",
    amount: "0.5",
    agent,
    workHours: "24",
    reviewHours: "6",
  };

  assert.equal(validateBountyDraft(valid, requester), null);
  assert.equal(validateBountyDraft({ ...valid, description: " " }, requester), "Enter a task description.");
  assert.equal(validateBountyDraft({ ...valid, amount: "0" }, requester), "Enter a positive BOT amount.");
  assert.equal(validateBountyDraft({ ...valid, agent: "not-an-address" }, requester), "Enter a valid agent address.");
  assert.equal(validateBountyDraft({ ...valid, agent: requester }, requester), "The requester cannot be the agent.");
  assert.equal(validateBountyDraft({ ...valid, workHours: "0" }, requester), "Work hours must be positive.");
  assert.equal(validateBountyDraft({ ...valid, reviewHours: "0" }, requester), "Review hours must be positive.");
});
