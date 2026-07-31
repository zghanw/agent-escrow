import { network } from "hardhat";
import { expect } from "chai";

describe("AgentEscrow", function () {
  async function deployFixture() {
    const { ethers } = await network.create();
    const [requester, agent] = await ethers.getSigners();
    const escrow = await ethers.deployContract("AgentEscrow");
    return { ethers, escrow, requester, agent };
  }

  function gasCost(receipt) {
    return receipt.gasUsed * receipt.gasPrice;
  }

  it("creates a bounty for a designated agent with explicit timing terms", async function () {
    const { ethers, escrow, requester, agent } = await deployFixture();
    const amount = ethers.parseEther("1");
    const workDuration = 3n * 24n * 60n * 60n;
    const reviewPeriod = 12n * 60n * 60n;

    await (
      await escrow
        .connect(requester)
        .createBounty(agent.address, "write a poem", workDuration, reviewPeriod, { value: amount })
    ).wait();

    const bounty = await escrow.bounties(0);
    expect(bounty.requester).to.equal(requester.address);
    expect(bounty.agent).to.equal(agent.address);
    expect(bounty.amount).to.equal(amount);
    expect(bounty.description).to.equal("write a poem");
    expect(bounty.submission).to.equal("");
    expect(bounty.status).to.equal(0n);
    expect(bounty.workDuration).to.equal(workDuration);
    expect(bounty.reviewPeriod).to.equal(reviewPeriod);
    expect(bounty.workDeadline).to.equal(0n);
    expect(bounty.reviewDeadline).to.equal(0n);
  });

  it("allows only the designated agent to accept", async function () {
    const { ethers, escrow, requester, agent } = await deployFixture();
    const [, , other] = await ethers.getSigners();
    const workDuration = 2n * 24n * 60n * 60n;

    await (
      await escrow
        .connect(requester)
        .createBounty(agent.address, "draft a report", workDuration, 3600, { value: ethers.parseEther("0.5") })
    ).wait();

    await expect(escrow.connect(other).acceptBounty(0)).to.be.revertedWith("Only designated agent can accept");

    const receipt = await (await escrow.connect(agent).acceptBounty(0)).wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const bounty = await escrow.bounties(0);

    expect(bounty.status).to.equal(1n);
    expect(bounty.workDeadline).to.equal(BigInt(block.timestamp) + workDuration);
  });

  it("rejects invalid designated-agent bounty terms", async function () {
    const { ethers, escrow, requester, agent } = await deployFixture();
    const amount = ethers.parseEther("0.1");

    await expect(
      escrow.connect(requester).createBounty(ethers.ZeroAddress, "desc", 3600, 3600, { value: amount })
    ).to.be.revertedWith("Agent is required");
    await expect(
      escrow.connect(requester).createBounty(requester.address, "desc", 3600, 3600, { value: amount })
    ).to.be.revertedWith("Requester cannot be agent");
    await expect(
      escrow.connect(requester).createBounty(agent.address, "desc", 0, 3600, { value: amount })
    ).to.be.revertedWith("Work duration is required");
    await expect(
      escrow.connect(requester).createBounty(agent.address, "desc", 3600, 0, { value: amount })
    ).to.be.revertedWith("Review period is required");
  });

  it("lets the requester cancel an open bounty and returns the full principal", async function () {
    const { ethers, escrow, requester, agent } = await deployFixture();
    const [, , other] = await ethers.getSigners();
    const amount = ethers.parseEther("0.75");

    await (
      await escrow
        .connect(requester)
        .createBounty(agent.address, "audit a contract", 86400, 7200, { value: amount })
    ).wait();

    await expect(escrow.connect(other).cancelOpenBounty(0)).to.be.revertedWith("Only requester can cancel");

    const requesterBalanceBefore = await ethers.provider.getBalance(requester.address);
    const receipt = await (await escrow.connect(requester).cancelOpenBounty(0)).wait();
    const requesterBalanceAfter = await ethers.provider.getBalance(requester.address);

    expect(requesterBalanceAfter - requesterBalanceBefore).to.equal(amount - gasCost(receipt));
    expect((await escrow.bounties(0)).status).to.equal(5n);
    await expect(escrow.connect(agent).acceptBounty(0)).to.be.revertedWith("Bounty not open");
  });

  it("refunds only after the accepted agent misses the work deadline", async function () {
    const { ethers, escrow, requester, agent } = await deployFixture();
    const [, , other] = await ethers.getSigners();
    const amount = ethers.parseEther("0.4");

    await (
      await escrow
        .connect(requester)
        .createBounty(agent.address, "prepare a dataset", 3600, 1800, { value: amount })
    ).wait();
    await (await escrow.connect(agent).acceptBounty(0)).wait();
    const deadline = (await escrow.bounties(0)).workDeadline;

    await expect(escrow.connect(requester).refundExpiredBounty(0)).to.be.revertedWith(
      "Work deadline not reached"
    );
    await expect(escrow.connect(other).refundExpiredBounty(0)).to.be.revertedWith("Only requester can refund");

    await ethers.provider.send("evm_setNextBlockTimestamp", [Number(deadline + 1n)]);
    await expect(escrow.connect(agent).submitWork(0, "ipfs://late")).to.be.revertedWith("Work deadline passed");
    const requesterBalanceBefore = await ethers.provider.getBalance(requester.address);
    const receipt = await (await escrow.connect(requester).refundExpiredBounty(0)).wait();
    const requesterBalanceAfter = await ethers.provider.getBalance(requester.address);

    expect(requesterBalanceAfter - requesterBalanceBefore).to.equal(amount - gasCost(receipt));
    expect((await escrow.bounties(0)).status).to.equal(4n);
  });

  it("requires submitted work before requester release and pays the agent", async function () {
    const { ethers, escrow, requester, agent } = await deployFixture();
    const [, , other] = await ethers.getSigners();
    const amount = ethers.parseEther("1");
    const reviewPeriod = 7200n;

    await (
      await escrow
        .connect(requester)
        .createBounty(agent.address, "write a poem", 86400, reviewPeriod, { value: amount })
    ).wait();
    await (await escrow.connect(agent).acceptBounty(0)).wait();

    await expect(escrow.connect(requester).release(0)).to.be.revertedWith("Bounty not submitted");
    await expect(escrow.connect(other).submitWork(0, "ipfs://deliverable")).to.be.revertedWith(
      "Only designated agent can submit"
    );
    await expect(escrow.connect(agent).submitWork(0, "")).to.be.revertedWith("Submission is required");

    const submissionReceipt = await (await escrow.connect(agent).submitWork(0, "ipfs://deliverable")).wait();
    const submissionBlock = await ethers.provider.getBlock(submissionReceipt.blockNumber);
    const submitted = await escrow.bounties(0);

    expect(submitted.status).to.equal(2n);
    expect(submitted.submission).to.equal("ipfs://deliverable");
    expect(submitted.reviewDeadline).to.equal(BigInt(submissionBlock.timestamp) + reviewPeriod);
    await expect(escrow.connect(other).release(0)).to.be.revertedWith("Only requester can release");

    const agentBalanceBefore = await ethers.provider.getBalance(agent.address);
    await (await escrow.connect(requester).release(0)).wait();
    const agentBalanceAfter = await ethers.provider.getBalance(agent.address);

    expect(agentBalanceAfter - agentBalanceBefore).to.equal(amount);
    expect((await escrow.bounties(0)).status).to.equal(3n);
  });

  it("lets anyone finalize payment after the requester review deadline", async function () {
    const { ethers, escrow, requester, agent } = await deployFixture();
    const [, , other] = await ethers.getSigners();
    const amount = ethers.parseEther("0.6");

    await (
      await escrow
        .connect(requester)
        .createBounty(agent.address, "summarize findings", 86400, 3600, { value: amount })
    ).wait();
    await (await escrow.connect(agent).acceptBounty(0)).wait();
    await (await escrow.connect(agent).submitWork(0, "ar://result")).wait();
    const deadline = (await escrow.bounties(0)).reviewDeadline;

    await expect(escrow.connect(other).finalize(0)).to.be.revertedWith("Review deadline not reached");

    await ethers.provider.send("evm_setNextBlockTimestamp", [Number(deadline)]);
    const agentBalanceBefore = await ethers.provider.getBalance(agent.address);
    await (await escrow.connect(other).finalize(0)).wait();
    const agentBalanceAfter = await ethers.provider.getBalance(agent.address);

    expect(agentBalanceAfter - agentBalanceBefore).to.equal(amount);
    expect((await escrow.bounties(0)).status).to.equal(3n);
  });

  it("moves funds correctly through create -> claim -> release", async function () {
    const { ethers, escrow, requester, agent } = await deployFixture();
    const amount = ethers.parseEther("1");

    await (await escrow.connect(requester).createBounty("write a poem", { value: amount })).wait();
    await (await escrow.connect(agent).claimBounty(0)).wait();

    const agentBalanceBefore = await ethers.provider.getBalance(agent.address);
    const requesterBalanceBefore = await ethers.provider.getBalance(requester.address);

    const releaseReceipt = await (await escrow.connect(requester).release(0)).wait();

    const agentBalanceAfter = await ethers.provider.getBalance(agent.address);
    const requesterBalanceAfter = await ethers.provider.getBalance(requester.address);

    expect(agentBalanceAfter - agentBalanceBefore).to.equal(amount);
    expect(requesterBalanceBefore - requesterBalanceAfter).to.equal(gasCost(releaseReceipt));

    const bounty = await escrow.bounties(0);
    expect(bounty.status).to.equal(2n); // Released
  });

  it("refunds the full amount from Claimed status", async function () {
    const { ethers, escrow, requester, agent } = await deployFixture();
    const amount = ethers.parseEther("0.5");

    await (await escrow.connect(requester).createBounty("draft a report", { value: amount })).wait();
    await (await escrow.connect(agent).claimBounty(0)).wait();

    const requesterBalanceBefore = await ethers.provider.getBalance(requester.address);
    const refundReceipt = await (await escrow.connect(requester).refund(0)).wait();
    const requesterBalanceAfter = await ethers.provider.getBalance(requester.address);

    expect(requesterBalanceAfter - requesterBalanceBefore).to.equal(amount - gasCost(refundReceipt));

    const bounty = await escrow.bounties(0);
    expect(bounty.status).to.equal(3n); // Refunded
  });

  it("reverts a reentrant refund attempt with no state change and no funds lost", async function () {
    const { ethers, escrow, requester } = await deployFixture();
    const amount = ethers.parseEther("0.25");

    const malicious = await ethers.deployContract("MaliciousRequester", [await escrow.getAddress()]);

    await expect(
      malicious.connect(requester).createAndRefund("desc", { value: amount })
    ).to.be.revert(ethers);

    expect(await escrow.bountyCount()).to.equal(0n);
    expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(0n);
  });

  it("rejects the requester claiming their own bounty", async function () {
    const { ethers, escrow, requester } = await deployFixture();
    await (await escrow.connect(requester).createBounty("desc", { value: ethers.parseEther("0.1") })).wait();

    await expect(escrow.connect(requester).claimBounty(0)).to.be.revert(ethers);
  });

  it("rejects claiming a bounty that isn't Open", async function () {
    const { ethers, escrow, requester, agent } = await deployFixture();
    await (await escrow.connect(requester).createBounty("desc", { value: ethers.parseEther("0.1") })).wait();
    await (await escrow.connect(agent).claimBounty(0)).wait();

    const [, , other] = await ethers.getSigners();
    await expect(escrow.connect(other).claimBounty(0)).to.be.revert(ethers);
  });

  async function releasedBountyFixture() {
    const fixture = await deployFixture();
    const { ethers, escrow, requester, agent } = fixture;
    await (await escrow.connect(requester).createBounty("desc", { value: ethers.parseEther("0.1") })).wait();
    await (await escrow.connect(agent).claimBounty(0)).wait();
    await (await escrow.connect(requester).release(0)).wait();
    return fixture;
  }

  it("rejects rating a bounty that hasn't been released yet", async function () {
    const { ethers, escrow, requester, agent } = await deployFixture();
    await (await escrow.connect(requester).createBounty("desc", { value: ethers.parseEther("0.1") })).wait();
    await (await escrow.connect(agent).claimBounty(0)).wait();

    await expect(escrow.connect(requester).rateAgent(0, 5)).to.be.revert(ethers);
  });

  it("records a rating and updates the agent's summary after release", async function () {
    const { escrow, requester, agent } = await releasedBountyFixture();

    await (await escrow.connect(requester).rateAgent(0, 4)).wait();

    const summary = await escrow.getAgentRatingSummary(agent.address);
    expect(summary.totalScore).to.equal(4n);
    expect(summary.count).to.equal(1n);

    const rating = await escrow.agentRatings(agent.address, 0);
    expect(rating.score).to.equal(4n);
    expect(rating.requester).to.equal(requester.address);
  });

  it("rejects rating the same bounty twice", async function () {
    const { ethers, escrow, requester } = await releasedBountyFixture();
    await (await escrow.connect(requester).rateAgent(0, 3)).wait();

    await expect(escrow.connect(requester).rateAgent(0, 5)).to.be.revert(ethers);
  });

  it("rejects a non-requester rating the agent", async function () {
    const { ethers, escrow } = await releasedBountyFixture();
    const [, , other] = await ethers.getSigners();

    await expect(escrow.connect(other).rateAgent(0, 5)).to.be.revert(ethers);
  });

  it("rejects a score outside 1-5", async function () {
    const { ethers, escrow, requester } = await releasedBountyFixture();

    await expect(escrow.connect(requester).rateAgent(0, 0)).to.be.revert(ethers);
    await expect(escrow.connect(requester).rateAgent(0, 6)).to.be.revert(ethers);
  });
});
