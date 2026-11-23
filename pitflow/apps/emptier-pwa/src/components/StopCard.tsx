import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

export function StopCard({
  trip,
  stop,
  onChanged,
}: {
  trip: any;
  stop: any;
  onChanged: () => Promise<void>;
}) {
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState(stop.notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setOk("");
    try {
      await fn();
      setOk(label);
      await onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const done = Boolean(stop.visited_at);

  return (
    <motion.article
      layout
      className={`rounded-2xl border p-4 shadow-sm ${
        done ? "border-leaf/40 bg-leaf/10" : "border-field/10 bg-white"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase text-leaf">Stop {stop.stop_order}</p>
          <h3 className="text-xl font-bold">{stop.unit_code || `Job ${stop.job_id}`}</h3>
          <p className="text-xs text-field/60">Trip #{trip.id}</p>
        </div>
        {done && (
          <span className="rounded-full bg-leaf px-2 py-1 text-xs font-bold text-white">
            Done
          </span>
        )}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-xl bg-chalk px-2 py-2">
          <p className="font-bold text-field">1 · Bedding</p>
          <p className="text-field/60">Taka chini</p>
        </div>
        <div className="rounded-xl bg-chalk px-2 py-2">
          <p className="font-bold text-field">2 · Pad bin</p>
          <p className="text-field/60">Ndogo</p>
        </div>
      </div>

      <label className="tap mb-2 flex items-center gap-3 rounded-xl bg-chalk px-3">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={stop.bedding_topped}
          disabled={busy || done}
          onChange={(e) =>
            run("Bedding saved", async () => {
              await api.patchStop(trip.id, stop.id, { bedding_topped: e.target.checked });
            })
          }
        />
        <span>Bedding topped · Taka chini</span>
      </label>

      <label className="tap mb-3 flex items-center gap-3 rounded-xl bg-chalk px-3">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={stop.pad_bin_emptied}
          disabled={busy || done}
          onChange={(e) =>
            run("Pad bin saved", async () => {
              await api.patchStop(trip.id, stop.id, { pad_bin_emptied: e.target.checked });
            })
          }
        />
        <span>Pad bin emptied · Ndogo</span>
      </label>

      <textarea
        className="mb-2 w-full rounded-xl border border-field/15 bg-white p-3 text-sm"
        rows={2}
        placeholder="Notes (optional)"
        value={notes}
        disabled={busy || done}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => {
          if (notes !== (stop.notes || "") && !done) {
            run("Notes saved", async () => {
              await api.patchStop(trip.id, stop.id, { notes });
            });
          }
        }}
      />

      <div className="mb-3 flex gap-2">
        <input
          className="tap w-28 rounded-xl border border-field/20 bg-white px-3"
          placeholder="kg"
          inputMode="decimal"
          value={weight}
          disabled={busy || !stop.unit_id || done}
          onChange={(e) => setWeight(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || !weight || !stop.unit_id || done}
          className="tap flex-1 rounded-xl bg-sun font-bold text-field disabled:opacity-50"
          onClick={() =>
            run("Compost logged", async () => {
              const kg = Number(weight);
              if (!kg || kg <= 0) throw new Error("Enter compost weight in kg");
              await api.batch({
                unit_id: stop.unit_id,
                trip_stop_id: stop.id,
                weight_kg: kg,
                destination: "community drying bed (SAMPLE)",
              });
              setWeight("");
            })
          }
        >
          Log compost kg
        </button>
      </div>

      {!done && (
        <button
          type="button"
          disabled={busy}
          className="tap w-full rounded-xl bg-field text-white disabled:opacity-60"
          onClick={() =>
            run("Visited", async () => {
              await api.patchStop(trip.id, stop.id, {
                mark_visited: true,
                bedding_topped: true,
                pad_bin_emptied: true,
                notes,
              });
            })
          }
        >
          Mark visited · Nimemaliza
        </button>
      )}

      <AnimatePresence>
        {(error || ok) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`mt-2 text-sm ${error ? "text-red-700" : "text-leaf"}`}
          >
            {error || ok}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
