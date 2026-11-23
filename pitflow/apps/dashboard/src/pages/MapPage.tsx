import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { api } from "../api";

const COLORS: Record<string, string> = {
  green: "#2f6b4f",
  amber: "#d4a017",
  red: "#c0392b",
};

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<maplibregl.Map | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .units(filter || undefined)
      .then(setUnits)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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
        zoom: 11,
      });
    }
    const map = mapObj.current;
    const markers: maplibregl.Marker[] = [];
    units.forEach((u) => {
      if (u.lon == null || u.lat == null) return;
      const el = document.createElement("button");
      el.title = `${u.code} ${u.status}`;
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.background = COLORS[u.status] || "#666";
      el.onclick = async () => {
        setSelected(u);
        try {
          const [r, b] = await Promise.all([api.readings(u.id), api.batches()]);
          setReadings(r.slice(0, 8));
          setBatches(b.filter((x: any) => x.unit_id === u.id).slice(0, 5));
        } catch (e: any) {
          setError(e.message);
        }
      };
      markers.push(new maplibregl.Marker({ element: el }).setLngLat([u.lon, u.lat]).addTo(map));
    });
    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [units]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Unit map</h2>
          <p className="text-sm text-ink/70">Colours = fill level · SAMPLE DATA</p>
        </div>
        <select
          className="rounded border px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="green">Green</option>
          <option value="amber">Amber</option>
          <option value="red">Red</option>
        </select>
      </div>
      {loading && <p>Loading units…</p>}
      {error && <p className="text-red-700">{error}</p>}
      <div id="map" ref={mapRef} className="overflow-hidden rounded-xl border border-moss/20" />
      {selected && (
        <aside className="rounded-xl border border-moss/20 bg-white p-4">
          <h3 className="font-display text-lg font-bold">
            {selected.code} · {selected.status}
          </h3>
          <p className="text-sm">
            {selected.site_name} · {selected.area}
          </p>
          <p className="text-xs text-ink/60">
            Last visit: {selected.last_visited_at || "never"} · Last reading:{" "}
            {selected.last_reading_at || "—"}
          </p>
          <h4 className="mt-3 text-sm font-semibold">Recent readings</h4>
          <ul className="text-sm">
            {readings.map((r) => (
              <li key={r.id}>
                L{r.level} via {r.source} · {new Date(r.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
          <h4 className="mt-3 text-sm font-semibold">Compost history</h4>
          <ul className="text-sm">
            {batches.map((b) => (
              <li key={b.id}>
                {b.weight_kg} kg · {b.tested ? "tested" : "untested"}
              </li>
            ))}
            {!batches.length && <li>No batches yet</li>}
          </ul>
        </aside>
      )}
    </div>
  );
}
