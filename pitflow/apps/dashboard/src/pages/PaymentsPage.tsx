import { useEffect, useState } from "react";
import { api } from "../api";

export default function PaymentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setRows(await api.payments());
  }

  useEffect(() => {
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-bold">Payments</h2>
        <button
          className="rounded border px-3 py-1 text-sm"
          onClick={() => api.downloadPayments().catch((e) => setError(e.message))}
        >
          Export CSV
        </button>
      </div>
      <p className="text-sm text-ink/70">Owed vs paid · SAMPLE · Daraja payouts off</p>
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-700">{error}</p>}
      <ul className="space-y-2">
        {rows.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded border bg-white p-3 text-sm">
            <span>
              #{p.id} trip {p.trip_id} · {p.amount_kes} KES · <strong>{p.status}</strong>
            </span>
            {p.status === "owed" && (
              <button
                className="rounded bg-moss px-3 py-1 text-white"
                onClick={async () => {
                  await api.markPaid(p.id);
                  await refresh();
                }}
              >
                Mark paid
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
