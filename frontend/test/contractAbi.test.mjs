import test from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { CONTRACT_ABI } from "../src/lib/agentEscrowAbi.ts";

test("ethers parses every V2 contract fragment", () => {
  const contractInterface = new ethers.Interface(CONTRACT_ABI);
  const functionNames = contractInterface.fragments
    .filter((fragment) => fragment.type === "function")
    .map((fragment) => fragment.name);

  assert.deepEqual(functionNames.sort(), [
    "acceptBounty",
    "agentRatings",
    "bounties",
    "bountyCount",
    "bountyRated",
    "cancelOpenBounty",
    "createBounty",
    "finalize",
    "getAgentRatingSummary",
    "rateAgent",
    "refundExpiredBounty",
    "release",
    "setCancellationApproval",
    "submitWork",
  ]);
  assert.equal(contractInterface.getFunction("refund"), null);
});

test("the V2 bounty getter exposes every state-machine field", () => {
  const contractInterface = new ethers.Interface(CONTRACT_ABI);
  const bountyOutput = contractInterface.getFunction("bounties").outputs[0];

  assert.deepEqual(
    bountyOutput.components.map((component) => component.name),
    [
      "requester",
      "agent",
      "amount",
      "description",
      "submission",
      "status",
      "createdAt",
      "workDeadline",
      "reviewDeadline",
      "workDuration",
      "reviewPeriod",
      "requesterCancellationApproved",
      "agentCancellationApproved",
    ]
  );
});
