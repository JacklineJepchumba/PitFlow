import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { StopCard } from "../components/StopCard";

export default function Stops() {
  const [trips, setTrips] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");

  const refresh = useCallback(async () => {
    setTrips(await api.trips());
  }, []);

  useEffect(() => {
    refresh()
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  const active = useMemo(
    () => trips.filter((t) => ["planned", "in_progress", "done"].includes(t.status)),
    [trips]
  );

  const cards = useMemo(() => {
    const rows: { trip: any; stop: any }[] = [];
    active.forEach((trip) => {
      [...(trip.stops || [])]
        .sort((a: any, b: any) => a.stop_order - b.stop_order)
        .forEach((stop: any) => rows.push({ trip, stop }));
    });
    if (filter === "open") return rows.filter((r) => !r.stop.visited_at);
    if (filter === "done") return rows.filter((r) => r.stop.visited_at);
    return rows;
  }, [active, filter]);

  return (
    <div className="space-y-3 px-3 py-4">
      <div>
        <h1 className="text-2xl font-bold">Stops</h1>
        <p className="text-sm text-field/65">
          Work top to bottom. Tick bedding + pad bin, log kg, then mark visited.
        </p>
      </div>

      <div className="flex gap-2">
        {(["open", "done", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-xl px-3 py-2 text-xs font-bold capitalize ${
              filter === f ? "bg-field text-white" : "bg-white text-field/60 shadow-sm"
            }`}
          >
            {f}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto rounded-xl bg-white px-3 py-2 text-xs font-bold shadow-sm"
          onClick={() => {
            setLoading(true);
            refresh()
              .catch((e: Error) => setError(e.message))
              .finally(() => setLoading(false));
          }}
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-field/60">Loading stops…</p>}
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {!loading && !cards.length && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-bold">No stops in this filter</h2>
            <p className="mt-1 text-sm text-field/65">
              When admin assigns a trip, each unit shows here as a big checklist card.
            </p>
            <Link
              to="/guide"
              className="tap mt-3 flex items-center justify-center rounded-xl bg-field text-white"
            >
              Review yard guide
            </Link>
          </div>
          <div className="rounded-2xl border border-dashed border-field/20 bg-white/70 p-4">
            <p className="text-xs font-bold uppercase text-field/45">What a stop includes</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-field/70">
              <li>Arrive at unit code on the map lane</li>
              <li>Top charcoal/worm bedding</li>
              <li>Empty menstrual pad bin safely</li>
              <li>Weigh compost into drying bed</li>
              <li>Mark visited — unlocks pay on admin</li>
            </ol>
          </div>
        </div>
      )}

      {cards.map(({ trip, stop }) => (
        <StopCard key={stop.id} trip={trip} stop={stop} onChanged={refresh} />
      ))}
    </div>
  );
}
