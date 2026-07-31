export function formatFrontendConfig(address, blockNumber) {
  return `VITE_CONTRACT_ADDRESS=${address}\nVITE_CONTRACT_DEPLOY_BLOCK=${blockNumber}`;
}
