# PitFlow / Pit Sidecar

**From pit to product, verified — idea-stage prototype.**

Software for worm-and-charcoal sanitation units beside shared pit toilets in informal settlements (Nairobi demo). Local women care workers keep units healthy; caretakers report fill levels by SMS/USSD; supervisors see a colour map and pay for completed trips.

![Status](https://img.shields.io/badge/status-idea--stage-orange)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> **SAMPLE DATA ONLY.** Nothing in this repo is from a real pilot. Do not treat readings, payments, or map points as field truth.

---

## Stack

| Layer | Tools |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy 2, Alembic |
| Database | PostgreSQL (lon/lat floats; no PostGIS required) |
| Routing | Google OR-Tools |
| Messaging | Africa's Talking webhooks + local phone simulator |
| Payments | Ledger records; M-Pesa Daraja behind `DARAJA_PAYOUTS_ENABLED` (default off) |
| Admin UI | React + TypeScript + Vite + Tailwind + **shadcn/ui** + MapLibre + Framer Motion |
| Care worker | Mobile-first React PWA (`apps/emptier-pwa`) — large tap targets, low chrome |

## Live (Fly.io)

| App | URL |
|---|---|
| API | https://pitflow-api.fly.dev/health |
| Landing + admin | https://pitflow-web.fly.dev |
| Care worker | https://pitflow-care.fly.dev |

Redeploy from each app directory (`backend`, `apps/dashboard`, `apps/emptier-pwa`):

```powershell
fly deploy
```

Seed on the API machine after schema/seed changes:

```powershell
fly ssh console -a pitflow-api -C "python seed_demo.py"
```

## Apps (local)

| App | URL (dev) | Who |
|---|---|---|
| Landing + admin | http://localhost:5173 | Public landing; admin login → map / trips / compost / payments / simulator |
| Care worker | http://localhost:5174 | Field checklist for today’s trip |

SAMPLE logins after seed:

- Admin: `+254700000001` / `admin123`
- Care worker: `+254700000002` / `care123`
- Caretaker SMS phone: `+254711000001`

---

## Getting started

### 1. Database

Install **PostgreSQL**. Create a database and set `DATABASE_URL` in `backend/.env`.

```text
DATABASE_URL=postgresql+psycopg2://pitflow:pitflow@localhost:5432/pitflow
```

Sites/units store plain `lon` / `lat` floats (MapLibre). PostGIS is not required.

### 2. Backend

```powershell
cd pitflow\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item ..\.env.example .env
alembic upgrade head
python ..\scripts\seed_demo.py
uvicorn app.main:app --reload --port 8001
```

### 3. Admin dashboard (landing + ops)

```powershell
cd pitflow\apps\dashboard
Copy-Item .env.example .env
npm install
npm run dev
```

Open http://localhost:5173 — landing page first, then **Admin** → map.

### 4. Care worker app

```powershell
cd pitflow\apps\emptier-pwa
Copy-Item .env.example .env
npm install
npm run dev
```

Open http://localhost:5174 — labelled **Care worker** (folder name `emptier-pwa` kept on purpose).

---

## 2-minute field demo (SAMPLE)

1. Landing → Admin login → **Simulator**. SMS `U001 3` from `+254711000001`.
2. **Map**: pin turns red; open the unit drawer for readings.
3. **Trips** → Suggest trips → assign to Amina → confirm *(or Run demo mode)*.
4. Care worker app: complete checklist, log compost kg, **Mark visited**.
5. **Payments**: owed amount appears; Mark paid / Export CSV.

---

## Design notes (field-first)

- Admin uses moss/clay/sand colours, Fraunces + Figtree, shadcn buttons/cards, motion on landing and drawers.
- Care worker UI assumes sunlit yards and prepaid data: huge taps, Swahili micro-hints, photo hero, clear “next action”.
- Images live in each app’s `public/images/` (hero care worker, status board).

## Repository layout

```
pitflow/
├── backend/              # FastAPI + Alembic
├── apps/dashboard/       # Landing + admin (shadcn, MapLibre)
├── apps/emptier-pwa/     # Care worker checklist
└── scripts/seed_demo.py
```

## Limitations

- Idea-stage hackathon prototype, not piloted.
- Compost rules are placeholder YAML.
- Live Africa’s Talking numbers and M-Pesa payouts are out of scope (flagged off).

## License

MIT. See `LICENSE`.
