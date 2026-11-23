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

      {/* Hero — keep lean */}
      <section className="relative min-h-[92vh] overflow-hidden">
        <img
          src="/images/hero-care-worker.jpg"
          alt="Care worker beside a Pit Sidecar sanitation unit in a Nairobi settlement"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/45 to-ink/25" />
        <div className="relative z-10 flex min-h-[92vh] max-w-3xl flex-col justify-end px-5 pb-16 pt-28 md:px-10">
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

      {/* Interactive status board */}
      <section id="levels" className="mx-auto max-w-6xl px-5 py-16 md:px-10">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss">
              Status language
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink">
              Tap a fill level
            </h2>
            <p className="mt-2 text-muted-foreground">
              Caretakers send <code className="rounded bg-ink/10 px-1">UNIT LEVEL</code>. Level
              maps straight to the pin colour supervisors watch.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {LEVELS.map((l, i) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLevel(i)}
                  className={`flex items-center gap-2 rounded-2xl border bg-[#f0ebe1] px-4 py-3 transition ${
                    level === i
                      ? `ring-2 ${l.ring} border-transparent`
                      : "border-ink/10 hover:border-ink/25"
                  }`}
                >
                  <span className={`h-4 w-4 rounded-full ${l.color}`} />
                  <span className="font-semibold text-ink">
                    {l.key} · {l.name}
                  </span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLevel.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 rounded-2xl border border-ink/10 bg-[#f0ebe1] p-5"
              >
                <p className="text-sm font-bold uppercase text-muted-foreground">
                  Map shows · {activeLevel.status}
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-ink">
                  Level {activeLevel.key} — {activeLevel.name}
                </p>
                <p className="mt-2 text-muted-foreground">{activeLevel.meaning}</p>
                <p className="mt-4 font-mono text-sm text-moss">
                  Example SMS: U014 {activeLevel.key}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <img
              src="/images/status-board.jpg"
              alt="Handmade green amber red status board for unit fill levels"
              className="h-80 w-full rounded-2xl object-cover shadow-md md:h-[28rem]"
            />
          </motion.div>
        </div>
      </section>

      {/* Who uses what */}
      <section className="border-y border-ink/10 bg-[#f0ebe1]/80 px-5 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-bold text-ink">Who does what</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Three roles, three surfaces — hover or tap a card for the job to-do.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
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
              <motion.article
                key={card.role}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm transition hover:border-moss/40 hover:shadow-md"
              >
                <card.icon className="h-6 w-6 text-moss" />
                <h3 className="mt-3 font-display text-xl font-bold text-ink">{card.role}</h3>
                <p className="text-sm text-muted-foreground">{card.tool}</p>
                <ul className="mt-4 space-y-2 text-sm text-ink/80">
                  {card.tasks.map((t) => (
                    <li
                      key={t}
                      className="rounded-lg bg-moss/5 px-3 py-2 transition group-hover:bg-moss/10"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Built for the lane — keep existing flavour */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16 md:px-10">
        <div className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-ink">
            Built for the lane, not the boardroom
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Imagine Amina finishing a stop in Mathare: sun on the yard, prepaid data, thumb on
            a big “Mark visited” button. Admin tools exist so her supervisor can see red units
            early and pay her when the round is done.
          </p>
          <ul className="grid gap-4 md:grid-cols-3">
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
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-ink/10 bg-[#f0ebe1] p-5"
              >
                <item.icon className="h-5 w-5 text-moss" />
                <p className="mt-3 font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ accordion */}
      <section id="faq" className="border-t border-ink/10 bg-[#14241e] px-5 py-16 text-white md:px-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold">Questions</h2>
          <p className="mt-2 text-white/60">Tap a question to expand.</p>
          <ul className="mt-8 space-y-2">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <li key={item.q} className="overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
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

      {/* CTA */}
      <section className="px-5 py-14 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl bg-moss px-6 py-10 text-white md:flex-row md:items-center md:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Walk the SAMPLE loop</h2>
            <p className="mt-2 max-w-lg text-white/75">
              Admin +254700000001 / admin123 · Care +254700000002 / care123
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent">
              <Link to="/login">Admin login</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <a
                href={import.meta.env.VITE_CARE_URL || "http://localhost:5174"}
                target="_blank"
                rel="noreferrer"
              >
                Care worker
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10 bg-[#e6dfd2] px-5 py-8 text-center text-sm text-muted-foreground md:px-10">
        PitFlow / Pit Sidecar · idea-stage pilot · SAMPLE DATA only
      </footer>
    </div>
  );
}
