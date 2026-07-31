import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import {
  BOTCHAIN_CHAIN_ID_DEC,
  BOTCHAIN_TESTNET,
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  EXPLORER_BASE,
  STATUS_NAMES,
  describeConnectError,
  type StatusName,
} from "@/lib/contract";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const RECENT_BOUNTIES_LIMIT = 10;
const FEED_LIMIT = 25;

export interface FeedEntry {
  id: number;
  time: string;
  text: string;
}

export interface RecentBounty {
  id: bigint;
  description: string;
  status: StatusName;
}

export interface BountyDetail {
  id: bigint;
  status: StatusName;
  description: string;
  amount: bigint;
  requester: string;
  agent: string;
  agentRatingText: string;
  alreadyRated: boolean;
}

export type LogKind = "pending" | "ok" | "err" | "";

export interface LogState {
  message: string;
  kind: LogKind;
  txHash?: string;
}

let feedIdCounter = 0;

export function useEscrow() {
  const [signerAddress, setSignerAddress] = useState<string | null>(null);
  const [onBotChain, setOnBotChain] = useState(false);
  const [recentBounties, setRecentBounties] = useState<RecentBounty[] | null>(null);
  const [recentBountiesError, setRecentBountiesError] = useState<string | null>(null);
  const [eventFeed, setEventFeed] = useState<FeedEntry[]>([]);
  const [bountyDetail, setBountyDetail] = useState<BountyDetail | null>(null);
  const [log, setLog] = useState<LogState>({ message: "", kind: "" });
  const [busy, setBusy] = useState(false);

  const providerRef = useRef<ethers.BrowserProvider | null>(null);
  const signerRef = useRef<ethers.JsonRpcSigner | null>(null);
  const contractRef = useRef<ethers.Contract | null>(null);

  const writeLog = useCallback((message: string, kind: LogKind = "", txHash?: string) => {
    setLog({ message, kind, txHash });
  }, []);

  const addFeedEntry = useCallback((text: string) => {
    setEventFeed((prev) => {
      const entry: FeedEntry = { id: feedIdCounter++, time: new Date().toLocaleTimeString(), text };
      return [entry, ...prev].slice(0, FEED_LIMIT);
    });
  }, []);

  const setupEventFeed = useCallback(
    (contract: ethers.Contract) => {
      contract.on("BountyCreated", (id, _requester, amount, description) => {
        addFeedEntry(`Bounty #${id.toString()} created for ${ethers.formatEther(amount)} BOT - "${description}"`);
      });
      contract.on("BountyClaimed", (id, agent) => {
        addFeedEntry(`Bounty #${id.toString()} claimed by ${agent.slice(0, 6)}…${agent.slice(-4)}`);
      });
      contract.on("BountyReleased", (id, agent, amount) => {
        addFeedEntry(
          `Bounty #${id.toString()} released - ${ethers.formatEther(amount)} BOT paid to ${agent.slice(0, 6)}…${agent.slice(-4)}`
        );
      });
      contract.on("BountyRefunded", (id, requester, amount) => {
        addFeedEntry(
          `Bounty #${id.toString()} refunded - ${ethers.formatEther(amount)} BOT back to ${requester.slice(0, 6)}…${requester.slice(-4)}`
        );
      });
      contract.on("AgentRated", (bountyId, agent, _requester, score) => {
        addFeedEntry(`Bounty #${bountyId.toString()}: ${agent.slice(0, 6)}…${agent.slice(-4)} rated ${score.toString()}/5`);
      });
    },
    [addFeedEntry]
  );

  const refreshRecentBounties = useCallback(async () => {
    const contract = contractRef.current;
    if (!contract) return;
    try {
      const count: bigint = await contract.bountyCount();
      if (count === 0n) {
        setRecentBounties([]);
        setRecentBountiesError(null);
        return;
      }
      const oldest = count > BigInt(RECENT_BOUNTIES_LIMIT) ? count - BigInt(RECENT_BOUNTIES_LIMIT) : 0n;
      const list: RecentBounty[] = [];
      for (let id = count - 1n; id >= oldest; id--) {
        const bounty = await contract.bounties(id);
        list.push({
          id,
          description: bounty.description,
          status: STATUS_NAMES[Number(bounty.status)],
        });
      }
      setRecentBounties(list);
      setRecentBountiesError(null);
    } catch (err: any) {
      setRecentBountiesError(`Couldn't load recent bounties: ${err.shortMessage || err.message}`);
    }
  }, []);

  const refreshNetwork = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider) {
      setOnBotChain(false);
      return false;
    }
    const network = await provider.getNetwork();
    const isOnBotChain = Number(network.chainId) === BOTCHAIN_CHAIN_ID_DEC;
    setOnBotChain(isOnBotChain);
    return isOnBotChain;
  }, []);

  const useAccounts = useCallback(
    async (accounts: string[]) => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      providerRef.current = provider;
      signerRef.current = signer;
      setSignerAddress(accounts[0]);

      contractRef.current?.removeAllListeners();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      contractRef.current = contract;
      setupEventFeed(contract);

      const isOnBotChain = await refreshNetwork();
      if (isOnBotChain) await refreshRecentBounties();
      writeLog("");
    },
    [refreshNetwork, refreshRecentBounties, setupEventFeed, writeLog]
  );

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      writeLog("No wallet found. Install MetaMask to use this app.", "err");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      await useAccounts(accounts);
    } catch (err: any) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          await useAccounts(accounts);
          return;
        }
      } catch {
        /* fall through to the error message below */
      }
      writeLog(describeConnectError(err), "err");
    }
  }, [useAccounts, writeLog]);

  const switchAccount = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) await useAccounts(accounts);
    } catch (err: any) {
      writeLog(describeConnectError(err), "err");
    }
  }, [useAccounts, writeLog]);

  const addOrSwitchNetwork = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BOTCHAIN_TESTNET.chainId }],
      });
    } catch (switchErr: any) {
      if (switchErr.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BOTCHAIN_TESTNET],
          });
        } catch (addErr: any) {
          writeLog(`Could not add BOT Chain: ${addErr.shortMessage || addErr.message}`, "err");
          return;
        }
      } else {
        writeLog(`Could not switch network: ${switchErr.shortMessage || switchErr.message}`, "err");
        return;
      }
    }
    await refreshNetwork();
    await refreshRecentBounties();
  }, [refreshNetwork, refreshRecentBounties, writeLog]);

  const requireSignerContract = useCallback(() => {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerRef.current!);
  }, []);

  const describeAgentRating = useCallback(async (agent: string) => {
    if (agent === ethers.ZeroAddress) return "(no agent yet)";
    const contract = contractRef.current!;
    const summary = await contract.getAgentRatingSummary(agent);
    if (summary.count === 0n) return "No ratings yet";
    const average = Number(summary.totalScore) / Number(summary.count);
    return `${average.toFixed(1)} / 5 (${summary.count.toString()} rating${summary.count === 1n ? "" : "s"})`;
  }, []);

  const loadBounty = useCallback(
    async (idInput: string | bigint) => {
      const idStr = typeof idInput === "bigint" ? idInput.toString() : idInput.trim();
      if (idStr === "") {
        writeLog("Enter a bounty ID.", "err");
        return;
      }
      const contract = contractRef.current;
      if (!contract) return;
      try {
        const id = BigInt(idStr);
        const bounty = await contract.bounties(id);
        if (bounty.requester === ethers.ZeroAddress) {
          setBountyDetail(null);
          writeLog("No bounty exists with that ID.", "err");
          return;
        }
        const status = STATUS_NAMES[Number(bounty.status)];
        const agentRatingText = await describeAgentRating(bounty.agent);
        const alreadyRated: boolean = await contract.bountyRated(id);
        setBountyDetail({
          id,
          status,
          description: bounty.description,
          amount: bounty.amount,
          requester: bounty.requester,
          agent: bounty.agent,
          agentRatingText,
          alreadyRated,
        });
        // Deliberately not clearing the log here - a caller that just
        // completed a transaction wants its "View transaction" link to
        // survive this refresh, not vanish.
      } catch (err: any) {
        writeLog(`Load failed: ${err.shortMessage || err.message}`, "err");
      }
    },
    [describeAgentRating, writeLog]
  );

  const runTx = useCallback(
    async (action: () => Promise<ethers.ContractTransactionResponse>, doneMessage = "Done.") => {
      setBusy(true);
      try {
        writeLog("Confirm the transaction in your wallet…", "pending");
        const tx = await action();
        writeLog("Transaction sent, waiting for confirmation…", "pending");
        const receipt = await tx.wait();
        writeLog(doneMessage, "ok", receipt?.hash);
        if (bountyDetail) await loadBounty(bountyDetail.id);
        await refreshRecentBounties();
      } catch (err: any) {
        writeLog(`Transaction failed: ${err.shortMessage || err.message}`, "err");
      } finally {
        setBusy(false);
      }
    },
    [bountyDetail, loadBounty, refreshRecentBounties, writeLog]
  );

  const createBounty = useCallback(
    async (description: string, amountStr: string) => {
      if (!description.trim() || !amountStr.trim() || Number(amountStr) <= 0) {
        writeLog("Enter a description and a positive BOT amount.", "err");
        return;
      }
      setBusy(true);
      try {
        writeLog("Confirm the transaction in your wallet…", "pending");
        const value = ethers.parseEther(amountStr);
        const writable = requireSignerContract();
        const tx = await writable.createBounty(description.trim(), { value });
        writeLog("Transaction sent, waiting for confirmation…", "pending");
        const receipt = await tx.wait();

        let newId: bigint | null = null;
        for (const l of receipt.logs) {
          try {
            const parsed = contractRef.current!.interface.parseLog(l);
            if (parsed && parsed.name === "BountyCreated") {
              newId = parsed.args.id;
              break;
            }
          } catch {
            /* not our event, skip */
          }
        }

        writeLog(`Bounty created${newId !== null ? ` (#${newId.toString()})` : ""}.`, "ok", receipt.hash);
        await refreshRecentBounties();
        if (newId !== null) await loadBounty(newId);
      } catch (err: any) {
        writeLog(`Create failed: ${err.shortMessage || err.message}`, "err");
      } finally {
        setBusy(false);
      }
    },
    [loadBounty, refreshRecentBounties, requireSignerContract, writeLog]
  );

  const claim = useCallback(
    (id: bigint) => runTx(() => requireSignerContract().claimBounty(id)),
    [requireSignerContract, runTx]
  );
  const release = useCallback(
    (id: bigint) => runTx(() => requireSignerContract().release(id)),
    [requireSignerContract, runTx]
  );
  const refund = useCallback(
    (id: bigint) => runTx(() => requireSignerContract().refund(id)),
    [requireSignerContract, runTx]
  );
  const rate = useCallback(
    (id: bigint, score: number) => runTx(() => requireSignerContract().rateAgent(id, score), "Rating submitted."),
    [requireSignerContract, runTx]
  );

  useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        setSignerAddress(null);
        signerRef.current = null;
        setOnBotChain(false);
        setRecentBounties(null);
        return;
      }
      await useAccounts(accounts);
      if (bountyDetail) await loadBounty(bountyDetail.id);
    };
    const onChainChanged = () => {
      refreshNetwork().then((isOnBotChain) => {
        if (isOnBotChain) refreshRecentBounties();
      });
    };
    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", onChainChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // If MetaMask already has this site authorized (from a previous visit,
    // or because the user approved it directly via the extension icon),
    // pick that up without requiring another click.
    (async () => {
      if (!window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) await useAccounts(accounts);
      } catch {
        /* ignore - falls back to the disconnected state */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    signerAddress,
    onBotChain,
    recentBounties,
    recentBountiesError,
    eventFeed,
    bountyDetail,
    log,
    busy,
    explorerBase: EXPLORER_BASE,
    contractAddress: CONTRACT_ADDRESS,
    connectWallet,
    switchAccount,
    addOrSwitchNetwork,
    createBounty,
    loadBounty,
    claim,
    release,
    refund,
    rate,
    clearLog: () => writeLog(""),
  };
}
