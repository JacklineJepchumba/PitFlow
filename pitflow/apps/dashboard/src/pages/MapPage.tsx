import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      el.onclick = async () => {
        setSelected(u);
        setError("");
        try {
          const [r, b] = await Promise.all([api.readings(u.id), api.batches()]);
          setReadings(r.slice(0, 10));
          setBatches(b.filter((x: any) => x.unit_id === u.id).slice(0, 6));
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Failed to load unit detail");
        }
      };
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
            Tap a coloured pin — green low, amber medium, red full. SAMPLE DATA.
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

      {loading && <p className="text-sm text-muted-foreground">Loading units…</p>}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div
        id="map"
        ref={mapRef}
        className="overflow-hidden rounded-2xl border border-moss/20 shadow-sm"
      />

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle>
                    {selected.code}{" "}
                    <Badge variant={selected.status as "green" | "amber" | "red"}>
                      {selected.status}
                    </Badge>
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selected.site_name} · {selected.area}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recent readings
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {readings.length === 0 && <li>No readings yet</li>}
                    {readings.map((r) => (
                      <li key={r.id}>
                        Level {r.level} · {r.source} ·{" "}
                        {new Date(r.created_at).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Compost history
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {batches.length === 0 && <li>No batches yet</li>}
                    {batches.map((b) => (
                      <li key={b.id}>
                        {b.weight_kg} kg · {b.tested ? "tested" : "untested"}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Last visit: {selected.last_visited_at
                      ? new Date(selected.last_visited_at).toLocaleString()
                      : "never"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
