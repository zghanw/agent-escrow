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
