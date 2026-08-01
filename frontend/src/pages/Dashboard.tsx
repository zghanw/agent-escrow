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
import { ProfilePanel } from "@/components/dashboard/ProfilePanel";
import { WalletLookupPanel } from "@/components/dashboard/WalletLookupPanel";
import logoMark from "@/assets/logo.png";

export default function Dashboard() {
  const escrow = useEscrow();
  const canInteract = Boolean(escrow.signerAddress) && escrow.onBotChain && escrow.contractConfigured;
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
            Fund a designated agent, verify submitted work, and settle with symmetric on-chain deadlines.
          </p>
        </header>

        <div className="space-y-2.5">
          <WalletBanner
            signerAddress={escrow.signerAddress}
            botBalance={escrow.botBalance}
            onConnect={escrow.connectWallet}
            onSwitchAccount={escrow.switchAccount}
          />
          <NetworkBanner show={Boolean(escrow.signerAddress) && !escrow.onBotChain} onFix={escrow.addOrSwitchNetwork} />
          {!escrow.contractConfigured && (
            <div className="banner bad" role="status">
              <span>Escrow V2 deployment is not configured. Wallet transactions are disabled.</span>
            </div>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-5">
          <TabsList>
            <TabsTrigger value="bounties">Bounties</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
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
              onAccept={escrow.accept}
              onCancelOpen={escrow.cancelOpen}
              onSubmit={escrow.submit}
              onRefundExpired={escrow.refundExpired}
              onRelease={escrow.release}
              onFinalize={escrow.finalize}
              onSetCancellationApproval={escrow.setCancellationApproval}
              onRate={escrow.rate}
            />
          </TabsContent>

          <TabsContent value="create" forceMount className="mt-4.5 data-[state=inactive]:hidden">
            <CreateBountyPanel disabled={!canInteract || escrow.busy} onCreate={escrow.createBounty} />
          </TabsContent>

          <TabsContent value="activity" className="mt-4.5">
            <EventFeedPanel feed={escrow.eventFeed} />
          </TabsContent>

          <TabsContent value="wallets" forceMount className="mt-4.5 data-[state=inactive]:hidden">
            <WalletLookupPanel
              explorerBase={escrow.explorerBase}
              loadHistory={escrow.loadWalletHistory}
              onSelectBounty={(id) => {
                void escrow.loadBounty(id);
                setTab("bounties");
              }}
            />
          </TabsContent>

          <TabsContent value="profile" className="mt-4.5">
            <ProfilePanel
              signerAddress={escrow.signerAddress}
              explorerBase={escrow.explorerBase}
              loadHistory={escrow.loadWalletHistory}
              historyVersion={escrow.walletHistoryVersion}
              onSelectBounty={(id) => {
                void escrow.loadBounty(id);
                setTab("bounties");
              }}
            />
          </TabsContent>
        </Tabs>

        <TxLog log={escrow.log} explorerBase={escrow.explorerBase} />
      </main>
    </div>
  );
}
