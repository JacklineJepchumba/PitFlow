import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    if (w.length && workerId === "") setWorkerId(w[0].id);
  }

  useEffect(() => {
    refresh().catch((e: Error) => setError(e.message));
  }, []);

  async function suggest() {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const data = await api.suggest();
      setProposals(data.trips || []);
      setMsg(data.note || "Proposed only — not saved until you assign.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Suggest failed");
    } finally {
      setLoading(false);
    }
  }

  async function confirm(trip: any) {
    if (!workerId) {
      setError("Pick a care worker first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await api.createTrip({
        care_worker_id: Number(workerId),
        scheduled_for: new Date().toISOString().slice(0, 10),
        job_ids: trip.stops.map((s: any) => s.job_id),
      });
      setMsg(`Trip #${created.id} assigned · ${created.payment_kes} KES`);
      setProposals([]);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Assign failed");
    } finally {
      setLoading(false);
    }
  }

  async function runDemo() {
    setLoading(true);
    setError("");
    try {
      const r = await api.demo();
      setMsg(
        r.ok
          ? `Demo ran: ${r.sms_replies?.length || 0} SMS · trip ${r.assigned_trip?.trip_id ?? "none"}`
          : r.error || "Demo failed"
      );
      await refresh();
      const data = await api.suggest();
      setProposals(data.trips || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Demo failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Trips</h1>
        <p className="text-sm text-muted-foreground">
          Bundle nearby red/amber units into one care-worker round. SAMPLE rates: 300 + 100/stop KES.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={suggest} disabled={loading}>
          Suggest trips
        </Button>
        <Button variant="accent" onClick={runDemo} disabled={loading}>
          Run demo mode
        </Button>
        <label className="flex items-center gap-2 text-sm">
          Assign to
          <select
            className="h-11 rounded-md border bg-white px-3"
            value={workerId}
            onChange={(e) => setWorkerId(Number(e.target.value))}
          >
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {msg && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{msg}</p>}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-3">
        {proposals.map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Proposal {i + 1} · {p.payment_kes} KES · {p.stops.length} stops
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm">
                  {p.stops.map((s: any) => (
                    <li key={s.job_id}>
                      {s.unit_code}{" "}
                      <Badge variant={s.status as "green" | "amber" | "red"}>{s.status}</Badge>
                    </li>
                  ))}
                </ol>
                <Button onClick={() => confirm(p)} disabled={loading || !workerId}>
                  Assign & confirm
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <h2 className="font-display text-xl font-semibold">Existing trips</h2>
      <ul className="space-y-2">
        {trips.map((t) => (
          <li key={t.id} className="rounded-xl border bg-white px-4 py-3 text-sm">
            <strong>#{t.id}</strong> {t.status} · {t.care_worker_name || "unassigned"} ·{" "}
            {t.payment_kes} KES · {t.stops?.length || 0} stops · {t.scheduled_for}
          </li>
        ))}
        {!trips.length && (
          <li className="text-sm text-muted-foreground">No trips yet — suggest or run demo.</li>
        )}
      </ul>
    </div>
  );
}
