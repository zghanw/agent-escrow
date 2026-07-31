import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import {
  BOTCHAIN_CHAIN_ID_DEC,
  BOTCHAIN_TESTNET,
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  CONTRACT_DEPLOY_BLOCK,
  EXPLORER_BASE,
  STATUS_NAMES,
  describeConnectError,
  describeTxError,
  shortAddr,
  type StatusName,
} from "@/lib/contract";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const RECENT_BOUNTIES_LIMIT = 10;
const FEED_LIMIT = 25;
const MAX_LOG_RANGE = 4500; // stay under this RPC's undocumented 5000-block eth_getLogs cap

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

// Shared by the live listeners (setupEventFeed) and the historical backfill
// (backfillEventFeed) so both produce identical text for the same event.
function formatEventLog(name: string, args: readonly any[]): string | null {
  switch (name) {
    case "BountyCreated": {
      const [id, , amount, description] = args;
      return `Bounty #${id.toString()} created for ${ethers.formatEther(amount)} BOT - "${description}"`;
    }
    case "BountyClaimed": {
      const [id, agent] = args;
      return `Bounty #${id.toString()} claimed by ${shortAddr(agent)}`;
    }
    case "BountyReleased": {
      const [id, agent, amount] = args;
      return `Bounty #${id.toString()} released - ${ethers.formatEther(amount)} BOT paid to ${shortAddr(agent)}`;
    }
    case "BountyRefunded": {
      const [id, requester, amount] = args;
      return `Bounty #${id.toString()} refunded - ${ethers.formatEther(amount)} BOT back to ${shortAddr(requester)}`;
    }
    case "AgentRated": {
      const [bountyId, agent, , score] = args;
      return `Bounty #${bountyId.toString()}: ${shortAddr(agent)} rated ${score.toString()}/5`;
    }
    default:
      return null;
  }
}

// One-time history read so the Activity tab isn't empty just because its
// events fired before this page load's live listeners existed - `contract.on`
// only ever reports events going forward from the moment it's registered.
// Chunks the range from deploy to latest (this RPC rejects >5000 blocks per
// eth_getLogs call) and fetches all chunks in parallel rather than paging
// sequentially, since the chain is already 100k+ blocks past this contract's
// deployment.
async function backfillEventFeed(contract: ethers.Contract, provider: ethers.Provider): Promise<FeedEntry[]> {
  const latest = await provider.getBlockNumber();

  const ranges: Array<[number, number]> = [];
  for (let to = latest; to >= CONTRACT_DEPLOY_BLOCK; to -= MAX_LOG_RANGE) {
    const from = Math.max(CONTRACT_DEPLOY_BLOCK, to - MAX_LOG_RANGE + 1);
    ranges.push([from, to]);
  }

  const chunks = await Promise.all(
    ranges.map(([from, to]) =>
      contract.queryFilter("*", from, to).catch(() => [] as (ethers.EventLog | ethers.Log)[])
    )
  );

  const logs = chunks
    .flat()
    .filter((log): log is ethers.EventLog => "args" in log && "fragment" in log)
    .sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index)
    .slice(-FEED_LIMIT);

  const blockTimestamps = new Map<number, number>();
  await Promise.all(
    [...new Set(logs.map((log) => log.blockNumber))].map(async (blockNumber) => {
      const block = await provider.getBlock(blockNumber);
      if (block) blockTimestamps.set(blockNumber, block.timestamp);
    })
  );

  const entries: FeedEntry[] = [];
  for (const log of logs) {
    const text = formatEventLog(log.fragment.name, log.args);
    if (!text) continue;
    const timestamp = blockTimestamps.get(log.blockNumber);
    entries.push({
      id: feedIdCounter++,
      time: timestamp ? new Date(timestamp * 1000).toLocaleTimeString() : "",
      text,
    });
  }
  return entries.reverse(); // newest first, matching addFeedEntry's convention
}

