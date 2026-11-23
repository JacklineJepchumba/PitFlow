import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api";

type Mode = "sms" | "ussd";

type LogEntry = { at: string; channel: Mode; sent: string; reply: string };

const KEYS: { label: string; sub?: string; value: string }[][] = [
  [
    { label: "1", value: "1" },
    { label: "2", sub: "abc", value: "2" },
    { label: "3", sub: "def", value: "3" },
  ],
  [
    { label: "4", sub: "ghi", value: "4" },
    { label: "5", sub: "jkl", value: "5" },
    { label: "6", sub: "mno", value: "6" },
  ],
  [
    { label: "7", sub: "pqrs", value: "7" },
    { label: "8", sub: "tuv", value: "8" },
    { label: "9", sub: "wxyz", value: "9" },
  ],
  [
    { label: "*", value: "*" },
    { label: "0", sub: "_", value: "0" },
    { label: "#", value: "#" },
  ],
];

const QUICK_SMS = ["U001 3", "U002 2", "U003 3", "U008 1"];

export default function SimulatorPage() {
  const [phone, setPhone] = useState("+254711000001");
  const [mode, setMode] = useState<Mode>("sms");
  const [draft, setDraft] = useState("U001 3");
  const [ussdPath, setUssdPath] = useState("");
  const [reply, setReply] = useState("Ready.\nType like a caretaker.");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function pushLog(channel: Mode, sent: string, nextReply: string) {
    setLog((prev) =>
      [
        {
          at: new Date().toLocaleTimeString(),
          channel,
          sent: sent || "(menu)",
          reply: nextReply,
        },
        ...prev,
      ].slice(0, 12)
    );
  }

  function pressKey(value: string) {
    setDraft((d) => d + value);
    inputRef.current?.focus();
  }

  function backspace() {
    setDraft((d) => d.slice(0, -1));
  }

  function clearAll() {
    setDraft("");
    if (mode === "ussd") setUssdPath("");
  }

  async function send() {
    setBusy(true);
    setError("");
    try {
      if (mode === "sms") {
        const text = draft.trim();
        const r = await api.simulateSms(phone.trim(), text);
        setReply(r.reply);
        pushLog("sms", text, r.reply);
      } else {
        const step = draft.trim();
        const nextPath = ussdPath === "" ? step : step === "" ? ussdPath : `${ussdPath}*${step}`;
        const r = await api.simulateUssd(phone.trim(), nextPath);
        setReply(r.reply);
        pushLog("ussd", nextPath || "(empty)", r.reply);
        if (r.reply.startsWith("END")) {
          setUssdPath("");
          setDraft("");
        } else {
          setUssdPath(nextPath);
          setDraft("");
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function openUssdMenu() {
    setMode("ussd");
    setUssdPath("");
    setDraft("");
    setBusy(true);
    setError("");
    try {
      const r = await api.simulateUssd(phone.trim(), "");
      setReply(r.reply);
      pushLog("ussd", "(menu)", r.reply);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "USSD failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Feature phone</h1>
        <p className="text-sm text-muted-foreground">
          Candybar SIM for caretaker SMS / USSD — same handlers as Africa&apos;s Talking.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Channel
          </p>
          <p className="font-display text-2xl font-bold uppercase text-ink">{mode}</p>
        </div>
        <div className="panel px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Messages sent
          </p>
          <p className="font-display text-2xl font-bold text-ink">{log.length}</p>
        </div>
        <div className="panel px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Seeded caretaker
          </p>
          <p className="truncate font-mono text-sm font-semibold text-ink">{phone}</p>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,280px)_1fr]">
        <div className="mx-auto w-full max-w-[280px] space-y-3 lg:mx-0">
          <label className="panel flex flex-col gap-1 px-3 py-2 text-xs font-semibold text-muted-foreground">
            SIM (caretaker)
            <input
              className="rounded-md border border-ink/15 bg-white/80 px-3 py-2 font-mono text-sm text-ink"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
            />
          </label>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
          >
            <div
              className="rounded-[2.4rem] px-3 pb-5 pt-4 shadow-[0_24px_48px_-12px_rgba(20,40,30,0.55)]"
              style={{
                background:
                  "linear-gradient(160deg, #3a4540 0%, #1a221e 42%, #121816 100%)",
                border: "3px solid #0c100e",
              }}
            >
              <div className="mb-3 flex flex-col items-center gap-2">
                <div className="h-1.5 w-14 rounded-full bg-black/50 ring-1 ring-white/10" />
                <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-white/35">
                  PitFlow
                </p>
              </div>

              <button
                type="button"
                className="relative w-full cursor-text overflow-hidden rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                style={{
                  background: "linear-gradient(180deg, #9bb89a 0%, #7a9a78 100%)",
                  boxShadow:
                    "inset 0 2px 8px rgba(0,0,0,0.35), inset 0 0 0 2px #4a5e48",
                }}
                onClick={() => inputRef.current?.focus()}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.12]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 3px)",
                  }}
                />
                <div className="relative space-y-1 px-3 py-2.5 font-mono text-[13px] leading-snug text-[#0f2418]">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-80">
                    <span>{mode === "sms" ? "SMS" : "USSD"}</span>
                    <span>SAMPLE</span>
                  </div>
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    className="w-full border-0 bg-transparent p-0 font-mono text-[13px] font-semibold text-[#0f2418] outline-none placeholder:text-[#0f2418]/50"
                    placeholder={mode === "sms" ? "U001 3" : "type reply…"}
                    aria-label="Compose"
                  />
                  {mode === "ussd" && ussdPath !== "" && (
                    <p className="truncate text-[10px] opacity-70">path: {ussdPath}</p>
                  )}
                  <pre className="min-h-[5.5rem] whitespace-pre-wrap border-t border-[#0f2418]/20 pt-1.5 text-[12px]">
                    {reply.replace(/^CON |^END /, "")}
                  </pre>
                </div>
              </button>

              <div className="mt-3 grid grid-cols-3 gap-2 px-1">
                <SoftKey
                  label={mode === "sms" ? "USSD" : "SMS"}
                  onClick={() => {
                    if (mode === "sms") void openUssdMenu();
                    else {
                      setMode("sms");
                      setDraft("U001 3");
                      setUssdPath("");
                      setReply("SMS mode.\nUnit + level.");
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void send()}
                  className="mx-auto flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white transition active:scale-95 disabled:opacity-50"
                  style={{
                    background: "radial-gradient(circle at 35% 30%, #5ecf7a, #1f7a3a 70%)",
                    boxShadow: "0 2px 0 #0d3d1c, inset 0 1px 2px rgba(255,255,255,0.35)",
                  }}
                  aria-label="Send"
                >
                  {busy ? "…" : "☎"}
                </button>
                <SoftKey label="CLR" onClick={backspace} onDoubleClick={clearAll} />
              </div>

              <div className="mt-3 space-y-1.5 px-0.5">
                {KEYS.map((row) => (
                  <div key={row[0].label} className="grid grid-cols-3 gap-1.5">
                    {row.map((key) => (
                      <KeypadKey
                        key={key.label}
                        label={key.label}
                        sub={key.sub}
                        onClick={() => pressKey(key.value)}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="mx-auto mt-4 h-1 w-10 rounded-full bg-black/40" />
            </div>
          </motion.div>

          {error && (
            <p className="text-center text-xs text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quick SMS (level 3 = full / red)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_SMS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="rounded-md bg-moss/15 px-3 py-2 font-mono text-sm font-semibold text-ink hover:bg-moss/25"
                  onClick={() => {
                    setMode("sms");
                    setDraft(t);
                    inputRef.current?.focus();
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Format: <code className="rounded bg-ink/10 px-1">UNIT LEVEL</code> where level is 1,
              2, or 3. After a red SMS, open Map then Trips → Suggest.
            </p>
          </div>

          <div className="panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              USSD walkthrough
            </p>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="rounded-lg bg-ink/5 px-3 py-2">
                Soft key <strong className="text-ink">USSD</strong> opens the menu
              </li>
              <li className="rounded-lg bg-ink/5 px-3 py-2">
                Send <strong className="text-ink">1</strong> → report level
              </li>
              <li className="rounded-lg bg-ink/5 px-3 py-2">
                Send unit code e.g. <strong className="text-ink">U001</strong>
              </li>
              <li className="rounded-lg bg-ink/5 px-3 py-2">
                Send <strong className="text-ink">3</strong> for full / red
              </li>
            </ol>
          </div>

          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
              <h2 className="font-display text-xl font-semibold">Session log</h2>
              <button
                type="button"
                className="text-xs font-semibold text-muted-foreground hover:text-ink"
                onClick={() => setLog([])}
              >
                Clear
              </button>
            </div>
            <ul className="max-h-[22rem] divide-y divide-ink/10 overflow-y-auto">
              {log.map((e, i) => (
                <li key={`${e.at}-${i}`} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-moss/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-moss">
                      {e.channel}
                    </span>
                    <span className="text-xs text-muted-foreground">{e.at}</span>
                    <span className="font-mono text-xs">{e.sent}</span>
                  </div>
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                    {e.reply}
                  </pre>
                </li>
              ))}
              {!log.length && (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Sends appear here — green ☎ on the phone to transmit.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SoftKey({
  label,
  onClick,
  onDoubleClick,
}: {
  label: string;
  onClick: () => void;
  onDoubleClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="h-9 rounded-md text-[10px] font-bold uppercase tracking-wide text-white/80 transition active:scale-95 active:bg-white/10"
      style={{
        background: "linear-gradient(180deg, #4a5550, #2a322e)",
        boxShadow: "0 2px 0 #0a0e0c, inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      {label}
    </button>
  );
}

function KeypadKey({
  label,
  sub,
  onClick,
}: {
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 flex-col items-center justify-center rounded-lg text-white transition active:scale-95 active:brightness-90"
      style={{
        background: "linear-gradient(180deg, #2e3834 0%, #1c2420 100%)",
        boxShadow: "0 3px 0 #080c0a, inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      <span className="text-base font-semibold leading-none">{label}</span>
      {sub && (
        <span className="mt-0.5 text-[8px] uppercase tracking-wider text-white/40">{sub}</span>
      )}
    </button>
  );
}
