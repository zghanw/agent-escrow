import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import {
  BOTCHAIN_CHAIN_ID_DEC,
  BOTCHAIN_TESTNET,
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  CONTRACT_CONFIGURED,
  CONTRACT_DEPLOY_BLOCK,
  EXPLORER_BASE,
  STATUS_NAMES,
  describeConnectError,
  describeTxError,
  shortAddr,
  type StatusName,
} from "@/lib/contract";
import { validateBountyDraft, type BountyDraft } from "@/lib/escrowPolicy";
import {
  mergeActivityEntries,
  type ActivityFeedEntry,
} from "@/lib/activityFeed";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const RECENT_BOUNTIES_LIMIT = 10;
const FEED_LIMIT = 25;
const MAX_LOG_RANGE = 4500; // stay under this RPC's undocumented 5000-block eth_getLogs cap
const POLL_INTERVAL_MS = 5000;
const REFRESH_HINT = "Try refreshing the website.";

function withRefreshHint(message: string, error?: any) {
  return error?.code === 4001 ? message : `${message} ${REFRESH_HINT}`;
}

export type FeedEntry = ActivityFeedEntry;

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
  submission: string;
  workDeadline: number;
  reviewDeadline: number;
  workDuration: number;
  reviewPeriod: number;
  requesterCancellationApproved: boolean;
  agentCancellationApproved: boolean;
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
      const [id, , agent, amount, description] = args;
      return `Bounty #${id.toString()} created for ${ethers.formatEther(amount)} BOT — designated to ${shortAddr(agent)}: "${description}"`;
    }
    case "BountyAccepted": {
      const [id, agent] = args;
      return `Bounty #${id.toString()} accepted by ${shortAddr(agent)}`;
    }
    case "WorkSubmitted": {
      const [id, agent, submission] = args;
      return `Bounty #${id.toString()} submitted by ${shortAddr(agent)} — ${submission}`;
    }
    case "BountyReleased": {
      const [id, agent, amount] = args;
      return `Bounty #${id.toString()} released - ${ethers.formatEther(amount)} BOT paid to ${shortAddr(agent)}`;
    }
    case "BountyRefunded": {
      const [id, requester, amount] = args;
      return `Bounty #${id.toString()} refunded - ${ethers.formatEther(amount)} BOT back to ${shortAddr(requester)}`;
    }
    case "BountyCancelled": {
      const [id, requester, amount, mutual] = args;
      const reason = mutual ? "by mutual approval" : "before acceptance";
      return `Bounty #${id.toString()} cancelled ${reason} — ${ethers.formatEther(amount)} BOT back to ${shortAddr(requester)}`;
    }
    case "CancellationApprovalUpdated": {
      const [id, party, approved] = args;
      return `Bounty #${id.toString()}: ${shortAddr(party)} ${approved ? "approved" : "revoked"} cancellation`;
    }
    case "AgentRated": {
      const [bountyId, agent, , score] = args;
      return `Bounty #${bountyId.toString()}: ${shortAddr(agent)} rated ${score.toString()}/5`;
    }
    default:
      return null;
  }
}

async function queryEventFeed(
  contract: ethers.Contract,
  provider: ethers.Provider,
  fromBlock: number,
  toBlock: number
): Promise<FeedEntry[]> {
  const ranges: Array<[number, number]> = [];
  for (let to = toBlock; to >= fromBlock; to -= MAX_LOG_RANGE) {
    const from = Math.max(fromBlock, to - MAX_LOG_RANGE + 1);
    ranges.push([from, to]);
  }

  const chunks = await Promise.all(ranges.map(([from, to]) => contract.queryFilter("*", from, to)));

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
      eventKey: `${log.transactionHash}:${log.index}`,
      blockNumber: log.blockNumber,
      logIndex: log.index,
      time: timestamp ? new Date(timestamp * 1000).toLocaleTimeString() : "",
      text,
    });
  }
  return mergeActivityEntries([], entries, FEED_LIMIT);
}

