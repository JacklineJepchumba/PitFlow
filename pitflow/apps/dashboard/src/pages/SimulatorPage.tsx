import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SimulatorPage() {
  const [phone, setPhone] = useState("+254711000001");
  const [smsText, setSmsText] = useState("U001 3");
  const [ussdText, setUssdText] = useState("");
  const [reply, setReply] = useState("Ready. Send like a caretaker on a basic phone.");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendSms() {
    setBusy(true);
    setError("");
    try {
      const r = await api.simulateSms(phone.trim(), smsText.trim());
      setReply(r.reply);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "SMS failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendUssd() {
    setBusy(true);
    setError("");
    try {
      const r = await api.simulateUssd(phone.trim(), ussdText.trim());
      setReply(r.reply);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "USSD failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Phone simulator</h1>
        <p className="text-sm text-muted-foreground">
          Same handlers as Africa&apos;s Talking — no gateway keys needed. Default caretaker
          phone is seeded SAMPLE data.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border-4 border-ink bg-ink p-3 shadow-xl"
      >
        <div className="min-h-[420px] space-y-3 rounded-[1.4rem] bg-[#dff5e4] p-4 text-ink">
          <p className="text-center text-xs font-bold uppercase tracking-wide">
            Feature phone · SAMPLE
          </p>
          <label className="block text-xs font-semibold">
            From phone
            <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block text-xs font-semibold">
            SMS (unit + level)
            <Input
              className="mt-1"
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="U001 3"
            />
          </label>
          <Button className="w-full" onClick={sendSms} disabled={busy}>
            {busy ? "Sending…" : "Send SMS"}
          </Button>
          <label className="block text-xs font-semibold">
            USSD session text
            <Input
              className="mt-1"
              value={ussdText}
              onChange={(e) => setUssdText(e.target.value)}
              placeholder="empty · then 1 · then U001 · then 3  OR  1*U001*3"
            />
          </label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setUssdText("")}
              disabled={busy}
            >
              Menu
            </Button>
            <Button className="flex-1" variant="accent" onClick={sendUssd} disabled={busy}>
              Send USSD
            </Button>
          </div>
          <pre className="min-h-[100px] whitespace-pre-wrap rounded-lg bg-white/90 p-3 text-sm">
            {reply}
          </pre>
          {error && <p className="text-xs text-red-700">{error}</p>}
        </div>
      </motion.div>
      <p className="text-xs text-muted-foreground">
        After a red SMS, open Map to see the pin, then Trips → Suggest.
      </p>
    </div>
  );
}
