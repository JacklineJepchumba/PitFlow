import { Link } from "react-router-dom";

const LEVELS = [
  { level: "1", label: "Low", color: "bg-leaf", note: "Green on admin map — usually skip" },
  { level: "2", label: "Medium", color: "bg-sun", note: "Amber — may join a nearby round" },
  { level: "3", label: "Full", color: "bg-red-600", note: "Red — priority empty this trip" },
];

const STEPS = [
  {
    title: "Arrive & greet",
    body: "Confirm unit code with caretaker. Note any smell or standing water.",
  },
  {
    title: "Open & assess",
    body: "Check fill level matches the SMS/USSD report before you dig.",
  },
  {
    title: "Empty + bedding",
    body: "Remove material to the compost bucket. Top charcoal/worm bedding (taka chini).",
  },
  {
    title: "Pad bin",
    body: "Empty the sealed pad bin (ndogo). Do not mix with compost stream.",
  },
  {
    title: "Log & leave",
    body: "Weigh kg in the app, add a short note, mark visited. Next stop.",
  },
];

export default function Guide() {
  return (
    <div className="space-y-3 px-3 py-4">
      <div>
        <h1 className="text-2xl font-bold">Yard guide</h1>
        <p className="text-sm text-field/65">
          Always-on cheat sheet — works offline in your head even when signal drops.
        </p>
      </div>

      <section className="rounded-2xl bg-field p-4 text-white">
        <p className="text-xs font-bold uppercase text-sun">Safety first</p>
        <ul className="mt-2 space-y-1 text-sm text-white/85">
          <li>· Gloves and closed shoes every stop</li>
          <li>· Untested compost is not for food crops</li>
          <li>· Wash hands before you eat or touch phone face</li>
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase text-field/45">Fill levels (caretaker SMS)</p>
        <div className="mt-3 space-y-2">
          {LEVELS.map((l) => (
            <div key={l.level} className="flex items-start gap-3 rounded-xl bg-chalk px-3 py-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${l.color}`}
              >
                {l.level}
              </span>
              <div>
                <p className="font-bold">{l.label}</p>
                <p className="text-sm text-field/65">{l.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase text-field/45">Stop routine</p>
        <ol className="mt-3 space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leaf text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-bold">{s.title}</p>
                <p className="text-sm text-field/65">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-sun/40 bg-sun/15 p-4">
        <p className="font-bold">Compost rule (SAMPLE)</p>
        <p className="mt-1 text-sm text-field/75">
          Log every kg you remove. Destination stays “community drying bed” until lab tests exist.
          Admin Compost page shows untested flags.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase text-field/45">Swahili micro-hints</p>
        <dl className="mt-2 space-y-2 text-sm">
          {[
            ["Taka chini", "Top the bedding"],
            ["Ndogo", "Pad bin"],
            ["Nimemaliza", "I’m done / mark visited"],
            ["Hakuna trip", "No round assigned yet"],
          ].map(([sw, en]) => (
            <div
              key={sw}
              className="flex items-center justify-between rounded-xl bg-chalk px-3 py-2"
            >
              <dt className="font-bold">{sw}</dt>
              <dd className="text-field/60">{en}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Link
        to="/stops"
        className="tap flex items-center justify-center rounded-2xl bg-field font-bold text-white"
      >
        Go to stops checklist →
      </Link>
    </div>
  );
}
