import { FormEvent, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api, getAuth, setAuth } from "./api";

function Login() {
  const [phone, setPhone] = useState("+254700000002");
  const [password, setPassword] = useState("care123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const auth = await api.login(phone, password);
      if (auth.role !== "care_worker") throw new Error("Care worker login only");
      setAuth(auth);
      nav("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-gradient-to-b from-leaf/20 to-chalk px-4">
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-field">Care worker</h1>
        <p className="text-xs text-field/60">PitFlow · SAMPLE DATA only</p>
        <input
          className="w-full rounded border px-3 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="password"
          className="w-full rounded border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full rounded bg-field py-2 text-white">
          {loading ? "…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function Today() {
  const auth = getAuth();
  const nav = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState<Record<number, string>>({});

  async function refresh() {
    setTrips(await api.trips());
  }

  useEffect(() => {
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!auth) return <Navigate to="/login" replace />;

  const today = new Date().toISOString().slice(0, 10);
  const active = trips.filter(
    (t) =>
      t.scheduled_for === today ||
      ["planned", "in_progress"].includes(t.status)
  );

  return (
    <div className="mx-auto min-h-screen max-w-md bg-chalk px-3 pb-10 pt-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-leaf">Care worker</p>
          <h1 className="text-xl font-bold">{auth.full_name}</h1>
        </div>
        <button
          className="text-sm text-field/60"
          onClick={() => {
            setAuth(null);
            nav("/login");
          }}
        >
          Log out
        </button>
      </header>
      <p className="mb-3 text-xs text-field/50">Low-data checklist · SAMPLE</p>
      {loading && <p>Loading trips…</p>}
      {error && <p className="text-red-700">{error}</p>}
      {!active.length && !loading && (
        <p className="rounded-xl bg-white p-4 text-sm">No open trips assigned.</p>
      )}
      {active.map((trip) => (
        <section key={trip.id} className="mb-4 space-y-2 rounded-xl bg-white p-3 shadow-sm">
          <h2 className="font-semibold">
            Trip #{trip.id} · {trip.status} · {trip.payment_kes} KES
          </h2>
          {trip.stops
            ?.slice()
            .sort((a: any, b: any) => a.stop_order - b.stop_order)
            .map((stop: any) => (
              <div key={stop.id} className="rounded-lg border border-field/10 p-3 text-sm">
                <p className="font-semibold">
                  {stop.stop_order}. {stop.unit_code || `job ${stop.job_id}`}
                  {stop.visited_at ? " ✓" : ""}
                </p>
                <label className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={stop.bedding_topped}
                    onChange={async (e) => {
                      await api.patchStop(trip.id, stop.id, {
                        bedding_topped: e.target.checked,
                      });
                      await refresh();
                    }}
                  />
                  Bedding topped
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={stop.pad_bin_emptied}
                    onChange={async (e) => {
                      await api.patchStop(trip.id, stop.id, {
                        pad_bin_emptied: e.target.checked,
                      });
                      await refresh();
                    }}
                  />
                  Pad bin emptied
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    className="w-24 rounded border px-2 py-1"
                    placeholder="kg"
                    value={weights[stop.id] || ""}
                    onChange={(e) =>
                      setWeights((w) => ({ ...w, [stop.id]: e.target.value }))
                    }
                  />
                  <button
                    className="rounded bg-leaf px-2 py-1 text-white"
                    onClick={async () => {
                      const kg = Number(weights[stop.id]);
                      if (!kg || !stop.unit_id) return;
                      await api.batch({
                        unit_id: stop.unit_id,
                        trip_stop_id: stop.id,
                        weight_kg: kg,
                      });
                      await refresh();
                    }}
                  >
                    Log compost
                  </button>
                </div>
                {!stop.visited_at && (
                  <button
                    className="mt-2 w-full rounded bg-field py-2 text-white"
                    onClick={async () => {
                      await api.patchStop(trip.id, stop.id, {
                        mark_visited: true,
                        bedding_topped: true,
                        pad_bin_emptied: true,
                      });
                      await refresh();
                    }}
                  >
                    Mark visited
                  </button>
                )}
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Today />} />
    </Routes>
  );
}
