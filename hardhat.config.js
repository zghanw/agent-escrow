import "dotenv/config.js";
import { BOTCHAIN_TESTNET } from "./config.mjs";

const PRIVATE_KEY = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

export default {
  solidity: "0.8.24",
  networks: {
    botchainTestnet: {
      url: BOTCHAIN_TESTNET.url,
      chainId: BOTCHAIN_TESTNET.chainId,
      accounts: PRIVATE_KEY,
      type: "http",
    },
  },
};
