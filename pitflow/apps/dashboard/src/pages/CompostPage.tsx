import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CompostPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [b, u] = await Promise.all([api.batches(), api.units()]);
      setRows(b);
      setUnits(u);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load batches");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const unitMap = useMemo(() => {
    const m = new Map<number, any>();
    units.forEach((u) => m.set(u.id, u));
    return m;
  }, [units]);

  const stats = useMemo(() => {
    const kg = rows.reduce((s, b) => s + Number(b.weight_kg || 0), 0);
    const untested = rows.filter((b) => !b.tested).length;
    const tested = rows.filter((b) => b.tested).length;
    return { kg: Math.round(kg * 10) / 10, untested, tested, n: rows.length };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((b) => {
      const u = unitMap.get(b.unit_id);
      return (
        String(b.id).includes(needle) ||
        String(b.unit_id).includes(needle) ||
        u?.code?.toLowerCase().includes(needle) ||
        u?.area?.toLowerCase().includes(needle) ||
        b.compliance_flag?.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, unitMap]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-bold">Compost batches</h1>
          <p className="text-sm text-muted-foreground">
            Material removed from units on care-worker visits. SAMPLE DATA.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Batches", value: stats.n },
          { label: "Total kg", value: stats.kg },
          { label: "Untested", value: stats.untested },
          { label: "Tested", value: stats.tested },
        ].map((s) => (
          <div key={s.label} className="panel px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="font-display text-3xl font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-600/30 bg-gradient-to-r from-amber-100 to-amber-50/80 px-4 py-3 text-sm text-amber-950">
        <strong>Untested compost: not for food crops.</strong> Keep this material for non-food
        landscaping until lab checks exist.
      </div>

      {error && (
        <p className="rounded-md bg-red-100/80 px-3 py-2 text-sm text-red-900" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 px-4 py-3">
            <h2 className="font-display text-xl font-semibold">
              {filtered.length} of {rows.length} batches
            </h2>
            <input
              className="h-10 w-full max-w-xs rounded-md border border-ink/15 bg-white/70 px-3 text-sm"
              placeholder="Filter by unit, area, flag…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-moss/10 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ID</th>
                  <th className="px-4 py-2.5 font-semibold">Unit</th>
                  <th className="px-4 py-2.5 font-semibold">Area</th>
                  <th className="px-4 py-2.5 font-semibold">kg</th>
                  <th className="px-4 py-2.5 font-semibold">Tested</th>
                  <th className="px-4 py-2.5 font-semibold">Flag</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const u = unitMap.get(b.unit_id);
                  return (
                    <tr key={b.id} className="border-t border-ink/10 hover:bg-white/40">
                      <td className="px-4 py-2.5 font-mono text-xs">{b.id}</td>
                      <td className="px-4 py-2.5 font-semibold">{u?.code || b.unit_id}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{u?.area || "—"}</td>
                      <td className="px-4 py-2.5">{b.weight_kg}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={b.tested ? "green" : "amber"}>
                          {b.tested ? "tested" : "untested"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{b.compliance_flag}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loading && <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>}
            {!rows.length && !loading && (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                No compost logged yet — finish a care-worker stop with a weight.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Safety rules
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="rounded-lg bg-ink/5 px-3 py-2">Worm + charcoal substrate only</li>
              <li className="rounded-lg bg-ink/5 px-3 py-2">No food-crop use until tested</li>
              <li className="rounded-lg bg-ink/5 px-3 py-2">Log kg at every emptied stop</li>
            </ul>
          </div>
          <div className="panel overflow-hidden bg-[#14241e] p-4 text-white">
            <p className="text-xs uppercase tracking-wide text-white/50">Yard note</p>
            <p className="mt-2 font-display text-xl font-semibold leading-snug">
              Compost is proof the unit was emptied — not a harvest.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
