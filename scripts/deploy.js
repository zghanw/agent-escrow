import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  // Read network config from hardhat.config.js via hre
  // Note: hardhat.config.js reads BOTCHAIN_RPC_URL from environment with a default fallback,
  // so we read from the same source to ensure consistency
  const botchainConfig = hre.config.networks.botchainTestnet;
  const url = process.env.BOTCHAIN_RPC_URL || "https://rpc.bohr.life";
  const expectedChainId = botchainConfig.chainId;

  console.log(`Connecting to BOT Chain testnet...`);
  console.log(`RPC URL: ${url}`);
  console.log(`Expected Chain ID: ${expectedChainId}`);

  // Test connectivity by creating a provider and querying the network
  const provider = new ethers.JsonRpcProvider(url);
  const networkInfo = await provider.getNetwork();
  console.log(`Connected! Actual Chain ID: ${networkInfo.chainId}`);

  // BigInt comparison: convert both to same type
  const actualChainId = Number(networkInfo.chainId);
  if (actualChainId !== expectedChainId) {
    throw new Error(
      `Chain ID mismatch: expected ${expectedChainId}, got ${actualChainId}`
    );
  }
  console.log("Chain ID verified!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
