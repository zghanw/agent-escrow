import { ethers } from "ethers";

async function main() {
  const rpcUrl = "https://rpc.bohr.life";
  console.log(`Connecting to BOT Chain testnet...`);
  console.log(`RPC URL: ${rpcUrl}`);

  // Test connectivity by creating a provider and querying the network
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const networkInfo = await provider.getNetwork();
  console.log(`Connected! Chain ID: ${networkInfo.chainId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
