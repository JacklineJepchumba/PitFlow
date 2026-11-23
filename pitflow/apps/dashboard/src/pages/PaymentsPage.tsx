import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PaymentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [tab, setTab] = useState<"all" | "owed" | "paid">("all");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setRows(await api.payments());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const owed = rows.filter((p) => p.status === "owed");
  const paid = rows.filter((p) => p.status === "paid");
  const owedSum = owed.reduce((s, p) => s + p.amount_kes, 0);
  const paidSum = paid.reduce((s, p) => s + p.amount_kes, 0);

  const visible = useMemo(() => {
    if (tab === "owed") return owed;
    if (tab === "paid") return paid;
    return rows;
  }, [tab, rows, owed, paid]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Pay care workers for finished trips. Daraja sandbox stays off by default.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="accent"
            onClick={async () => {
              try {
                await api.downloadPayments();
                setMsg("CSV downloaded");
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Export failed");
              }
            }}
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Owed
          </p>
          <p className="font-display text-3xl font-bold text-clay">{owedSum} KES</p>
          <p className="text-sm text-muted-foreground">{owed.length} trips waiting</p>
        </div>
        <div className="panel px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Paid
          </p>
          <p className="font-display text-3xl font-bold text-moss">{paidSum} KES</p>
          <p className="text-sm text-muted-foreground">{paid.length} settled</p>
        </div>
        <div className="panel overflow-hidden bg-[#14241e] px-4 py-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
            Channel
          </p>
          <p className="font-display text-2xl font-bold">Manual SAMPLE</p>
          <p className="mt-1 text-sm text-white/60">M-Pesa Daraja flagged off</p>
        </div>
      </div>

      {msg && <p className="text-sm font-medium text-moss">{msg}</p>}
      {error && (
        <p className="rounded-md bg-red-100/80 px-3 py-2 text-sm text-red-900" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 px-4 py-3">
            {(["all", "owed", "paid"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize ${
                  tab === t ? "bg-moss text-white" : "bg-ink/5 text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              {visible.length} rows · {loading ? "loading…" : "live"}
            </span>
          </div>
          <ul className="divide-y divide-ink/10">
            {visible.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">#{p.id}</span>
                    <span className="text-muted-foreground">trip {p.trip_id}</span>
                    <Badge variant={p.status === "paid" ? "green" : "amber"}>{p.status}</Badge>
                  </div>
                  {p.reference && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{p.reference}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-display text-xl font-bold">{p.amount_kes} KES</p>
                  {p.status === "owed" && (
                    <Button
                      size="sm"
                      disabled={busyId === p.id}
                      onClick={async () => {
                        setBusyId(p.id);
                        setError("");
                        try {
                          await api.markPaid(p.id);
                          setMsg(`Payment #${p.id} marked paid (SAMPLE)`);
                          await refresh();
                        } catch (e: unknown) {
                          setError(e instanceof Error ? e.message : "Mark paid failed");
                        } finally {
                          setBusyId(null);
                        }
                      }}
                    >
                      {busyId === p.id ? "Saving…" : "Mark paid"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
            {!visible.length && !loading && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                No payments in this filter — complete a care-worker trip first.
              </li>
            )}
          </ul>
        </div>

        <aside className="space-y-3">
          <div className="panel p-4 text-sm leading-relaxed">
            <p className="font-semibold text-ink">How pay is earned</p>
            <ul className="mt-2 space-y-2 text-muted-foreground">
              <li className="rounded-lg bg-ink/5 px-3 py-2">Base 300 KES per trip</li>
              <li className="rounded-lg bg-ink/5 px-3 py-2">+100 KES per stop</li>
              <li className="rounded-lg bg-ink/5 px-3 py-2">Owed when trip completes</li>
            </ul>
          </div>
          <div className="panel border-clay/30 bg-clay/10 p-4 text-sm text-ink">
            Export CSV for offline reconciliation. Live Daraja payouts are intentionally disabled
            in this prototype.
          </div>
        </aside>
      </div>
    </div>
  );
}
