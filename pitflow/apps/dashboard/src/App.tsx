import { useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { getAuth, setAuth } from "./api";
import { Button } from "@/components/ui/button";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import MapPage from "./pages/MapPage";
import TripsPage from "./pages/TripsPage";
import CompostPage from "./pages/CompostPage";
import PaymentsPage from "./pages/PaymentsPage";
import SimulatorPage from "./pages/SimulatorPage";

const nav = [
  { to: "/app/map", label: "Map", hint: "Unit colours" },
  { to: "/app/trips", label: "Trips", hint: "Dispatch rounds" },
  { to: "/app/compost", label: "Compost", hint: "Batch ledger" },
  { to: "/app/payments", label: "Payments", hint: "Care worker pay" },
  { to: "/app/simulator", label: "Simulator", hint: "Feature phone" },
];

function Shell({ children }: { children: React.ReactNode }) {
  const auth = getAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  if (!auth || auth.role !== "admin") return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-[#e6dfd2]">
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-ink/10 bg-[#1a2e26] px-4 text-white md:hidden">
        <button
          type="button"
          className="rounded-md px-2 py-1 text-sm font-semibold"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? "Close" : "Menu"}
        </button>
        <Link to="/" className="font-display text-lg font-bold">
          PitFlow
        </Link>
        <span className="text-[10px] uppercase tracking-wide text-white/50">SAMPLE</span>
      </div>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[15.5rem] flex-col border-r border-white/10 bg-[#14241e] text-white transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-[#d8efe4]">
            PitFlow
          </Link>
          <p className="mt-1 text-xs text-white/45">Admin · SAMPLE demo</p>
          <p className="mt-3 truncate rounded-md bg-white/5 px-2 py-1.5 text-xs text-white/70">
            {auth.full_name}
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 transition ${
                  isActive
                    ? "bg-[#1f5c45] text-white shadow-sm"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="block text-[11px] opacity-60">{item.hint}</span>
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 px-4 py-4">
          <p className="text-[11px] leading-relaxed text-white/40">
            Nairobi informal-settlement SAMPLE. Readings and pay are not field truth.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={() => {
              setAuth(null);
              navigate("/login");
            }}
          >
            Log out
          </Button>
        </div>
      </aside>

      <main className="min-h-screen flex-1 pt-14 md:pt-0">
        <div className="admin-canvas min-h-screen px-4 py-5 md:px-7 md:py-6">{children}</div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app/map" element={<Shell><MapPage /></Shell>} />
      <Route path="/app/trips" element={<Shell><TripsPage /></Shell>} />
      <Route path="/app/compost" element={<Shell><CompostPage /></Shell>} />
      <Route path="/app/payments" element={<Shell><PaymentsPage /></Shell>} />
      <Route path="/app/simulator" element={<Shell><SimulatorPage /></Shell>} />
      <Route path="/app" element={<Navigate to="/app/map" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
