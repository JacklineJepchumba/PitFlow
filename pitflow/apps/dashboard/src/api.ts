const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

export type Auth = {
  access_token: string;
  role: string;
  full_name: string;
  user_id: number;
};

export function getAuth(): Auth | null {
  const raw = localStorage.getItem("pitflow_auth");
  return raw ? (JSON.parse(raw) as Auth) : null;
}

export function setAuth(auth: Auth | null) {
  if (auth) localStorage.setItem("pitflow_auth", JSON.stringify(auth));
  else localStorage.removeItem("pitflow_auth");
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return json.detail || text || res.statusText;
  } catch {
    return text || res.statusText;
  }
}

async function request<T>(
  path: string,
  opts: RequestInit = {},
  auth = true
): Promise<T> {
  const headers = new Headers(opts.headers || {});
  if (auth) {
    const a = getAuth();
    if (!a?.access_token) throw new Error("Please sign in again");
    headers.set("Authorization", `Bearer ${a.access_token}`);
  }
  if (
    opts.body &&
    !(opts.body instanceof URLSearchParams) &&
    !(opts.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(await parseError(res));
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return (await res.text()) as T;
}

async function formPost<T>(path: string, body: URLSearchParams): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export const api = {
  health: () => request<{ status: string }>("/health", {}, false),
  login: (phone: string, password: string) =>
    request<Auth>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ phone, password }) },
      false
    ),
  units: (status?: string) =>
    request<any[]>(`/units${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  sites: () => request<any[]>("/sites"),
  readings: (unitId: number) =>
    request<any[]>(`/readings?unit_id=${unitId}`),
  batches: () => request<any[]>("/batches"),
  createBatch: (body: object) =>
    request<any>("/batches", { method: "POST", body: JSON.stringify(body) }),
  suggest: () => request<any>("/dispatch/suggest", { method: "POST" }),
  careWorkers: () => request<any[]>("/care-workers"),
  createTrip: (body: object) =>
    request<any>("/trips", { method: "POST", body: JSON.stringify(body) }),
  trips: () => request<any[]>("/trips"),
  payments: () => request<any[]>("/payments"),
  markPaid: (id: number, reference = "MANUAL-SAMPLE") =>
    request<any>(`/payments/${id}/mark-paid`, {
      method: "POST",
      body: JSON.stringify({ reference }),
    }),
  demo: () => request<any>("/demo/run", { method: "POST" }),
  simulateSms: (from: string, text: string) =>
    formPost<{ reply: string; sample?: boolean }>(
      "/simulate/sms",
      new URLSearchParams({ from, text })
    ),
  simulateUssd: (phoneNumber: string, text: string) =>
    formPost<{ reply: string; sample?: boolean }>(
      "/simulate/ussd",
      new URLSearchParams({ phoneNumber, text })
    ),
  downloadPayments: async () => {
    const a = getAuth();
    if (!a) throw new Error("Please sign in again");
    const res = await fetch(`${API}/payments/export`, {
      headers: { Authorization: `Bearer ${a.access_token}` },
    });
    if (!res.ok) throw new Error(await parseError(res));
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payments-sample.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
