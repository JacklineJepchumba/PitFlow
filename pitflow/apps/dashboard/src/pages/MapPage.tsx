import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const COLORS: Record<string, string> = {
  green: "#1f5c45",
  amber: "#d4a017",
  red: "#c0392b",
};

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function loadUnits(status?: string) {
    setLoading(true);
    setError("");
    try {
      setUnits(await api.units(status || undefined));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load units");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUnits(filter);
  }, [filter]);

  const counts = useMemo(() => {
    const c = { green: 0, amber: 0, red: 0, total: units.length };
    units.forEach((u) => {
      if (u.status in c) (c as any)[u.status] += 1;
    });
    return c;
  }, [units]);

  const filteredList = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return units;
    return units.filter(
      (u) =>
        u.code?.toLowerCase().includes(needle) ||
        u.site_name?.toLowerCase().includes(needle) ||
        u.area?.toLowerCase().includes(needle)
    );
  }, [units, q]);

  async function openUnit(u: any) {
    setSelected(u);
    setError("");
    try {
      const [r, b] = await Promise.all([api.readings(u.id), api.batches()]);
      setReadings(r.slice(0, 10));
      setBatches(b.filter((x: any) => x.unit_id === u.id).slice(0, 6));
      if (mapObj.current && u.lon != null && u.lat != null) {
        mapObj.current.flyTo({ center: [u.lon, u.lat], zoom: 14.5 });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load unit detail");
    }
  }

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapObj.current) {
      mapObj.current = new maplibregl.Map({
        container: mapRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        center: [36.82, -1.29],
        zoom: 11.2,
      });
      mapObj.current.addControl(new maplibregl.NavigationControl(), "top-right");
    }

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const map = mapObj.current;

    units.forEach((u) => {
      if (u.lon == null || u.lat == null) return;
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `${u.code} ${u.status}`);
      el.style.cssText = `width:18px;height:18px;border-radius:999px;border:2px solid #fff;background:${
        COLORS[u.status] || "#666"
      };box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:pointer;`;
      el.onclick = () => void openUnit(u);
      markersRef.current.push(
        new maplibregl.Marker({ element: el }).setLngLat([u.lon, u.lat]).addTo(map)
      );
    });
  }, [units]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Unit map</h1>
          <p className="text-sm text-muted-foreground">
            Nairobi SAMPLE yard pins — green low, amber medium, red full.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["", "green", "amber", "red"].map((s) => (
            <Button
              key={s || "all"}
              size="sm"
              variant={filter === s ? "default" : "outline"}
              onClick={() => setFilter(s)}
            >
              {s ? s : "All"}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={() => loadUnits(filter)} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Units", value: counts.total, tone: "text-ink" },
          { label: "Green", value: counts.green, tone: "text-moss" },
          { label: "Amber", value: counts.amber, tone: "text-amber-700" },
          { label: "Red / full", value: counts.red, tone: "text-red-700" },
        ].map((s) => (
          <div key={s.label} className="panel px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className={`font-display text-3xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-md bg-red-100/80 px-3 py-2 text-sm text-red-900" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="panel overflow-hidden p-2">
          <div id="map" ref={mapRef} className="overflow-hidden rounded-xl" />
        </div>

        <div className="panel flex max-h-[72vh] flex-col overflow-hidden">
          <div className="border-b border-ink/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Unit roster
            </p>
            <input
              className="mt-2 w-full rounded-md border border-ink/15 bg-white/70 px-3 py-2 text-sm"
              placeholder="Search code, site, area…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <ul className="flex-1 space-y-1 overflow-y-auto p-2">
            {loading && <li className="px-2 py-3 text-sm text-muted-foreground">Loading…</li>}
            {!loading &&
              filteredList.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => void openUnit(u)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-moss/10 ${
                      selected?.id === u.id ? "bg-moss/15 ring-1 ring-moss/30" : ""
                    }`}
                  >
                    <span>
                      <span className="font-semibold">{u.code}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {u.area} · {u.site_name}
                      </span>
                    </span>
                    <Badge variant={u.status as "green" | "amber" | "red"}>{u.status}</Badge>
                  </button>
                </li>
              ))}
            {!loading && !filteredList.length && (
              <li className="px-2 py-3 text-sm text-muted-foreground">No matching units.</li>
            )}
          </ul>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="panel p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  {selected.code}{" "}
                  <Badge variant={selected.status as "green" | "amber" | "red"}>
                    {selected.status}
                  </Badge>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.site_name} · {selected.area} · design {selected.design}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-moss/10 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Capacity</p>
                <p className="font-display text-2xl font-bold">{selected.capacity_users} users</p>
              </div>
              <div className="rounded-xl bg-clay/10 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Last reading</p>
                <p className="text-sm font-semibold">
                  {selected.last_reading_at
                    ? new Date(selected.last_reading_at).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-ink/5 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Last visit</p>
                <p className="text-sm font-semibold">
                  {selected.last_visited_at
                    ? new Date(selected.last_visited_at).toLocaleString()
                    : "never"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent readings
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {readings.length === 0 && <li className="text-muted-foreground">No readings yet</li>}
                  {readings.map((r) => (
                    <li
                      key={r.id}
                      className="flex justify-between rounded-md bg-white/50 px-2 py-1.5"
                    >
                      <span>
                        Level {r.level} · {r.source}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Compost history
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {batches.length === 0 && <li className="text-muted-foreground">No batches yet</li>}
                  {batches.map((b) => (
                    <li
                      key={b.id}
                      className="flex justify-between rounded-md bg-white/50 px-2 py-1.5"
                    >
                      <span>{b.weight_kg} kg</span>
                      <span>{b.tested ? "tested" : "untested"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
