import hre from "hardhat";

async function main() {
  // Get the network connection that Hardhat configured via --network flag
  // This connection uses the URL and chainId from hardhat.config.js, no duplication
  const network = await hre.network.connect();
  const provider = network.provider;
  const expectedChainId = network.networkConfig.chainId;

  console.log(`Connecting to BOT Chain testnet via Hardhat-configured network...`);
  console.log(`Expected Chain ID: ${expectedChainId}`);

  // Test connectivity using Hardhat's configured provider
  // Call eth_chainId via JSON-RPC to verify we can reach the network
  const chainIdHex = await provider.request({ method: "eth_chainId" });
  const actualChainId = parseInt(chainIdHex, 16);
  console.log(`Connected! Actual Chain ID: ${actualChainId}`);

  // Verify chain ID matches hardhat.config.js
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
