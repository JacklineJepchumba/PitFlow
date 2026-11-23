import { useEffect, useState } from "react";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CompostPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setRows(await api.batches());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load batches");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

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

      <div className="rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong>Untested compost: not for food crops.</strong> Keep this material for
        non-food landscaping until lab checks exist.
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{rows.length} batches</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Unit</th>
                <th className="py-2 pr-3">kg</th>
                <th className="py-2 pr-3">Tested</th>
                <th className="py-2">Flag</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="py-2 pr-3">{b.id}</td>
                  <td className="py-2 pr-3">{b.unit_id}</td>
                  <td className="py-2 pr-3">{b.weight_kg}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={b.tested ? "green" : "amber"}>
                      {b.tested ? "tested" : "untested"}
                    </Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">{b.compliance_flag}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && !loading && (
            <p className="text-sm text-muted-foreground">
              No compost logged yet — finish a care-worker stop with a weight.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
