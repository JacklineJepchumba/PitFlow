const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

export type Auth = {
  access_token: string;
  role: string;
  full_name: string;
  user_id: number;
};

export function getAuth(): Auth | null {
  const raw = localStorage.getItem("pitflow_auth");
  return raw ? JSON.parse(raw) : null;
}

export function setAuth(auth: Auth | null) {
  if (auth) localStorage.setItem("pitflow_auth", JSON.stringify(auth));
  else localStorage.removeItem("pitflow_auth");
}

async function request<T>(
  path: string,
  opts: RequestInit = {},
  auth = true
): Promise<T> {
  const headers = new Headers(opts.headers || {});
  if (auth) {
    const a = getAuth();
    if (a) headers.set("Authorization", `Bearer ${a.access_token}`);
  }
  if (opts.body && !(opts.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.headers.get("content-type")?.includes("application/json")) {
    return res.json();
  }
  return (await res.text()) as T;
}

export const api = {
  login: (phone: string, password: string) =>
    request<Auth>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    }, false),
  units: (status?: string) =>
    request<any[]>(`/units${status ? `?status=${status}` : ""}`),
  readings: (unitId: number) => request<any[]>(`/readings?unit_id=${unitId}`),
  batches: () => request<any[]>("/batches"),
  suggest: () => request<any>("/dispatch/suggest", { method: "POST" }),
  careWorkers: () => request<any[]>("/care-workers"),
  createTrip: (body: object) =>
    request<any>("/trips", { method: "POST", body: JSON.stringify(body) }),
  trips: () => request<any[]>("/trips"),
  payments: () => request<any[]>("/payments"),
  markPaid: (id: number) =>
    request<any>(`/payments/${id}/mark-paid`, {
      method: "POST",
      body: JSON.stringify({ reference: "MANUAL-SAMPLE" }),
    }),
  demo: () => request<any>("/demo/run", { method: "POST" }),
  simulateSms: async (from: string, text: string) => {
    const body = new URLSearchParams({ from, text });
    const a = getAuth();
    const res = await fetch(`${API}/simulate/sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(a ? { Authorization: `Bearer ${a.access_token}` } : {}),
      },
      body,
    });
    // simulator is unauthenticated on backend — no auth needed
    return res.json();
  },
  simulateUssd: async (phoneNumber: string, text: string) => {
    const body = new URLSearchParams({ phoneNumber, text });
    const res = await fetch(`${API}/simulate/ussd`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    return res.json();
  },
  exportPaymentsUrl: () => {
    const a = getAuth();
    return `${API}/payments/export?token=use-header`;
  },
  downloadPayments: async () => {
    const a = getAuth();
    const res = await fetch(`${API}/payments/export`, {
      headers: a ? { Authorization: `Bearer ${a.access_token}` } : {},
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payments-sample.csv";
    link.click();
  },
};
