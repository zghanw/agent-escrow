import { useState } from "react";
import { Link } from "react-router-dom";
import { GlassFilter } from "@/components/ui/liquid-glass-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEscrow } from "@/hooks/useEscrow";
import { WalletBanner } from "@/components/dashboard/WalletBanner";
import { NetworkBanner } from "@/components/dashboard/NetworkBanner";
import { EventFeedPanel } from "@/components/dashboard/EventFeedPanel";
import { CreateBountyPanel } from "@/components/dashboard/CreateBountyPanel";
import { RecentBountiesPanel } from "@/components/dashboard/RecentBountiesPanel";
import { BountyDetailPanel } from "@/components/dashboard/BountyDetailPanel";
import { TxLog } from "@/components/dashboard/TxLog";
import { Vault } from "@/components/dashboard/Vault";
import logoMark from "@/assets/logo.png";

export default function Dashboard() {
  const escrow = useEscrow();
  const canInteract = Boolean(escrow.signerAddress) && escrow.onBotChain;
  const [tab, setTab] = useState("bounties");

  return (
    <div className="dashboard-theme">
      <GlassFilter />
      <main className="max-w-[640px] mx-auto px-5 pt-8 pb-20">
        <header className="mb-7">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity mb-1.5">
            <img src={logoMark} alt="" className="h-7 w-7 object-contain shrink-0" />
            <h1 className="font-sentient text-[2rem] font-normal m-0 tracking-tight" style={{ color: "var(--foreground)" }}>
              Agent Escrow
            </h1>
          </Link>
          <p className="font-mono m-0 text-[0.85rem]" style={{ color: "var(--muted-foreground)" }}>
            Post a BOT bounty, an agent claims it, you release payment on-chain. No middleman.
          </p>
        </header>

        <div className="space-y-2.5">
          <WalletBanner
            signerAddress={escrow.signerAddress}
            onConnect={escrow.connectWallet}
            onSwitchAccount={escrow.switchAccount}
          />
          <NetworkBanner show={Boolean(escrow.signerAddress) && !escrow.onBotChain} onFix={escrow.addOrSwitchNetwork} />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-5">
          <TabsList>
            <TabsTrigger value="bounties">Bounties</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="bounties" className="mt-4.5 space-y-4.5">
            <Vault status={escrow.bountyDetail?.status ?? null} busy={escrow.busy} />
            <RecentBountiesPanel
              connected={Boolean(escrow.signerAddress)}
              bounties={escrow.recentBounties}
              error={escrow.recentBountiesError}
              onSelect={(id) => escrow.loadBounty(id)}
              onCreateClick={() => setTab("create")}
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
          </TabsContent>

          <TabsContent value="create" className="mt-4.5">
            <CreateBountyPanel disabled={!canInteract || escrow.busy} onCreate={escrow.createBounty} />
          </TabsContent>

          <TabsContent value="activity" className="mt-4.5">
            <EventFeedPanel feed={escrow.eventFeed} />
          </TabsContent>
        </Tabs>

        <TxLog log={escrow.log} explorerBase={escrow.explorerBase} />
      </main>
    </div>
  );
}
