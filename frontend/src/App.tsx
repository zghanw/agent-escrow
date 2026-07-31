import { Suspense, lazy } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

const Landing = lazy(() => import("@/pages/Landing"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
