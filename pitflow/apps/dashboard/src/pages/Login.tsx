import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuth } from "../api";

export default function Login() {
  const [phone, setPhone] = useState("+254700000001");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const auth = await api.login(phone, password);
      if (auth.role !== "admin") throw new Error("Admin role required for dashboard");
      setAuth(auth);
      nav("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#d7ebe0,_#e8efe9_55%,_#f7f3ee)] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-moss/15 bg-white/90 p-8 shadow-sm"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-moss">PitFlow</h1>
          <p className="text-sm text-ink/70">Admin login · idea-stage prototype</p>
          <p className="mt-1 text-xs text-clay">SAMPLE credentials pre-filled</p>
        </div>
        <label className="block text-sm">
          Phone
          <input
            className="mt-1 w-full rounded border border-ink/15 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded border border-ink/15 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded bg-moss px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
