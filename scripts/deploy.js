import hre from "hardhat";
import { ethers } from "ethers";
import { BOTCHAIN_TESTNET } from "../config.mjs";

async function main() {
  // Read network config from hardhat.config.js via shared config.mjs
  const networkName = hre.network.name;
  const { url, chainId: expectedChainId } = BOTCHAIN_TESTNET;

  console.log(`Connecting to network: ${networkName}`);
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
