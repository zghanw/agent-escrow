import { Suspense, lazy } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { RequireWallet } from "@/components/RequireWallet";

const Landing = lazy(() => import("@/pages/Landing"));
const WalletGate = lazy(() => import("@/pages/WalletGate"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/connect" element={<WalletGate />} />
          <Route
            path="/app"
            element={
              <RequireWallet>
                <Dashboard />
              </RequireWallet>
            }
          />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
