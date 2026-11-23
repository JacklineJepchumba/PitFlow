import { useEffect, useState } from "react";
import { api } from "../api";

export default function CompostPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .batches()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">Compost batches</h2>
      <div className="rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Untested compost: not for food crops
      </div>
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-sand">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Unit</th>
              <th className="p-2">kg</th>
              <th className="p-2">Tested</th>
              <th className="p-2">Flag</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-2">{b.id}</td>
                <td className="p-2">{b.unit_id}</td>
                <td className="p-2">{b.weight_kg}</td>
                <td className="p-2">{b.tested ? "yes" : "no"}</td>
                <td className="p-2">{b.compliance_flag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
