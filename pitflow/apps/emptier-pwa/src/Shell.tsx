import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { getAuth, setAuth } from "./api";

const tabs = [
  { to: "/", label: "Today", end: true },
  { to: "/stops", label: "Stops" },
  { to: "/guide", label: "Guide" },
  { to: "/me", label: "Me" },
];

export default function Shell() {
  const auth = getAuth();
  const nav = useNavigate();
  if (!auth || auth.role !== "care_worker") return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-chalk">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-field/10 bg-field px-4 py-3 text-white">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-sun">Care worker</p>
          <p className="text-sm font-bold leading-tight">{auth.full_name}</p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold"
          onClick={() => {
            setAuth(null);
            nav("/login");
          }}
        >
          Log out
        </button>
      </header>

      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-field/10 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `rounded-xl px-1 py-2 text-center text-xs font-bold transition ${
                  isActive ? "bg-field text-white" : "text-field/55 hover:bg-field/5"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
