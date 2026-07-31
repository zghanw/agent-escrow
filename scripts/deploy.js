import hre from "hardhat";
import { formatFrontendConfig } from "./deploymentOutput.js";

const EXPLORERS = {
  968: "https://scan.bohr.life",
  677: "https://scan.botchain.ai",
};

async function main() {
  const connection = await hre.network.create();
  const { ethers, networkConfig } = connection;

  console.log(`Deploying to network (expected chain ID ${networkConfig.chainId})...`);

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer: ${deployer.address} (balance: ${ethers.formatEther(balance)} BOT)`);

  if (balance === 0n) {
    throw new Error(`Deployer has no BOT. Fund ${deployer.address} before deploying.`);
  }

  const escrow = await ethers.deployContract("AgentEscrow");
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  const deploymentTransaction = escrow.deploymentTransaction();
  if (!deploymentTransaction) throw new Error("Deployment transaction is unavailable.");
  const receipt = await deploymentTransaction.wait();
  if (!receipt) throw new Error("Deployment receipt is unavailable.");
  const explorer = EXPLORERS[Number(networkConfig.chainId)];
  console.log(`AgentEscrow deployed to: ${address}`);
  console.log(explorer ? `Explorer: ${explorer}/address/${address}` : "Explorer: (unknown chain)");
  console.log("\nFrontend V2 configuration:");
  console.log(formatFrontendConfig(address, receipt.blockNumber));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
