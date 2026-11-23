import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  MapPinned,
  MessageSquare,
  Users,
  Smartphone,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

type StepCta = { label: string; to?: string; href?: string };

const DAY_STEPS: {
  id: string;
  title: string;
  short: string;
  body: string;
  demo: string;
  cta: StepCta;
}[] = [
  {
    id: "sms",
    title: "1 · Caretaker reports",
    short: "SMS / USSD",
    body: "A caretaker texts unit code + fill level from a basic phone — e.g. U001 3 for full. No smartphone required.",
    demo: "U001 3 → Thanks. U001 marked level 3 (red).",
    cta: { label: "Try the phone simulator", to: "/login" },
  },
  {
    id: "map",
    title: "2 · Map turns colour",
    short: "Admin map",
    body: "The unit pin flips green → amber → red. Supervisors filter by status and open the drawer for recent readings.",
    demo: "12 SAMPLE units · Kibera, Mathare, Korogocho, Mukuru",
    cta: { label: "Open admin map", to: "/login" },
  },
  {
    id: "trip",
    title: "3 · Suggest a round",
    short: "Dispatch",
    body: "OR-Tools bundles nearby red/amber jobs into one care-worker trip. Pay is SAMPLE: 300 KES base + 100 per stop.",
    demo: "Suggest → assign to Amina → checklist appears in care app",
    cta: { label: "Admin Trips page", to: "/login" },
  },
  {
    id: "care",
    title: "4 · Empty & log",
    short: "Care worker",
    body: "In the yard: top bedding, empty pad bin, weigh compost kg, mark visited. Big taps, Swahili micro-hints, low data.",
    demo: "Today → Stops checklist → Mark visited · Nimemaliza",
    cta: {
      label: "Care worker app",
      href: import.meta.env.VITE_CARE_URL || "http://localhost:5174",
    },
  },
  {
    id: "pay",
    title: "5 · Pay the round",
    short: "Payments",
    body: "When the trip is done, owed KES shows on Payments. Mark paid (manual SAMPLE) or export CSV. Daraja stays off.",
    demo: "Owed ledger → Mark paid → CSV export",
    cta: { label: "Admin Payments", to: "/login" },
  },
];

const LEVELS = [
  {
    key: "1",
    name: "Low",
    status: "green",
    color: "bg-moss",
    ring: "ring-moss",
    meaning: "Unit healthy — usually skip this round.",
  },
  {
    key: "2",
    name: "Medium",
    status: "amber",
    color: "bg-amber-500",
    ring: "ring-amber-500",
    meaning: "Filling up — may join a nearby trip.",
  },
  {
    key: "3",
    name: "Full",
    status: "red",
    color: "bg-red-600",
    ring: "ring-red-600",
    meaning: "Priority empty — pin goes red on the map.",
  },
];

const FAQ = [
  {
    q: "Who uses which app?",
    a: "Caretakers use SMS/USSD on a feature phone. Supervisors use this admin site (map, trips, pay). Care workers use the mobile checklist PWA in the yard.",
  },
  {
    q: "Is this live field data?",
    a: "No — idea-stage pilot with SAMPLE seed data (Nairobi demo areas). Treat readings and payments as fiction for the walkthrough.",
  },
  {
    q: "What does a care worker do at a stop?",
    a: "Top worm/charcoal bedding, empty the pad bin, log compost kilograms, then mark visited. Untested compost is not for food crops.",
  },
  {
    q: "How do I run the 2-minute demo?",
    a: "Admin login → Simulator → send U001 3 → Map (red pin) → Trips Suggest & assign → Care worker app completes the stop → Payments.",
  },
];

