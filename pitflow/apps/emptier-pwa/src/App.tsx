import { FormEvent, useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
    setError("");
    try {
      const auth = await api.login(phone.trim(), password);
      if (auth.role !== "care_worker") {
        throw new Error("Care worker login only — admins use the dashboard.");
      }
      setAuth(auth);
      nav("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-end overflow-hidden">
      <img
        src="/images/hero-care-worker.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-field via-field/80 to-field/30" />
      <motion.form
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="relative m-4 mb-8 space-y-3 rounded-2xl bg-chalk p-5 shadow-lg"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-leaf">Care worker</p>
        <h1 className="text-2xl font-bold text-field">Karibu · Sign in</h1>
        <p className="text-sm text-field/70">
          Big buttons for the yard. Low data. SAMPLE login filled in.
        </p>
        <input
          className="tap w-full rounded-xl border border-field/20 bg-white px-3"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="username"
        />
        <input
          type="password"
          className="tap w-full rounded-xl border border-field/20 bg-white px-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="tap w-full rounded-xl bg-field text-white disabled:opacity-60"
        >
          {loading ? "…" : "Start today’s round"}
        </button>
      </motion.form>
    </div>
  );
}

function StopCard({
  trip,
  stop,
  onChanged,
}: {
  trip: any;
  stop: any;
  onChanged: () => Promise<void>;
}) {
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState(stop.notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setOk("");
    try {
      await fn();
      setOk(label);
      await onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const done = Boolean(stop.visited_at);

  return (
    <motion.article
      layout
      className={`rounded-2xl border p-4 shadow-sm ${
        done ? "border-leaf/40 bg-leaf/10" : "border-field/10 bg-white"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase text-leaf">Stop {stop.stop_order}</p>
          <h3 className="text-xl font-bold">{stop.unit_code || `Job ${stop.job_id}`}</h3>
        </div>
        {done && <span className="rounded-full bg-leaf px-2 py-1 text-xs font-bold text-white">Done</span>}
      </div>

      <label className="tap mb-2 flex items-center gap-3 rounded-xl bg-chalk px-3">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={stop.bedding_topped}
          disabled={busy || done}
          onChange={(e) =>
            run("Bedding saved", async () => {
              await api.patchStop(trip.id, stop.id, { bedding_topped: e.target.checked });
            })
          }
        />
        <span>Bedding topped · Taka chini</span>
      </label>

      <label className="tap mb-3 flex items-center gap-3 rounded-xl bg-chalk px-3">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={stop.pad_bin_emptied}
          disabled={busy || done}
          onChange={(e) =>
            run("Pad bin saved", async () => {
              await api.patchStop(trip.id, stop.id, { pad_bin_emptied: e.target.checked });
            })
          }
        />
        <span>Pad bin emptied · Ndogo</span>
      </label>

      <textarea
        className="mb-2 w-full rounded-xl border border-field/15 bg-white p-3 text-sm"
        rows={2}
        placeholder="Notes (optional)"
        value={notes}
        disabled={busy || done}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => {
          if (notes !== (stop.notes || "") && !done) {
            run("Notes saved", async () => {
              await api.patchStop(trip.id, stop.id, { notes });
            });
          }
        }}
      />

      <div className="mb-3 flex gap-2">
        <input
          className="tap w-28 rounded-xl border border-field/20 bg-white px-3"
          placeholder="kg"
          inputMode="decimal"
          value={weight}
          disabled={busy || !stop.unit_id}
          onChange={(e) => setWeight(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || !weight || !stop.unit_id}
          className="tap flex-1 rounded-xl bg-sun font-bold text-field disabled:opacity-50"
          onClick={() =>
            run("Compost logged", async () => {
              const kg = Number(weight);
              if (!kg || kg <= 0) throw new Error("Enter compost weight in kg");
              await api.batch({
                unit_id: stop.unit_id,
                trip_stop_id: stop.id,
                weight_kg: kg,
                destination: "community drying bed (SAMPLE)",
              });
              setWeight("");
            })
          }
        >
          Log compost kg
        </button>
      </div>

      {!done && (
        <button
          type="button"
          disabled={busy}
          className="tap w-full rounded-xl bg-field text-white disabled:opacity-60"
          onClick={() =>
            run("Visited", async () => {
              await api.patchStop(trip.id, stop.id, {
                mark_visited: true,
                bedding_topped: true,
                pad_bin_emptied: true,
                notes,
              });
            })
          }
        >
          Mark visited · Nimemaliza
        </button>
      )}

      <AnimatePresence>
        {(error || ok) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`mt-2 text-sm ${error ? "text-red-700" : "text-leaf"}`}
          >
            {error || ok}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function Today() {
  const auth = getAuth();
  const nav = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setTrips(await api.trips());
  }, []);

  useEffect(() => {
    refresh()
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  if (!auth) return <Navigate to="/login" replace />;

  const active = trips.filter((t) =>
    ["planned", "in_progress", "done"].includes(t.status)
  );

  return (
    <div className="mx-auto min-h-screen max-w-md pb-16">
      <div className="relative h-36 overflow-hidden">
        <img src="/images/hero-care-worker.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-field/55" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-sun">Care worker</p>
            <h1 className="text-xl font-bold">{auth.full_name}</h1>
            <p className="text-xs text-white/80">SAMPLE DATA · low data mode</p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-white/15 px-3 py-2 text-sm backdrop-blur"
            onClick={() => {
              setAuth(null);
              nav("/login");
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <div className="space-y-3 px-3 pt-4">
        {loading && <p>Loading your trips…</p>}
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {!loading && !active.length && (
          <p className="rounded-2xl bg-white p-4 text-sm shadow-sm">
            Hakuna trip bado. Ask your supervisor to assign one from the admin Trips page.
          </p>
        )}
        {active.map((trip) => {
          const stops = [...(trip.stops || [])].sort(
            (a: any, b: any) => a.stop_order - b.stop_order
          );
          const left = stops.filter((s: any) => !s.visited_at).length;
          return (
            <section key={trip.id} className="space-y-3">
              <div className="rounded-2xl bg-field px-4 py-3 text-white">
                <p className="text-sm opacity-80">Trip #{trip.id} · {trip.status}</p>
                <p className="text-lg font-bold">
                  {trip.payment_kes} KES · {left} stop{left === 1 ? "" : "s"} left
                </p>
                {trip.status === "done" && (
                  <p className="text-sm text-sun">Round complete — payment owed on admin side.</p>
                )}
              </div>
              {stops.map((stop: any) => (
                <StopCard key={stop.id} trip={trip} stop={stop} onChanged={refresh} />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Today />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
