import { useEffect, useState } from "react";
import { api } from "../api";

export default function TripsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [workerId, setWorkerId] = useState<number | "">("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const [w, t] = await Promise.all([api.careWorkers(), api.trips()]);
    setWorkers(w);
    setTrips(t);
    if (w[0]) setWorkerId(w[0].id);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);

  async function suggest() {
    setLoading(true);
    setError("");
    try {
      const data = await api.suggest();
      setProposals(data.trips || []);
      setMsg(data.note || "Suggested (not saved yet)");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirm(trip: any) {
    if (!workerId) return;
    setLoading(true);
    try {
      await api.createTrip({
        care_worker_id: workerId,
        scheduled_for: new Date().toISOString().slice(0, 10),
        job_ids: trip.stops.map((s: any) => s.job_id),
      });
      setMsg("Trip assigned");
      setProposals([]);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function runDemo() {
    setLoading(true);
    try {
      const r = await api.demo();
      setMsg(JSON.stringify(r));
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">Trips</h2>
      <p className="text-sm text-ink/70">Suggest routes from open jobs · SAMPLE</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={suggest} disabled={loading} className="rounded bg-moss px-3 py-2 text-white">
          Suggest trips
        </button>
        <button onClick={runDemo} disabled={loading} className="rounded border border-clay px-3 py-2 text-clay">
          Run demo mode
        </button>
        <select
          className="rounded border px-2"
          value={workerId}
          onChange={(e) => setWorkerId(Number(e.target.value))}
        >
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.full_name}
            </option>
          ))}
        </select>
      </div>
      {msg && <p className="text-sm text-moss">{msg}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {proposals.map((p, i) => (
        <div key={i} className="rounded border bg-white p-3">
          <p className="font-semibold">
            Proposal {i + 1} · {p.payment_kes} KES · {p.stops.length} stops
          </p>
          <ol className="ml-4 list-decimal text-sm">
            {p.stops.map((s: any) => (
              <li key={s.job_id}>
                {s.unit_code} ({s.status}/{s.reason})
              </li>
            ))}
          </ol>
          <button
            className="mt-2 rounded bg-clay px-3 py-1 text-white"
            onClick={() => confirm(p)}
          >
            Assign & confirm
          </button>
        </div>
      ))}
      <h3 className="font-semibold">Existing trips</h3>
      <ul className="space-y-2 text-sm">
        {trips.map((t) => (
          <li key={t.id} className="rounded border bg-white p-2">
            #{t.id} {t.status} · {t.care_worker_name} · {t.payment_kes} KES ·{" "}
            {t.stops?.length || 0} stops
          </li>
        ))}
      </ul>
    </div>
  );
}