export default function Landing() {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(2);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const active = DAY_STEPS[step];
  const activeLevel = LEVELS[level];

  return (
    <div className="min-h-screen bg-[#e6dfd2]">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#14241e]/90 px-5 py-4 backdrop-blur-md md:px-10">
        <a href="#" className="font-display text-2xl font-bold text-white">
          PitFlow
        </a>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="border-white/40 bg-white/15 text-white backdrop-blur hover:bg-white/25"
          >
            <Link to="/login">Admin</Link>
          </Button>
          <Button asChild variant="accent">
            <a
              href={import.meta.env.VITE_CARE_URL || "http://localhost:5174"}
              target="_blank"
              rel="noreferrer"
            >
              Care worker
            </a>
          </Button>
        </div>
      </header>

      {/* Hero — full viewport */}
      <section className="relative flex min-h-[calc(100svh-4.25rem)] overflow-hidden">
        <img
          src="/images/hero-care-worker.jpg"
          alt="Care worker beside a Pit Sidecar sanitation unit in a Nairobi settlement"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/45 to-ink/25" />
        <div className="relative z-10 flex w-full max-w-3xl flex-col justify-end px-5 pb-16 pt-20 md:px-10">
          <motion.p
            {...fade}
            transition={{ duration: 0.45 }}
            className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-amber-200"
          >
            Pit Sidecar · Nairobi demo
          </motion.p>
          <motion.h1
            {...fade}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="font-display text-4xl font-bold leading-tight text-white md:text-6xl"
          >
            From shared pit to cared-for unit — verified on the ground.
          </motion.h1>
          <motion.p
            {...fade}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-4 max-w-xl text-base text-white/85 md:text-lg"
          >
            Local women care workers keep worm-and-charcoal sidecars healthy. Caretakers
            report fill levels by SMS. Supervisors see the map and pay for completed trips.
          </motion.p>
          <motion.div
            {...fade}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button asChild size="lg" variant="accent">
              <Link to="/login">
                Open admin map <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/50 bg-white/10 text-white hover:bg-white/20"
            >
              <a href="#flow">How it works</a>
            </Button>
          </motion.div>
          <p className="mt-6 text-xs font-medium text-amber-100/90">
            Idea-stage pilot · SAMPLE DATA only
          </p>
        </div>
      </section>

      {/* Interactive day flow */}
      <section id="flow" className="border-y border-ink/10 bg-[#14241e] px-5 py-16 text-white md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200/80">
            Field day · tap through
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
            How PitFlow works
          </h2>
          <p className="mt-2 max-w-2xl text-white/65">
            One loop from feature-phone report to paid care visit. Select a step — the panel
            updates.
          </p>

          <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            {DAY_STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(i)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  step === i
                    ? "bg-[#e8a54b] text-ink"
                    : "bg-white/10 text-white/70 hover:bg-white/15"
                }`}
              >
                {s.short}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-col gap-2">
              {DAY_STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(i)}
                  className={`rounded-xl px-4 py-3 text-left transition ${
                    step === i
                      ? "bg-white/15 ring-1 ring-white/25"
                      : "hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{s.title}</span>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition ${
                        step === i ? "text-amber-300" : "text-white/30"
                      }`}
                    />
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-[#1f5c45]/35 p-6 ring-1 ring-white/10"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-amber-200/90">
                  Step {step + 1} of {DAY_STEPS.length}
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold">{active.title}</h3>
                <p className="mt-3 text-white/80">{active.body}</p>
                <pre className="mt-4 overflow-x-auto rounded-xl bg-ink/50 p-4 font-mono text-sm text-amber-100">
                  {active.demo}
                </pre>
                <div className="mt-5 flex flex-wrap gap-2">
                  {active.cta.to ? (
                    <Button asChild variant="accent">
                      <Link to={active.cta.to}>{active.cta.label}</Link>
                    </Button>
                  ) : (
                    <Button asChild variant="accent">
                      <a href={active.cta.href} target="_blank" rel="noreferrer">
                        {active.cta.label}
                      </a>
                    </Button>
                  )}
                  {step < DAY_STEPS.length - 1 && (
                    <Button
                      variant="outline"
                      className="border-white/30 bg-transparent text-white hover:bg-white/10"
                      onClick={() => setStep((s) => s + 1)}
                    >
                      Next step
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Levels — clay band, image-led split (photo left) */}
      <section
        id="levels"
        className="border-y border-clay/20 bg-gradient-to-br from-[#c45c26]/15 via-[#e8d5c4] to-[#d4b896] px-5 py-20 md:px-10"
      >
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2rem] shadow-lg"
          >
            <img
              src="/images/status-board.jpg"
              alt="Handmade green amber red status board for unit fill levels"
              className="h-full min-h-[22rem] w-full object-cover md:min-h-full"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-200">
                Yard status board
              </p>
              <p className="font-display text-xl font-bold text-white">Green · Amber · Red</p>
            </div>
          </motion.div>

          <div className="flex flex-col justify-center rounded-[2rem] bg-[#1a2e26] p-6 text-white shadow-lg md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200/90">
              Status language
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold">Tap a fill level</h2>
            <p className="mt-2 text-white/65">
              Caretakers send <code className="rounded bg-white/10 px-1">UNIT LEVEL</code>. Level
              maps straight to the pin colour supervisors watch.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {LEVELS.map((l, i) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLevel(i)}
                  className={`rounded-2xl px-2 py-4 text-center transition ${
                    level === i
                      ? "bg-white text-ink shadow-md"
                      : "bg-white/10 text-white/80 hover:bg-white/15"
                  }`}
                >
                  <span className={`mx-auto mb-2 block h-3 w-3 rounded-full ${l.color}`} />
                  <span className="block text-xs font-bold">{l.key}</span>
                  <span className="block text-[11px] opacity-70">{l.name}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLevel.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-amber-200/80">
                  Map shows · {activeLevel.status}
                </p>
                <p className="mt-1 font-display text-2xl font-bold">
                  Level {activeLevel.key} — {activeLevel.name}
                </p>
                <p className="mt-2 text-sm text-white/70">{activeLevel.meaning}</p>
                <p className="mt-3 font-mono text-sm text-amber-100">
                  Example SMS: U014 {activeLevel.key}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Who — deep moss, horizontal role rows (not cards) */}
      <section className="bg-[#0f3d2e] px-5 py-20 text-white md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200/80">
              Roles
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Who does what</h2>
            <p className="mt-2 text-white/65">
              Three roles, three surfaces — expand a row to see the job list.
            </p>
          </div>
          <div className="mt-10 space-y-3">
            {[
              {
                icon: Smartphone,
                role: "Caretaker",
                tool: "Feature phone",
                tasks: ["SMS unit + level", "Or USSD menu 1 → code → level", "No app install"],
              },
              {
                icon: MapPinned,
                role: "Supervisor",
                tool: "Admin dashboard",
                tasks: ["Watch colour map", "Suggest & assign trips", "Mark payments paid"],
              },
              {
                icon: Users,
                role: "Care worker",
                tool: "Yard PWA",
                tasks: ["Today stats", "Stop checklist", "Log compost kg"],
              },
            ].map((card, i) => (
              <motion.details
                key={card.role}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                open={i === 0}
                className="group overflow-hidden rounded-2xl border border-white/15 bg-white/5 open:bg-white/10"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-200">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-xl font-bold">{card.role}</span>
                    <span className="text-sm text-white/55">{card.tool}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/40 transition group-open:rotate-90" />
                </summary>
                <ul className="grid gap-2 border-t border-white/10 px-5 py-4 sm:grid-cols-3">
                  {card.tasks.map((t) => (
                    <li
                      key={t}
                      className="rounded-xl bg-[#0a2a20] px-3 py-3 text-sm text-white/85"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* Lane story — pale chalk, numbered timeline (not cards) */}
      <section
        id="how"
        className="border-y border-ink/10 bg-[#f7f3ea] px-5 py-20 md:px-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 40% at 100% 0%, rgba(31,92,69,0.08), transparent)",
        }}
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss">Field story</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
              Built for the lane, not the boardroom
            </h2>
            <p className="mt-4 text-muted-foreground">
              Imagine Amina finishing a stop in Mathare: sun on the yard, prepaid data, thumb on
              a big “Mark visited” button. Admin tools exist so her supervisor can see red units
              early and pay her when the round is done.
            </p>
            <Button asChild className="mt-6" variant="accent">
              <Link to="/login">
                Try the SAMPLE loop <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <ol className="relative space-y-0 border-l-2 border-moss/30 pl-6">
            {[
              {
                icon: MessageSquare,
                title: "SMS / USSD",
                body: "Send U014 2 — unit turns amber. No smartphone required.",
              },
              {
                icon: MapPinned,
                title: "Colour map",
                body: "Green low, amber medium, red full. Filter and open readings.",
              },
              {
                icon: Wallet,
                title: "Trip pay",
                body: "Finish stops → owed KES → mark paid. CSV for the books.",
              },
            ].map((item, i) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative pb-10 last:pb-0"
              >
                <span className="absolute -left-[1.9rem] flex h-8 w-8 items-center justify-center rounded-full bg-moss text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="rounded-2xl border border-ink/10 bg-white/80 p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-5 w-5 text-moss" />
                    <p className="font-display text-lg font-bold text-ink">{item.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ — side by side, full page */}
      <section
        id="faq"
        className="flex min-h-[100svh] flex-col justify-center border-t border-ink/10 bg-[#14241e] px-5 py-16 text-white md:px-10"
      >
        <div className="mx-auto w-full max-w-6xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Questions</h2>
          <p className="mt-2 text-white/60">Tap a question to expand — two columns on wide screens.</p>
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <li
                  key={item.q}
                  className="overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left font-semibold"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                  >
                    {item.q}
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition ${open ? "rotate-90 text-amber-300" : "text-white/40"}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                      >
                        <p className="border-t border-white/10 px-4 py-3 text-sm text-white/70">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function LandingFooter() {
  const [copied, setCopied] = useState<string | null>(null);
  const careUrl = import.meta.env.VITE_CARE_URL || "http://localhost:5174";

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied("failed");
    }
  }

  const jumps = [
    { href: "#flow", label: "How it works" },
    { href: "#levels", label: "Fill levels" },
    { href: "#how", label: "Field story" },
    { href: "#faq", label: "Questions" },
  ];

  return (
    <footer className="border-t border-ink/10 bg-[#0f1c17] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_1fr_1fr] md:px-10">
        <div>
          <p className="font-display text-3xl font-bold">PitFlow</p>
          <p className="mt-2 max-w-sm text-sm text-white/60">
            Pit Sidecar idea-stage pilot — SAMPLE DATA only. From SMS report to paid care visit.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="accent">
              <Link to="/login">Admin login</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <a href={careUrl} target="_blank" rel="noreferrer">
                Care worker
              </a>
            </Button>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-200/80">On this page</p>
          <ul className="mt-3 space-y-1">
            {jumps.map((j) => (
              <li key={j.href}>
                <a
                  href={j.href}
                  className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  {j.label}
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-200/80">
            SAMPLE logins · tap to copy
          </p>
          <div className="mt-3 space-y-2">
            {[
              { label: "Admin phone", value: "+254700000001" },
              { label: "Admin password", value: "admin123" },
              { label: "Care phone", value: "+254700000002" },
              { label: "Care password", value: "care123" },
            ].map((row) => (
              <button
                key={row.label}
                type="button"
                onClick={() => void copy(row.label, row.value)}
                className="flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 text-left text-sm ring-1 ring-white/10 transition hover:bg-white/10"
              >
                <span>
                  <span className="block text-[10px] font-bold uppercase text-white/45">
                    {row.label}
                  </span>
                  <span className="font-mono text-amber-100">{row.value}</span>
                </span>
                <span className="text-[10px] font-bold uppercase text-white/40">
                  {copied === row.label ? "Copied" : "Copy"}
                </span>
              </button>
            ))}
          </div>
          {copied === "failed" && (
            <p className="mt-2 text-xs text-red-300">Clipboard blocked — copy manually.</p>
          )}
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-white/40 md:px-10">
        PitFlow / Pit Sidecar · idea-stage pilot · not production field data
      </div>
    </footer>
  );
}
