import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Today() {
  const [trips, setTrips] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  const openTrip = active.find((t) => t.status !== "done") || active[0];
  const allStops = active.flatMap((t) =>
    (t.stops || []).map((s: any) => ({ ...s, tripId: t.id, pay: t.payment_kes }))
  );
  const doneStops = allStops.filter((s) => s.visited_at).length;
  const leftStops = allStops.filter((s) => !s.visited_at).length;
  const earnOpen = active
    .filter((t) => t.status !== "paid")
    .reduce((s, t) => s + (t.payment_kes || 0), 0);

  return (
    <div>
      <div className="relative h-40 overflow-hidden">
        <img
          src="/images/hero-care-worker.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-field via-field/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-sun">Leo · Today</p>
          <h1 className="text-2xl font-bold">Your yard round</h1>
          <p className="text-xs text-white/75">SAMPLE DATA · low data mode</p>
        </div>
      </div>

      <div className="space-y-3 px-3 pt-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Stops left", value: leftStops },
            { label: "Done", value: doneStops },
            { label: "KES", value: earnOpen },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white px-2 py-3 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase text-field/50">{s.label}</p>
              <p className="text-xl font-bold text-field">{loading ? "…" : s.value}</p>
            </div>
          ))}
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}

        {openTrip ? (
          <section className="rounded-2xl bg-field p-4 text-white shadow-sm">
            <p className="text-xs uppercase tracking-wide text-white/60">
              Active trip · #{openTrip.id} · {openTrip.status}
            </p>
            <p className="mt-1 text-lg font-bold">
              {openTrip.payment_kes} KES · {(openTrip.stops || []).length} stops
            </p>
            <p className="mt-1 text-sm text-white/70">
              Scheduled {openTrip.scheduled_for || "today"}
            </p>
            <Link
              to="/stops"
              className="tap mt-3 flex items-center justify-center rounded-xl bg-sun font-bold text-field"
            >
              Open checklist →
            </Link>
          </section>
        ) : (
          <section className="space-y-3">
            <div className="rounded-2xl border border-dashed border-field/25 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-leaf">Waiting on supervisor</p>
              <h2 className="mt-1 text-lg font-bold">Hakuna trip bado</h2>
              <p className="mt-1 text-sm text-field/70">
                Admin assigns a round from <strong>Trips → Suggest</strong>. Meanwhile use Guide
                for the yard checklist.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/guide"
                  className="tap flex-1 rounded-xl bg-field text-center text-sm text-white"
                >
                  Open guide
                </Link>
                <button
                  type="button"
                  className="tap flex-1 rounded-xl border border-field/20 bg-chalk text-sm"
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
            </div>

            <div className="rounded-2xl bg-white p-4 opacity-80 shadow-sm">
              <p className="text-xs font-bold uppercase text-field/45">Preview · SAMPLE stop</p>
              <h3 className="mt-1 text-lg font-bold">U0xx · when assigned</h3>
              <ul className="mt-3 space-y-2 text-sm text-field/70">
                <li className="rounded-xl bg-chalk px-3 py-2">☐ Bedding topped</li>
                <li className="rounded-xl bg-chalk px-3 py-2">☐ Pad bin emptied</li>
                <li className="rounded-xl bg-chalk px-3 py-2">☐ Compost kg logged</li>
                <li className="rounded-xl bg-chalk px-3 py-2">☐ Mark visited</li>
              </ul>
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-field/45">Before you roll</p>
          <ul className="mt-2 space-y-2 text-sm">
            {[
              "Gloves + boots on",
              "Empty pad bin bag ready",
              "Compost bucket for drying bed",
              "Phone charged for checklist",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-xl bg-chalk px-3 py-2.5 font-semibold"
              >
                <span className="text-leaf">✓</span> {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <Link to="/stops" className="rounded-2xl bg-leaf/15 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-leaf">Next</p>
            <p className="font-bold">Stops checklist</p>
          </Link>
          <Link to="/me" className="rounded-2xl bg-sun/25 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-field/60">Pay</p>
            <p className="font-bold">My earnings</p>
          </Link>
        </section>

        <p className="pb-2 text-center text-xs text-field/45">
          After red SMS on admin simulator → Trips assign → checklist appears here.
        </p>
      </div>
    </div>
  );
}