export function useEscrow() {
  const [signerAddress, setSignerAddress] = useState<string | null>(null);
  const [onBotChain, setOnBotChain] = useState(false);
  const [recentBounties, setRecentBounties] = useState<RecentBounty[] | null>(null);
  const [recentBountiesError, setRecentBountiesError] = useState<string | null>(null);
  const [eventFeed, setEventFeed] = useState<FeedEntry[]>([]);
  const [bountyDetail, setBountyDetail] = useState<BountyDetail | null>(null);
  const [myRatingText, setMyRatingText] = useState<string | null>(null);
  const [log, setLog] = useState<LogState>({ message: "", kind: "" });
  const [busy, setBusy] = useState(false);

  const providerRef = useRef<ethers.BrowserProvider | null>(null);
  const signerRef = useRef<ethers.JsonRpcSigner | null>(null);
  const contractRef = useRef<ethers.Contract | null>(null);
  const hasBackfilledRef = useRef(false);

  const writeLog = useCallback((message: string, kind: LogKind = "", txHash?: string) => {
    setLog({ message, kind, txHash });
  }, []);

  const addFeedEntry = useCallback((text: string) => {
    setEventFeed((prev) => {
      const entry: FeedEntry = { id: feedIdCounter++, time: new Date().toLocaleTimeString(), text };
      return [entry, ...prev].slice(0, FEED_LIMIT);
    });
  }, []);

  const describeAgentRating = useCallback(async (agent: string) => {
    if (agent === ethers.ZeroAddress) return "(no agent yet)";
    const contract = contractRef.current!;
    const summary = await contract.getAgentRatingSummary(agent);
    if (summary.count === 0n) return "No ratings yet";
    const average = Number(summary.totalScore) / Number(summary.count);
    return `${average.toFixed(1)} / 5 (${summary.count.toString()} rating${summary.count === 1n ? "" : "s"})`;
  }, []);

  const refreshMyRating = useCallback(
    async (address: string) => {
      if (!contractRef.current) return;
      try {
        setMyRatingText(await describeAgentRating(address));
      } catch {
        /* transient RPC hiccup - not worth surfacing as an error */
      }
    },
    [describeAgentRating]
  );

  const setupEventFeed = useCallback(
    (contract: ethers.Contract, myAddress: string) => {
      contract.on("BountyCreated", (id, requester, amount, description) => {
        const text = formatEventLog("BountyCreated", [id, requester, amount, description]);
        if (text) addFeedEntry(text);
      });
      contract.on("BountyClaimed", (id, agent) => {
        const text = formatEventLog("BountyClaimed", [id, agent]);
        if (text) addFeedEntry(text);
      });
      contract.on("BountyReleased", (id, agent, amount) => {
        const text = formatEventLog("BountyReleased", [id, agent, amount]);
        if (text) addFeedEntry(text);
      });
      contract.on("BountyRefunded", (id, requester, amount) => {
        const text = formatEventLog("BountyRefunded", [id, requester, amount]);
        if (text) addFeedEntry(text);
      });
      contract.on("AgentRated", (bountyId, agent, requester, score) => {
        const text = formatEventLog("AgentRated", [bountyId, agent, requester, score]);
        if (text) addFeedEntry(text);
        if (agent.toLowerCase() === myAddress.toLowerCase()) refreshMyRating(myAddress);
      });
    },
    [addFeedEntry, refreshMyRating]
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
    if (!providerRef.current || !window.ethereum) {
      setOnBotChain(false);
      return false;
    }
    try {
      // Ask the wallet directly rather than ethers' provider.getNetwork():
      // under the "any" network mode (needed so a runtime chain switch
      // doesn't throw), getNetwork() reports the *previous* chain on the
      // very call where it first notices a change, only catching up on the
      // call after - which would leave onBotChain wrong for a beat. A
      // direct eth_chainId request has no such lag.
      const chainIdHex: string = await window.ethereum.request({ method: "eth_chainId" });
      const isOnBotChain = parseInt(chainIdHex, 16) === BOTCHAIN_CHAIN_ID_DEC;
      setOnBotChain(isOnBotChain);
      return isOnBotChain;
    } catch {
      // A runtime chain switch can still surface as a rejected request here -
      // treat that the same as "not on BOT Chain" instead of leaving
      // onBotChain stuck at its last value.
      setOnBotChain(false);
      return false;
    }
  }, []);

  // Runs once per hook instance (not per account/network switch - the
  // contract's history doesn't depend on which account is connected).
  // Awaited fully before any live listeners are registered, so a real-time
  // event can't land in the gap and get clobbered by this backfill's
  // one-shot setEventFeed.
  const maybeBackfillEventFeed = useCallback(async () => {
    if (hasBackfilledRef.current || !contractRef.current || !providerRef.current) return;
    hasBackfilledRef.current = true;
    try {
      setEventFeed(await backfillEventFeed(contractRef.current, providerRef.current));
    } catch {
      /* best-effort - the live feed still works going forward */
    }
  }, []);

  const useAccounts = useCallback(
    async (accounts: string[]) => {
      // "any" tells ethers not to treat a runtime chain change as a fatal
      // NETWORK_ERROR (its default assumes the network never changes).
      const provider = new ethers.BrowserProvider(window.ethereum, "any");
      const signer = await provider.getSigner();
      providerRef.current = provider;
      signerRef.current = signer;
      setSignerAddress(accounts[0]);

      contractRef.current?.removeAllListeners();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      contractRef.current = contract;

      const isOnBotChain = await refreshNetwork();
      if (isOnBotChain) {
        await refreshRecentBounties();
        await refreshMyRating(accounts[0]);
        await maybeBackfillEventFeed();
      }
      setupEventFeed(contract, accounts[0]);
      writeLog("");
    },
    [maybeBackfillEventFeed, refreshMyRating, refreshNetwork, refreshRecentBounties, setupEventFeed, writeLog]
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
    const isOnBotChain = await refreshNetwork();
    if (isOnBotChain) {
      await refreshRecentBounties();
      if (signerAddress) await refreshMyRating(signerAddress);
      await maybeBackfillEventFeed();
    }
  }, [maybeBackfillEventFeed, refreshMyRating, refreshNetwork, refreshRecentBounties, signerAddress, writeLog]);

  const requireSignerContract = useCallback(() => {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerRef.current!);
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
        writeLog(`Transaction failed: ${describeTxError(err)}`, "err");
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
        return false;
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
        return true;
      } catch (err: any) {
        writeLog(`Create failed: ${describeTxError(err)}`, "err");
        return false;
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
        setMyRatingText(null);
        return;
      }
      await useAccounts(accounts);
      if (bountyDetail) await loadBounty(bountyDetail.id);
    };
    const onChainChanged = () => {
      refreshNetwork()
        .then((isOnBotChain) => {
          if (isOnBotChain) refreshRecentBounties();
        })
        .catch(() => setOnBotChain(false));
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
    myRatingText,
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
