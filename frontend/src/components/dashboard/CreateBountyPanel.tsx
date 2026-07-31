import { useState } from "react";
import { Panel } from "./Panel";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { BountyDraft } from "@/lib/escrowPolicy";

export function CreateBountyPanel({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate: (draft: BountyDraft) => Promise<boolean>;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [agent, setAgent] = useState("");
  const [workHours, setWorkHours] = useState("24");
  const [reviewHours, setReviewHours] = useState("6");

  const handleCreate = async () => {
    const success = await onCreate({ description, amount, agent, workHours, reviewHours });
    if (success) {
      setDescription("");
      setAmount("");
      setAgent("");
    }
  };

  return (
    <Panel heading="Create a bounty">
      <label className="field-label" htmlFor="descriptionInput">
        What needs doing
      </label>
      <Textarea
        id="descriptionInput"
        rows={2}
        placeholder="e.g. write a 200-word product description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <label className="field-label" htmlFor="amountInput">
        Bounty amount (BOT)
      </label>
      <Input
        id="amountInput"
        type="number"
        min="0"
        step="0.0001"
        placeholder="0.05"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <label className="field-label" htmlFor="agentInput">
        Designated agent address
      </label>
      <Input
        id="agentInput"
        type="text"
        placeholder="0x…"
        value={agent}
        onChange={(e) => setAgent(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="workHoursInput">
            Work window (hours)
          </label>
          <Input
            id="workHoursInput"
            type="number"
            min="0.01"
            step="0.5"
            value={workHours}
            onChange={(e) => setWorkHours(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="reviewHoursInput">
            Review window (hours)
          </label>
          <Input
            id="reviewHoursInput"
            type="number"
            min="0.01"
            step="0.5"
            value={reviewHours}
            onChange={(e) => setReviewHours(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
        The work deadline starts when this agent accepts. If you do not review submitted work in time, anyone can
        finalize payment to the agent.
      </p>
      <div className="mt-3.5">
        <LiquidButton disabled={disabled} onClick={handleCreate}>
          Create Bounty
        </LiquidButton>
      </div>
    </Panel>
  );
}
