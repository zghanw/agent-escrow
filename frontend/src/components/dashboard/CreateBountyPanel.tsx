import { useState } from "react";
import { Panel } from "./Panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function CreateBountyPanel({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate: (description: string, amount: string) => Promise<void>;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const handleCreate = async () => {
    await onCreate(description, amount);
    setDescription("");
    setAmount("");
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
      <div className="mt-3.5">
        <Button disabled={disabled} onClick={handleCreate}>
          Create Bounty
        </Button>
      </div>
    </Panel>
  );
}
