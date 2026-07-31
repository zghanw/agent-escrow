const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const configuredAddress = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "").trim();
const configuredDeployBlock = Number(import.meta.env.VITE_CONTRACT_DEPLOY_BLOCK ?? "0");

export const CONTRACT_ADDRESS = /^0x[0-9a-fA-F]{40}$/.test(configuredAddress)
  ? configuredAddress
  : ZERO_ADDRESS;

export const CONTRACT_DEPLOY_BLOCK =
  Number.isSafeInteger(configuredDeployBlock) && configuredDeployBlock > 0 ? configuredDeployBlock : 0;

export const CONTRACT_CONFIGURED = CONTRACT_ADDRESS !== ZERO_ADDRESS && CONTRACT_DEPLOY_BLOCK > 0;

export { CONTRACT_ABI } from "./agentEscrowAbi";

export const BOTCHAIN_TESTNET = {
  chainId: "0x3C8", // 968
  chainName: "BOT Chain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: ["https://rpc.bohr.life"],
  blockExplorerUrls: ["https://scan.bohr.life"],
};

export const BOTCHAIN_CHAIN_ID_DEC = 968;
export const EXPLORER_BASE = "https://scan.bohr.life";

export const STATUS_NAMES = ["Open", "Accepted", "Submitted", "Released", "Refunded", "Cancelled"] as const;
export type StatusName = (typeof STATUS_NAMES)[number];

export function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function describeConnectError(err: any): string {
  if (err && err.code === 4001) return "Connection request rejected in MetaMask.";
  if (err && err.code === -32002) {
    return "MetaMask already has a connection request open — check your browser toolbar for the MetaMask icon.";
  }
  return "MetaMask didn't respond as expected. Click the MetaMask icon in your toolbar and connect this site directly, then reload.";
}

export function describeTxError(err: any): string {
  if (err && err.code === 4001) return "Transaction rejected in MetaMask.";
  const underlying = err?.info?.error?.message || err?.error?.message;
  return underlying || err?.shortMessage || err?.reason || err?.message || "Unknown error.";
}
