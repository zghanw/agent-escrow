import hre from "hardhat";

async function main() {
  const connection = await hre.network.create();
  const { ethers, networkConfig } = connection;

  console.log(`Deploying to network (expected chain ID ${networkConfig.chainId})...`);

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer: ${deployer.address} (balance: ${ethers.formatEther(balance)} BOT)`);

  if (balance === 0n) {
    throw new Error(
      `Deployer has no BOT. Fund ${deployer.address} from the testnet faucet before deploying.`
    );
  }

  const escrow = await ethers.deployContract("AgentEscrow");
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log(`AgentEscrow deployed to: ${address}`);
  console.log(`Explorer: https://scan.bohr.life/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
