import type { LogState } from "@/hooks/useEscrow";

export function TxLog({ log, explorerBase }: { log: LogState; explorerBase: string }) {
  return (
    <div className={`log-line ${log.kind}`}>
      {log.message}
      {log.txHash && (
        <>
          {" "}
          <a href={`${explorerBase}/tx/${log.txHash}`} target="_blank" rel="noopener">
            View transaction ↗
          </a>
        </>
      )}
    </div>
  );
}
