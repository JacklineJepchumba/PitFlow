import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { getAuth, setAuth } from "./api";
import Login from "./pages/Login";
import MapPage from "./pages/MapPage";
import TripsPage from "./pages/TripsPage";
import CompostPage from "./pages/CompostPage";
import PaymentsPage from "./pages/PaymentsPage";
import SimulatorPage from "./pages/SimulatorPage";

function Shell({ children }: { children: React.ReactNode }) {
  const auth = getAuth();
  const nav = useNavigate();
  if (!auth) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-gradient-to-b from-sand via-white to-sand">
      <header className="border-b border-moss/20 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-display text-xl font-bold text-moss">PitFlow</p>
            <p className="text-xs text-ink/60">Admin · SAMPLE DATA only</p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link to="/">Map</Link>
            <Link to="/trips">Trips</Link>
            <Link to="/compost">Compost</Link>
            <Link to="/payments">Payments</Link>
            <Link to="/simulator">Simulator</Link>
            <button
              className="text-clay"
              onClick={() => {
                setAuth(null);
                nav("/login");
              }}
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Shell><MapPage /></Shell>} />
      <Route path="/trips" element={<Shell><TripsPage /></Shell>} />
      <Route path="/compost" element={<Shell><CompostPage /></Shell>} />
      <Route path="/payments" element={<Shell><PaymentsPage /></Shell>} />
      <Route path="/simulator" element={<Shell><SimulatorPage /></Shell>} />
    </Routes>
  );
}
