import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api";
import { Button } from "@/components/ui/button";
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

  const stats = useMemo(() => {
    const planned = trips.filter((t) => t.status === "planned" || t.status === "assigned").length;
    const done = trips.filter((t) => t.status === "completed" || t.status === "done").length;
    const pay = trips.reduce((s, t) => s + (t.payment_kes || 0), 0);
    return { planned, done, pay, total: trips.length };
  }, [trips]);

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Trips</h1>
          <p className="text-sm text-muted-foreground">
            Bundle nearby red/amber units into one care-worker round. SAMPLE rates: 300 + 100/stop
            KES.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={suggest} disabled={loading}>
            Suggest trips
          </Button>
          <Button variant="accent" onClick={runDemo} disabled={loading}>
            Run demo mode
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Trips logged", value: stats.total },
          { label: "Open / assigned", value: stats.planned },
          { label: "Completed", value: stats.done },
          { label: "Pay booked", value: `${stats.pay} KES` },
        ].map((s) => (
          <div key={s.label} className="panel px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="font-display text-2xl font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <div className="panel flex flex-wrap items-center gap-3 px-4 py-3">
            <label className="flex flex-1 flex-wrap items-center gap-2 text-sm font-semibold">
              Assign proposals to
              <select
                className="h-11 min-w-[12rem] flex-1 rounded-md border border-ink/15 bg-white/80 px-3"
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
            <p className="text-xs text-muted-foreground">
              Worker sees the trip in the care app checklist.
            </p>
          </div>

          {msg && (
            <p className="rounded-md bg-emerald-100/80 px-3 py-2 text-sm text-emerald-950">{msg}</p>
          )}
          {error && (
            <p className="rounded-md bg-red-100/80 px-3 py-2 text-sm text-red-900" role="alert">
              {error}
            </p>
          )}

          <div className="grid gap-3">
            {!proposals.length && (
              <div className="panel px-5 py-8 text-center">
                <p className="font-display text-xl font-semibold text-ink">No proposals yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tap Suggest after caretakers mark units red/amber (or Run demo mode).
                </p>
              </div>
            )}
            {proposals.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl font-semibold">
                      Proposal {i + 1}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {p.stops.length} stops · {p.payment_kes} KES SAMPLE
                    </p>
                  </div>
                  <Button onClick={() => confirm(p)} disabled={loading || !workerId}>
                    Assign & confirm
                  </Button>
                </div>
                <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                  {p.stops.map((s: any, idx: number) => (
                    <li
                      key={s.job_id}
                      className="flex items-center justify-between rounded-lg bg-moss/10 px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="mr-2 text-xs text-muted-foreground">{idx + 1}.</span>
                        {s.unit_code}
                      </span>
                      <Badge variant={s.status as "green" | "amber" | "red"}>{s.status}</Badge>
                    </li>
                  ))}
                </ol>
              </motion.div>
            ))}
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-ink/10 px-4 py-3">
              <h2 className="font-display text-xl font-semibold">Existing trips</h2>
            </div>
            <ul className="divide-y divide-ink/10">
              {trips.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div>
                    <span className="font-semibold">#{t.id}</span>{" "}
                    <Badge variant="secondary">{t.status}</Badge>
                    <p className="mt-1 text-muted-foreground">
                      {t.care_worker_name || "unassigned"} · {t.stops?.length || 0} stops ·{" "}
                      {t.scheduled_for}
                    </p>
                  </div>
                  <p className="font-display text-lg font-bold text-clay">{t.payment_kes} KES</p>
                </li>
              ))}
              {!trips.length && (
                <li className="px-4 py-6 text-sm text-muted-foreground">
                  No trips yet — suggest or run demo.
                </li>
              )}
            </ul>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Care workers
            </p>
            <ul className="mt-3 space-y-2">
              {workers.map((w) => (
                <li
                  key={w.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    workerId === w.id ? "bg-moss text-white" : "bg-ink/5"
                  }`}
                >
                  <p className="font-semibold">{w.full_name}</p>
                  <p className={`text-xs ${workerId === w.id ? "text-white/70" : "text-muted-foreground"}`}>
                    {w.phone || "SAMPLE worker"}
                  </p>
                </li>
              ))}
              {!workers.length && (
                <li className="text-sm text-muted-foreground">Seed demo to load workers.</li>
              )}
            </ul>
          </div>
          <div className="panel bg-[#1f5c45]/10 p-4 text-sm leading-relaxed text-ink">
            <p className="font-semibold">Field flow</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
              <li>Caretaker SMS marks unit red</li>
              <li>Suggest → assign trip</li>
              <li>Care app checklist + compost kg</li>
              <li>Payments ledger updates</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
