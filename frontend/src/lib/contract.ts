export const CONTRACT_ADDRESS = "0x956E373A71dA8836FF6a5d5Fe5A5e2d05AF55Cc1";

export const CONTRACT_ABI = [{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"bountyId","type":"uint256"},{"indexed":true,"internalType":"address","name":"agent","type":"address"},{"indexed":true,"internalType":"address","name":"requester","type":"address"},{"indexed":false,"internalType":"uint8","name":"score","type":"uint8"}],"name":"AgentRated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":true,"internalType":"address","name":"agent","type":"address"}],"name":"BountyClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":true,"internalType":"address","name":"requester","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"string","name":"description","type":"string"}],"name":"BountyCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":true,"internalType":"address","name":"requester","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"BountyRefunded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":true,"internalType":"address","name":"agent","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"BountyReleased","type":"event"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"agentRatings","outputs":[{"internalType":"address","name":"requester","type":"address"},{"internalType":"uint256","name":"bountyId","type":"uint256"},{"internalType":"uint8","name":"score","type":"uint8"},{"internalType":"uint256","name":"ratedAt","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"bounties","outputs":[{"internalType":"address","name":"requester","type":"address"},{"internalType":"address","name":"agent","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"description","type":"string"},{"internalType":"enum AgentEscrow.Status","name":"status","type":"uint8"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"bountyCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"bountyRated","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"claimBounty","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"description","type":"string"}],"name":"createBounty","outputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"agent","type":"address"}],"name":"getAgentRatingSummary","outputs":[{"internalType":"uint256","name":"totalScore","type":"uint256"},{"internalType":"uint256","name":"count","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint8","name":"score","type":"uint8"}],"name":"rateAgent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"refund","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"release","outputs":[],"stateMutability":"nonpayable","type":"function"}] as const;

export const BOTCHAIN_TESTNET = {
  chainId: "0x3C8", // 968
  chainName: "BOT Chain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: ["https://rpc.bohr.life"],
  blockExplorerUrls: ["https://scan.bohr.life"],
};

export const BOTCHAIN_CHAIN_ID_DEC = 968;
export const EXPLORER_BASE = "https://scan.bohr.life";

export const STATUS_NAMES = ["Open", "Claimed", "Released", "Refunded"] as const;
export type StatusName = (typeof STATUS_NAMES)[number];

export function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export function describeConnectError(err: any): string {
  if (err && err.code === 4001) return "Connection request rejected in MetaMask.";
  if (err && err.code === -32002)
    return "MetaMask already has a connection request open - check your browser toolbar for the MetaMask icon.";
  return "MetaMask didn't respond as expected. Click the MetaMask icon in your toolbar and connect this site directly, then reload.";
}
