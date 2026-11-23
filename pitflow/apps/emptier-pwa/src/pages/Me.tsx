import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getAuth, setAuth } from "../api";

export default function Me() {
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

  const stats = useMemo(() => {
    const done = trips.filter((t) => t.status === "done" || t.status === "paid");
    const open = trips.filter((t) => t.status === "planned" || t.status === "in_progress");
    const earned = done.reduce((s, t) => s + (t.payment_kes || 0), 0);
    const pending = open.reduce((s, t) => s + (t.payment_kes || 0), 0);
    const stopsDone = trips.reduce(
      (s, t) => s + (t.stops || []).filter((x: any) => x.visited_at).length,
      0
    );
    return { done: done.length, open: open.length, earned, pending, stopsDone };
  }, [trips]);

  return (
    <div className="space-y-3 px-3 py-4">
      <div className="rounded-2xl bg-field p-4 text-white">
        <p className="text-xs font-bold uppercase text-sun">Profile · SAMPLE</p>
        <h1 className="mt-1 text-2xl font-bold">{auth?.full_name}</h1>
        <p className="text-sm text-white/70">Care worker · Pit Sidecar demo</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-field/45">Pending KES</p>
          <p className="text-2xl font-bold text-sun">{loading ? "…" : stats.pending}</p>
          <p className="text-xs text-field/55">{stats.open} open trips</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-field/45">Finished KES</p>
          <p className="text-2xl font-bold text-leaf">{loading ? "…" : stats.earned}</p>
          <p className="text-xs text-field/55">{stats.done} completed</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase text-field/45">This demo week</p>
        <ul className="mt-2 space-y-2 text-sm">
          <li className="flex justify-between rounded-xl bg-chalk px-3 py-2">
            <span>Stops marked visited</span>
            <strong>{stats.stopsDone}</strong>
          </li>
          <li className="flex justify-between rounded-xl bg-chalk px-3 py-2">
            <span>Pay rate (SAMPLE)</span>
            <strong>300 + 100/stop</strong>
          </li>
          <li className="flex justify-between rounded-xl bg-chalk px-3 py-2">
            <span>Payout channel</span>
            <strong>Admin marks paid</strong>
          </li>
        </ul>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase text-field/45">Trip history</p>
        <ul className="mt-2 divide-y divide-field/10">
          {trips.slice(0, 8).map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-bold">
                  #{t.id} · {t.status}
                </p>
                <p className="text-xs text-field/55">
                  {t.scheduled_for} · {(t.stops || []).length} stops
                </p>
              </div>
              <p className="font-bold">{t.payment_kes} KES</p>
            </li>
          ))}
          {!trips.length && !loading && (
            <li className="py-3 text-sm text-field/60">
              No trips yet — finish an assigned round to build history.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-field/10 bg-white p-4 shadow-sm">
        <p className="font-bold">Supervisor tip</p>
        <p className="mt-1 text-sm text-field/65">
          If pay looks wrong, ask admin to check Payments after you mark the last stop visited.
          Daraja M-Pesa is off in this SAMPLE build.
        </p>
      </section>

      <button
        type="button"
        className="tap w-full rounded-2xl border border-field/20 bg-white font-bold"
        onClick={() => {
          setAuth(null);
          nav("/login");
        }}
      >
        Log out
      </button>
    </div>
  );
}
