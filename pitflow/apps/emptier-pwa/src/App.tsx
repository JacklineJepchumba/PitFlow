import { FormEvent, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, setAuth } from "./api";
import Shell from "./Shell";
import Today from "./pages/Today";
import Stops from "./pages/Stops";
import Guide from "./pages/Guide";
import Me from "./pages/Me";

function Login() {
  const [phone, setPhone] = useState("+254700000002");
  const [password, setPassword] = useState("care123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const auth = await api.login(phone.trim(), password);
      if (auth.role !== "care_worker") {
        throw new Error("Care worker login only — admins use the dashboard.");
      }
      setAuth(auth);
      nav("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-end overflow-hidden">
      <img
        src="/images/hero-care-worker.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-field via-field/80 to-field/30" />
      <motion.form
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="relative m-4 mb-8 space-y-3 rounded-2xl bg-chalk p-5 shadow-lg"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-leaf">Care worker</p>
        <h1 className="text-2xl font-bold text-field">Karibu · Sign in</h1>
        <p className="text-sm text-field/70">
          Today → Stops → Guide → Me. Big taps for the yard. SAMPLE login filled in.
        </p>
        <input
          className="tap w-full rounded-xl border border-field/20 bg-white px-3"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="username"
        />
        <input
          type="password"
          className="tap w-full rounded-xl border border-field/20 bg-white px-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="tap w-full rounded-xl bg-field text-white disabled:opacity-60"
        >
          {loading ? "…" : "Start today’s round"}
        </button>
      </motion.form>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Shell />}>
        <Route path="/" element={<Today />} />
        <Route path="/stops" element={<Stops />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/me" element={<Me />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
