import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { BOTCHAIN_CHAIN_ID_DEC } from "@/lib/contract";

// Route guard for /app. Deliberately reads window.ethereum directly instead
// of mounting a second useEscrow instance - avoids a duplicate
// provider/contract/event-listener set just to answer "are we allowed in".
export function RequireWallet({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "ok" | "blocked">("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!window.ethereum) {
        if (!cancelled) setStatus("blocked");
        return;
      }
      try {
        const accounts: string[] = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length === 0) {
          if (!cancelled) setStatus("blocked");
          return;
        }
        const chainIdHex: string = await window.ethereum.request({ method: "eth_chainId" });
        const onBotChain = parseInt(chainIdHex, 16) === BOTCHAIN_CHAIN_ID_DEC;
        if (!cancelled) setStatus(onBotChain ? "ok" : "blocked");
      } catch {
        if (!cancelled) setStatus("blocked");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") return null;
  if (status === "blocked") return <Navigate to="/connect" replace />;
  return <>{children}</>;
}
