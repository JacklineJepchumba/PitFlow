const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

export type Auth = {
  access_token: string;
  role: string;
  full_name: string;
  user_id: number;
};

export function getAuth(): Auth | null {
  const raw = localStorage.getItem("pitflow_cw_auth");
  return raw ? (JSON.parse(raw) as Auth) : null;
}

export function setAuth(auth: Auth | null) {
  if (auth) localStorage.setItem("pitflow_cw_auth", JSON.stringify(auth));
  else localStorage.removeItem("pitflow_cw_auth");
}

async function parseError(res: Response) {
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    return j.detail || text || res.statusText;
  } catch {
    return text || res.statusText;
  }
}

async function request<T>(path: string, opts: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(opts.headers || {});
  if (auth) {
    const a = getAuth();
    if (!a) throw new Error("Please sign in again");
    headers.set("Authorization", `Bearer ${a.access_token}`);
  }
  if (opts.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export const api = {
  login: (phone: string, password: string) =>
    request<Auth>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ phone, password }) },
      false
    ),
  trips: () => request<any[]>("/trips"),
  patchStop: (tripId: number, stopId: number, body: object) =>
    request(`/trips/${tripId}/stops/${stopId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  batch: (body: object) =>
    request("/batches", { method: "POST", body: JSON.stringify(body) }),
};
