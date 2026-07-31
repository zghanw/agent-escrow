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

// Found via binary search on eth_getCode (no deployment record exists in
// this repo) - the block this exact contract address was deployed at,
// 2026-07-30T17:12:02Z. Lets the event-feed backfill skip straight to the
// contract's real history instead of paging back through the whole chain.
// Only needs updating if the contract is ever redeployed to a new address.
export const CONTRACT_DEPLOY_BLOCK = 18128899;

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

// Pulls the most specific message out of a failed write-tx error, since
// ethers' own err.message is often just the opaque "could not coalesce
// error" wrapper around whatever the RPC actually said. The real detail
// lives one level down - under `.info.error.message` for errors ethers
// recognizes (insufficient funds, user-rejected, etc), or under the bare
// `.error.message` for anything it doesn't (the "could not coalesce"
// fallback case) - so check those before ethers' own summary fields.
export function describeTxError(err: any): string {
  if (err && err.code === 4001) return "Transaction rejected in MetaMask.";
  const underlying = err?.info?.error?.message || err?.error?.message;
  return underlying || err?.shortMessage || err?.reason || err?.message || "Unknown error.";
}
