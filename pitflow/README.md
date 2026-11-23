# PitFlow / Pit Sidecar

**From pit to product, verified — idea-stage prototype.**

Software for worm-and-charcoal sanitation units beside shared pit toilets in informal settlements (Nairobi demo). Trained local care workers visit units; caretakers report fill levels by SMS/USSD.

![Status](https://img.shields.io/badge/status-idea--stage-orange)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> **SAMPLE DATA ONLY.** Nothing in this repo is from a real pilot. Do not treat readings, payments, or map points as field truth.

---

## Stack

| Layer | Tools |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy 2, GeoAlchemy2, Alembic |
| Database | PostgreSQL + PostGIS (local install; set `DATABASE_URL`) |
| Routing | Google OR-Tools |
| Messaging | Africa's Talking webhooks + local simulator |
| Payments | Ledger records; M-Pesa Daraja sandbox behind `DARAJA_PAYOUTS_ENABLED` (default off) |
| Frontends | React + TypeScript + Vite + Tailwind + MapLibre |

## Getting started

### 1. Database

Install **PostgreSQL with PostGIS** on your machine (or use any hosted Postgres that has the PostGIS extension). Create a database, then set `DATABASE_URL` in `backend/.env`.

Default expected by `.env.example`:

```text
DATABASE_URL=postgresql+psycopg2://pitflow:pitflow@localhost:5432/pitflow
```

Enable PostGIS once (as a superuser):

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 2. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item ..\.env.example .env
# edit .env DATABASE_URL if your Postgres user/db differ
alembic upgrade head
python ..\scripts\seed_demo.py
uvicorn app.main:app --reload --port 8001
```

```bash
# Unix
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
# edit .env DATABASE_URL if your Postgres user/db differ
alembic upgrade head
python ../scripts/seed_demo.py
uvicorn app.main:app --reload --port 8001
```

- Health: http://127.0.0.1:8001/health  
- Tests: `pytest`  
- SAMPLE logins: admin `+254700000001` / `admin123` · care worker `+254700000002` / `care123`

### 3. Admin dashboard

```bash
cd apps/dashboard
cp .env.example .env   # VITE_API_URL=http://127.0.0.1:8001
npm install
npm run dev            # http://localhost:5173
```

### 4. Care worker app (`apps/emptier-pwa`)

```bash
cd apps/emptier-pwa
cp .env.example .env
npm install
npm run dev            # http://localhost:5174
```

UI is labelled **Care worker** (folder name kept as `emptier-pwa`).

---

## 2-minute demo script (SAMPLE)

1. Open Simulator on the admin dashboard. Send SMS `U001 3` from `+254711000001`.
2. Map: unit U001 turns **red**.
3. Trips → **Suggest trips** → assign to Amina → confirm.
4. Care worker app: complete checklist, log compost kg, mark visited.
5. Payments: trip shows **owed** amount (300 + 100×stops KES).

Or: Trips → **Run demo mode** to script steps 1–3.

---

## Domain map (Pit Sidecar)

| Sidecar | Table |
|---|---|
| Shared toilet location | `sites` |
| Sidecar unit | `units` |
| Dip reading | `readings` |
| Visit needed | `jobs` |
| Care worker round | `trips` / `trip_stops` |
| Compost removed | `batches` |
| Per-trip pay | `payments` |
| Provenance | `events` (hash chain) |

## Repository layout

```
pitflow/
├── backend/           # FastAPI + Alembic
├── apps/dashboard/    # Admin map / trips / payments / simulator
├── apps/emptier-pwa/  # Care worker PWA
└── scripts/seed_demo.py
```

## Limitations

- Idea-stage hackathon prototype, not piloted.
- Treatment / compost rules are placeholder YAML.
- Live Africa's Talking numbers and M-Pesa payouts are out of scope (flagged off).

## License

MIT. See `LICENSE`.
