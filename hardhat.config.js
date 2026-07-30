import "dotenv/config.js";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

const PRIVATE_KEY = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

export default {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: "0.8.24",
  networks: {
    botchainTestnet: {
      url: "https://rpc.bohr.life",
      chainId: 968,
      accounts: PRIVATE_KEY,
      type: "http",
    },
  },
};
