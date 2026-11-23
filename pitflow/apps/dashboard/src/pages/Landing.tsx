import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MapPinned, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 md:px-10">
        <p className="font-display text-2xl font-bold text-white drop-shadow">PitFlow</p>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-white/40 bg-white/15 text-white backdrop-blur hover:bg-white/25">
            <Link to="/login">Admin</Link>
          </Button>
          <Button asChild variant="accent">
            <a href="http://localhost:5174" target="_blank" rel="noreferrer">
              Care worker
            </a>
          </Button>
        </div>
      </header>

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
            <Button asChild size="lg" variant="outline" className="border-white/50 bg-white/10 text-white hover:bg-white/20">
              <a href="#how">How a field day works</a>
            </Button>
          </motion.div>
          <p className="mt-6 text-xs font-medium text-amber-100/90">
            Idea-stage prototype · SAMPLE DATA only · not a real pilot
          </p>
        </div>
      </section>

      <section id="how" className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-2 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <img
            src="/images/status-board.jpg"
            alt="Handmade green amber red status board for unit fill levels"
            className="h-72 w-full rounded-2xl object-cover shadow-md md:h-full"
          />
        </motion.div>
        <div className="space-y-6 self-center">
          <h2 className="font-display text-3xl font-bold text-ink">Built for the lane, not the boardroom</h2>
          <p className="text-muted-foreground">
            Imagine Amina finishing a stop in Mathare: sun on the yard, prepaid data,
            thumb on a big “Mark visited” button. The admin tools exist so her supervisor
            can see red units early and pay her when the round is done.
          </p>
          <ul className="space-y-4">
            {[
              {
                icon: MessageSquare,
                title: "SMS / USSD from caretakers",
                body: "Send U014 2 — unit turns amber on the map. No smartphone required.",
              },
              {
                icon: MapPinned,
                title: "Colour map for supervisors",
                body: "Green low, amber medium, red full. Filter, open a unit, see readings.",
              },
              {
                icon: Users,
                title: "Care worker checklist",
                body: "Bedding, pad bin, compost kg, visit done — payment owed when the trip finishes.",
              },
            ].map((item, i) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-3 rounded-xl border bg-white/80 p-4"
              >
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-moss" />
                <div>
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t bg-white/60 px-5 py-8 text-center text-sm text-muted-foreground md:px-10">
        PitFlow / Pit Sidecar · idea-stage hackathon prototype · SAMPLE DATA only
      </footer>
    </div>
  );
}
