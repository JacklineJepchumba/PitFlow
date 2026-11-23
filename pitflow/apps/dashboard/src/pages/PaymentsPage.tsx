import { useEffect, useState } from "react";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

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

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Owed</p>
            <p className="font-display text-3xl font-bold text-clay">
              {owed.reduce((s, p) => s + p.amount_kes, 0)} KES
            </p>
            <p className="text-sm text-muted-foreground">{owed.length} trips</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Paid</p>
            <p className="font-display text-3xl font-bold text-moss">
              {paid.reduce((s, p) => s + p.amount_kes, 0)} KES
            </p>
            <p className="text-sm text-muted-foreground">{paid.length} trips</p>
          </CardContent>
        </Card>
      </div>

      {msg && <p className="text-sm text-moss">{msg}</p>}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <ul className="space-y-2">
        {rows.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3"
          >
            <div className="text-sm">
              <span className="font-semibold">#{p.id}</span> trip {p.trip_id} ·{" "}
              <strong>{p.amount_kes} KES</strong>{" "}
              <Badge variant={p.status === "paid" ? "green" : "amber"}>{p.status}</Badge>
              {p.reference && (
                <span className="ml-2 text-muted-foreground">{p.reference}</span>
              )}
            </div>
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
          </li>
        ))}
        {!rows.length && !loading && (
          <li className="text-sm text-muted-foreground">
            No payments yet — complete a care-worker trip first.
          </li>
        )}
      </ul>
    </div>
  );
}
