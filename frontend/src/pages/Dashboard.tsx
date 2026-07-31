import { Link } from "react-router-dom";
import { useEscrow } from "@/hooks/useEscrow";
import { WalletBanner } from "@/components/dashboard/WalletBanner";
import { NetworkBanner } from "@/components/dashboard/NetworkBanner";
import { EventFeedPanel } from "@/components/dashboard/EventFeedPanel";
import { CreateBountyPanel } from "@/components/dashboard/CreateBountyPanel";
import { RecentBountiesPanel } from "@/components/dashboard/RecentBountiesPanel";
import { BountyDetailPanel } from "@/components/dashboard/BountyDetailPanel";
import { TxLog } from "@/components/dashboard/TxLog";

export default function Dashboard() {
  const escrow = useEscrow();
  const canInteract = Boolean(escrow.signerAddress) && escrow.onBotChain;

  return (
    <div className="dashboard-theme">
      <main className="max-w-[640px] mx-auto px-5 pt-8 pb-20">
        <header className="mb-7">
          <Link to="/" className="inline-block no-underline hover:opacity-80 transition-opacity">
            <h1 className="font-sentient text-[2rem] font-normal m-0 mb-1.5 tracking-tight" style={{ color: "var(--foreground)" }}>
              Agent Escrow
            </h1>
          </Link>
          <p className="font-mono m-0 text-[0.85rem]" style={{ color: "var(--muted-foreground)" }}>
            Post a BOT bounty, an agent claims it, you release payment on-chain. No middleman.
          </p>
        </header>

        <WalletBanner
          signerAddress={escrow.signerAddress}
          onConnect={escrow.connectWallet}
          onSwitchAccount={escrow.switchAccount}
        />
        <NetworkBanner show={Boolean(escrow.signerAddress) && !escrow.onBotChain} onFix={escrow.addOrSwitchNetwork} />

        <div className="my-5 space-y-4.5">
          <EventFeedPanel feed={escrow.eventFeed} />
          <CreateBountyPanel disabled={!canInteract || escrow.busy} onCreate={escrow.createBounty} />
          <RecentBountiesPanel
            connected={Boolean(escrow.signerAddress)}
            bounties={escrow.recentBounties}
            error={escrow.recentBountiesError}
            onSelect={(id) => escrow.loadBounty(id)}
          />
          <BountyDetailPanel
            signerAddress={escrow.signerAddress}
            canInteract={canInteract}
            explorerBase={escrow.explorerBase}
            contractAddress={escrow.contractAddress}
            detail={escrow.bountyDetail}
            busy={escrow.busy}
            onLoad={(id) => escrow.loadBounty(id)}
            onClaim={escrow.claim}
            onRelease={escrow.release}
            onRefund={escrow.refund}
            onRate={escrow.rate}
          />
        </div>

        <TxLog log={escrow.log} explorerBase={escrow.explorerBase} />
      </main>
    </div>
  );
}