// One-time history read so the Activity tab isn't empty just because its
// events fired before this page load's live listeners existed - `contract.on`
// only ever reports events going forward from the moment it's registered.
async function backfillEventFeed(contract: ethers.Contract, provider: ethers.Provider) {
  const latestBlock = await provider.getBlockNumber();
  const entries = await queryEventFeed(contract, provider, CONTRACT_DEPLOY_BLOCK, latestBlock);
  return { entries, latestBlock };
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
  const lastActivityBlockRef = useRef(0);
  const syncInFlightRef = useRef(false);

  const writeLog = useCallback((message: string, kind: LogKind = "", txHash?: string) => {
    setLog({ message, kind, txHash });
  }, []);

  const addFeedEntry = useCallback((text: string, payload: ethers.ContractEventPayload) => {
    const entry: FeedEntry = {
      id: feedIdCounter++,
      eventKey: `${payload.log.transactionHash}:${payload.log.index}`,
      blockNumber: payload.log.blockNumber,
      logIndex: payload.log.index,
      time: new Date().toLocaleTimeString(),
      text,
    };
    setEventFeed((prev) => mergeActivityEntries(prev, [entry], FEED_LIMIT));
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
      contract.on("BountyCreated", (id, requester, agent, amount, description, workDuration, reviewPeriod, payload) => {
        const text = formatEventLog("BountyCreated", [
          id,
          requester,
          agent,
          amount,
          description,
          workDuration,
          reviewPeriod,
        ]);
        if (text) addFeedEntry(text, payload);
      });
      contract.on("BountyAccepted", (id, agent, workDeadline, payload) => {
        const text = formatEventLog("BountyAccepted", [id, agent, workDeadline]);
        if (text) addFeedEntry(text, payload);
      });
      contract.on("WorkSubmitted", (id, agent, submission, reviewDeadline, payload) => {
        const text = formatEventLog("WorkSubmitted", [id, agent, submission, reviewDeadline]);
        if (text) addFeedEntry(text, payload);
      });
      contract.on("BountyReleased", (id, agent, amount, payload) => {
        const text = formatEventLog("BountyReleased", [id, agent, amount]);
        if (text) addFeedEntry(text, payload);
      });
      contract.on("BountyRefunded", (id, requester, amount, payload) => {
        const text = formatEventLog("BountyRefunded", [id, requester, amount]);
        if (text) addFeedEntry(text, payload);
      });
      contract.on("BountyCancelled", (id, requester, amount, mutual, payload) => {
        const text = formatEventLog("BountyCancelled", [id, requester, amount, mutual]);
        if (text) addFeedEntry(text, payload);
      });
      contract.on("CancellationApprovalUpdated", (id, party, approved, payload) => {
        const text = formatEventLog("CancellationApprovalUpdated", [id, party, approved]);
        if (text) addFeedEntry(text, payload);
      });
      contract.on("AgentRated", (bountyId, agent, requester, score, payload) => {
        const text = formatEventLog("AgentRated", [bountyId, agent, requester, score]);
        if (text) addFeedEntry(text, payload);
        if (agent.toLowerCase() === myAddress.toLowerCase()) refreshMyRating(myAddress);
      });
    },
    [addFeedEntry, refreshMyRating]
  );

  const refreshRecentBounties = useCallback(async (silent = false) => {
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
      if (!silent) setRecentBountiesError(`Couldn't load recent bounties: ${err.shortMessage || err.message}`);
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
      const snapshot = await backfillEventFeed(contractRef.current, providerRef.current);
      setEventFeed(snapshot.entries);
      lastActivityBlockRef.current = snapshot.latestBlock;
    } catch {
      hasBackfilledRef.current = false;
    }
  }, []);

  const refreshActivityFeed = useCallback(async () => {
    const contract = contractRef.current;
    const provider = providerRef.current;
    if (!contract || !provider) return;
    if (!hasBackfilledRef.current || lastActivityBlockRef.current === 0) {
      await maybeBackfillEventFeed();
      return;
    }

    const latestBlock = await provider.getBlockNumber();
    const fromBlock = lastActivityBlockRef.current + 1;
    if (fromBlock > latestBlock) return;

    const entries = await queryEventFeed(contract, provider, fromBlock, latestBlock);
    setEventFeed((current) => mergeActivityEntries(current, entries, FEED_LIMIT));
    lastActivityBlockRef.current = latestBlock;
  }, [maybeBackfillEventFeed]);

  const activateAccounts = useCallback(
    async (accounts: string[]) => {
      // "any" tells ethers not to treat a runtime chain change as a fatal
      // NETWORK_ERROR (its default assumes the network never changes).
      const provider = new ethers.BrowserProvider(window.ethereum, "any");
      const signer = await provider.getSigner();
      providerRef.current = provider;
      signerRef.current = signer;
      setSignerAddress(accounts[0]);

      contractRef.current?.removeAllListeners();
      if (!CONTRACT_CONFIGURED) {
        contractRef.current = null;
        setRecentBounties([]);
        setBountyDetail(null);
        await refreshNetwork();
        writeLog(
          "Escrow V2 is not deployed yet. Configure VITE_CONTRACT_ADDRESS and VITE_CONTRACT_DEPLOY_BLOCK after deployment.",
          "err"
        );
        return;
      }

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
      await activateAccounts(accounts);
    } catch (err: any) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          await activateAccounts(accounts);
          return;
        }
      } catch {
        /* fall through to the error message below */
      }
      writeLog(describeConnectError(err), "err");
    }
  }, [activateAccounts, writeLog]);

  const switchAccount = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) await activateAccounts(accounts);
    } catch (err: any) {
      writeLog(describeConnectError(err), "err");
    }
  }, [activateAccounts, writeLog]);

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
          writeLog(withRefreshHint(`Could not add BOT Chain: ${addErr.shortMessage || addErr.message}`, addErr), "err");
          return;
        }
      } else {
        writeLog(
          withRefreshHint(`Could not switch network: ${switchErr.shortMessage || switchErr.message}`, switchErr),
          "err"
        );
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

  const fetchBountyDetail = useCallback(
    async (id: bigint): Promise<BountyDetail | null> => {
      const contract = contractRef.current;
      if (!contract) return null;
      const bounty = await contract.bounties(id);
      if (bounty.requester === ethers.ZeroAddress) return null;

      return {
        id,
        status: STATUS_NAMES[Number(bounty.status)],
        description: bounty.description,
        amount: bounty.amount,
        requester: bounty.requester,
        agent: bounty.agent,
        submission: bounty.submission,
        workDeadline: Number(bounty.workDeadline),
        reviewDeadline: Number(bounty.reviewDeadline),
        workDuration: Number(bounty.workDuration),
        reviewPeriod: Number(bounty.reviewPeriod),
        requesterCancellationApproved: bounty.requesterCancellationApproved,
        agentCancellationApproved: bounty.agentCancellationApproved,
        agentRatingText: await describeAgentRating(bounty.agent),
        alreadyRated: await contract.bountyRated(id),
      };
    },
    [describeAgentRating]
  );

  const loadBounty = useCallback(
    async (idInput: string | bigint) => {
      const idStr = typeof idInput === "bigint" ? idInput.toString() : idInput.trim();
      if (idStr === "") {
        writeLog("Enter a bounty ID.", "err");
        return;
      }
      try {
        const id = BigInt(idStr);
        const detail = await fetchBountyDetail(id);
        if (!detail) {
          setBountyDetail(null);
          writeLog("No bounty exists with that ID.", "err");
          return;
        }
        setBountyDetail(detail);
        // Deliberately not clearing the log here - a caller that just
        // completed a transaction wants its "View transaction" link to
        // survive this refresh, not vanish.
      } catch (err: any) {
        writeLog(withRefreshHint(`Load failed: ${err.shortMessage || err.message}`), "err");
      }
    },
    [fetchBountyDetail, writeLog]
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
        writeLog(withRefreshHint(`Transaction failed: ${describeTxError(err)}`, err), "err");
      } finally {
        setBusy(false);
      }
    },
    [bountyDetail, loadBounty, refreshRecentBounties, writeLog]
  );

  const createBounty = useCallback(
    async (draft: BountyDraft) => {
      if (!signerAddress) {
        writeLog("Connect the requester wallet first.", "err");
        return false;
      }
      const validationError = validateBountyDraft(draft, signerAddress);
      if (validationError) {
        writeLog(validationError, "err");
        return false;
      }

      setBusy(true);
      try {
        writeLog("Confirm the transaction in your wallet…", "pending");
        const value = ethers.parseEther(draft.amount);
        const workDuration = Math.round(Number(draft.workHours) * 60 * 60);
        const reviewPeriod = Math.round(Number(draft.reviewHours) * 60 * 60);
        const writable = requireSignerContract();
        const tx = await writable.createBounty(
          draft.agent,
          draft.description.trim(),
          workDuration,
          reviewPeriod,
          { value }
        );
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
        writeLog(withRefreshHint(`Create failed: ${describeTxError(err)}`, err), "err");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [loadBounty, refreshRecentBounties, requireSignerContract, signerAddress, writeLog]
  );

  const accept = useCallback(
    (id: bigint) => runTx(() => requireSignerContract().acceptBounty(id), "Bounty accepted."),
    [requireSignerContract, runTx]
  );
  const cancelOpen = useCallback(
    (id: bigint) => runTx(() => requireSignerContract().cancelOpenBounty(id), "Open bounty cancelled."),
    [requireSignerContract, runTx]
  );
  const submit = useCallback(
    (id: bigint, submission: string) => {
      if (!submission.trim()) {
        writeLog("Enter a deliverable URL or content hash.", "err");
        return;
      }
      void runTx(
        () => requireSignerContract().submitWork(id, submission.trim()),
        "Work submitted for review."
      );
    },
    [requireSignerContract, runTx, writeLog]
  );
  const refundExpired = useCallback(
    (id: bigint) => runTx(() => requireSignerContract().refundExpiredBounty(id), "Expired bounty refunded."),
    [requireSignerContract, runTx]
  );
  const release = useCallback(
    (id: bigint) => runTx(() => requireSignerContract().release(id), "Payment released."),
    [requireSignerContract, runTx]
  );
  const finalize = useCallback(
    (id: bigint) => runTx(() => requireSignerContract().finalize(id), "Review period ended; payment finalized."),
    [requireSignerContract, runTx]
  );
  const setCancellationApproval = useCallback(
    (id: bigint, approved: boolean) =>
      runTx(
        () => requireSignerContract().setCancellationApproval(id, approved),
        approved ? "Cancellation approved." : "Cancellation approval revoked."
      ),
    [requireSignerContract, runTx]
  );
  const rate = useCallback(
    (id: bigint, score: number) => runTx(() => requireSignerContract().rateAgent(id, score), "Rating submitted."),
    [requireSignerContract, runTx]
  );

  const selectedBountyId = bountyDetail?.id ?? null;
  const synchronizeReadState = useCallback(async () => {
    if (
      syncInFlightRef.current ||
      document.visibilityState !== "visible" ||
      !signerAddress ||
      !onBotChain ||
      !contractRef.current
    ) {
      return;
    }

    syncInFlightRef.current = true;
    try {
      const reads: Promise<unknown>[] = [
        refreshActivityFeed(),
        refreshRecentBounties(true),
        refreshMyRating(signerAddress),
      ];
      if (selectedBountyId !== null) {
        reads.push(
          fetchBountyDetail(selectedBountyId).then((detail) => {
            if (detail) setBountyDetail(detail);
          })
        );
      }
      await Promise.allSettled(reads);
    } finally {
      syncInFlightRef.current = false;
    }
  }, [fetchBountyDetail, onBotChain, refreshActivityFeed, refreshMyRating, refreshRecentBounties, selectedBountyId, signerAddress]);

  useEffect(() => {
    if (!signerAddress || !onBotChain || !CONTRACT_CONFIGURED) return;

    let intervalId: number | undefined;
    const restartPolling = () => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
      intervalId = undefined;
      if (document.visibilityState !== "visible") return;
      void synchronizeReadState();
      intervalId = window.setInterval(() => void synchronizeReadState(), POLL_INTERVAL_MS);
    };

    restartPolling();
    document.addEventListener("visibilitychange", restartPolling);
    return () => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", restartPolling);
    };
  }, [onBotChain, signerAddress, synchronizeReadState]);

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
      await activateAccounts(accounts);
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
        if (accounts.length > 0) await activateAccounts(accounts);
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
    contractConfigured: CONTRACT_CONFIGURED,
    connectWallet,
    switchAccount,
    addOrSwitchNetwork,
    createBounty,
    loadBounty,
    accept,
    cancelOpen,
    submit,
    refundExpired,
    release,
    finalize,
    setCancellationApproval,
    rate,
    clearLog: () => writeLog(""),
  };
}
