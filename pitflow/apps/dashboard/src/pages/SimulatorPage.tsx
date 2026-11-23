import { useState } from "react";
import { api } from "../api";

export default function SimulatorPage() {
  const [phone, setPhone] = useState("+254711000001");
  const [smsText, setSmsText] = useState("U001 3");
  const [ussdText, setUssdText] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h2 className="font-display text-2xl font-bold">SMS / USSD simulator</h2>
      <p className="text-sm text-ink/70">No Africa&apos;s Talking credentials needed · SAMPLE</p>
      <div className="rounded-[2rem] border-4 border-ink bg-ink p-3 shadow-lg">
        <div className="min-h-[360px] rounded-[1.5rem] bg-[#dff5e4] p-4 text-ink">
          <p className="mb-3 text-center text-xs font-semibold">Feature phone · demo</p>
          <label className="block text-xs">
            Phone
            <input
              className="mt-1 w-full rounded px-2 py-1 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="mt-2 block text-xs">
            SMS text
            <input
              className="mt-1 w-full rounded px-2 py-1 text-sm"
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
            />
          </label>
          <button
            className="mt-2 w-full rounded bg-moss py-2 text-sm text-white"
            onClick={async () => {
              try {
                const r = await api.simulateSms(phone, smsText);
                setReply(r.reply);
                setError("");
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            Send SMS
          </button>
          <label className="mt-4 block text-xs">
            USSD session text (e.g. empty, then 1, then U001, then 3)
            <input
              className="mt-1 w-full rounded px-2 py-1 text-sm"
              value={ussdText}
              onChange={(e) => setUssdText(e.target.value)}
              placeholder="1*U001*3"
            />
          </label>
          <button
            className="mt-2 w-full rounded bg-clay py-2 text-sm text-white"
            onClick={async () => {
              try {
                const r = await api.simulateUssd(phone, ussdText);
                setReply(r.reply);
                setError("");
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            Send USSD
          </button>
          <pre className="mt-4 whitespace-pre-wrap rounded bg-white/80 p-2 text-xs">{reply}</pre>
          {error && <p className="text-xs text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
