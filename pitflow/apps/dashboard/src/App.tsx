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
  { to: "/app/map", label: "Map" },
  { to: "/app/trips", label: "Trips" },
  { to: "/app/compost", label: "Compost" },
  { to: "/app/payments", label: "Payments" },
  { to: "/app/simulator", label: "Simulator" },
];

function Shell({ children }: { children: React.ReactNode }) {
  const auth = getAuth();
  const navigate = useNavigate();
  if (!auth || auth.role !== "admin") return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-display text-xl font-bold text-moss">
            PitFlow
            <span className="ml-2 text-xs font-sans font-medium text-muted-foreground">
              Admin · SAMPLE
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-semibold ${
                    isActive ? "bg-secondary text-ink" : "text-muted-foreground hover:bg-secondary/70"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAuth(null);
                navigate("/login");
              }}
            >
              Log out
            </Button>
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
