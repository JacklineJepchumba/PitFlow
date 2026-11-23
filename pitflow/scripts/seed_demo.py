"""Idempotent SAMPLE DATA seed for Pit Sidecar / PitFlow demo.

All records are simulated. Re-running updates passwords and refreshes
readings for the last 30 days without duplicating sites/units/users.
"""
from __future__ import annotations

import random
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import text

# Allow local `python ../scripts/seed_demo.py` and Fly `python seed_demo.py`
_HERE = Path(__file__).resolve().parent
_CANDIDATES = [
    _HERE.parent / "backend",  # repo: pitflow/scripts → pitflow/backend
    _HERE,  # container: /app/seed_demo.py next to app/
]
for _path in _CANDIDATES:
    if (_path / "app").is_dir():
        sys.path.insert(0, str(_path))
        break
else:
    sys.path.insert(0, str(_HERE.parent / "backend"))

from app.db import SessionLocal, engine  # noqa: E402
from app.models import Caretaker, Reading, Site, Unit, User  # noqa: E402
from app.security import hash_password  # noqa: E402
from app.services.readings import save_reading  # noqa: E402

SAMPLE_NOTE = "SAMPLE DATA — not from a real pilot"

SITES = [
    ("Kibera Shared Block A", "Kibera", 36.7884, -1.3133),
    ("Mathare Lane 4", "Mathare", 36.8586, -1.2594),
    ("Korogocho Yard", "Korogocho", 36.8900, -1.2500),
    ("Mukuru kwa Njenga Edge", "Mukuru", 36.8700, -1.3100),
]

# 12 units: 3 per site
UNIT_CODES = [f"U{i:03d}" for i in range(1, 13)]

USERS = [
    ("Admin Demo", "+254700000001", "admin", "admin123"),
    ("Amina Care", "+254700000002", "care_worker", "care123"),
    ("Faith Care", "+254700000003", "care_worker", "care123"),
]

CARETAKERS = [
    ("Grace Wanjiku", "+254711000001", 0),
    ("Mary Achieng", "+254711000002", 1),
    ("Esther Njeri", "+254711000003", 2),
]


def upsert_users(session) -> dict[str, User]:
    by_phone = {}
    for name, phone, role, password in USERS:
        user = session.query(User).filter(User.phone == phone).first()
        if user is None:
            user = User(
                full_name=name,
                phone=phone,
                role=role,
                password_hash=hash_password(password),
            )
            session.add(user)
        else:
            user.full_name = name
            user.role = role
            user.password_hash = hash_password(password)
        by_phone[phone] = user
    session.flush()
    return by_phone


def upsert_sites_units(session) -> list[Unit]:
    sites = []
    for name, area, lon, lat in SITES:
        site = session.query(Site).filter(Site.name == name).first()
        if site is None:
            site = Site(
                name=name,
                area=area,
                lon=lon, lat=lat,
                notes=SAMPLE_NOTE,
            )
            session.add(site)
            session.flush()
        sites.append(site)

    units = []
    for idx, code in enumerate(UNIT_CODES):
        site = sites[idx // 3]
        unit = session.query(Unit).filter(Unit.code == code).first()
        if unit is None:
            unit = Unit(
                code=code,
                site_id=site.id,
                capacity_users=10,
                design="wide" if idx % 2 == 0 else "tall",
                status="green",
                installed_on=date.today() - timedelta(days=90 + idx),
                active=True,
            )
            session.add(unit)
        units.append(unit)
    session.flush()
    return units


def upsert_caretakers(session, sites: list[Site]) -> list[Caretaker]:
    out = []
    for name, phone, site_idx in CARETAKERS:
        ct = session.query(Caretaker).filter(Caretaker.phone == phone).first()
        if ct is None:
            ct = Caretaker(name=name, phone=phone, site_id=sites[site_idx].id)
            session.add(ct)
        out.append(ct)
    session.flush()
    return out


def seed_readings(session, units: list[Unit], caretakers: list[Caretaker]) -> None:
    """Add ~30 days of SAMPLE readings if fewer than 50 exist."""
    count = session.query(Reading).count()
    if count >= 50:
        return
    rng = random.Random(42)
    now = datetime.now(timezone.utc)
    for day in range(30, 0, -1):
        for unit in units:
            if rng.random() < 0.35:
                continue
            level = rng.choices([1, 2, 3], weights=[0.55, 0.3, 0.15])[0]
            ct = caretakers[unit.site_id % len(caretakers)]
            # Bypass save_reading job spam for historical bulk: insert directly then
            # apply latest status via a final save_reading pass
            reading = Reading(
                unit_id=unit.id,
                caretaker_id=ct.id,
                level=level,
                source="manual",
                raw_message=f"{unit.code} {level} #SAMPLE",
                created_at=now - timedelta(days=day, hours=rng.randint(0, 10)),
            )
            session.add(reading)
    session.flush()
    # Apply latest reading status; open jobs for amber/red via save_reading once
    for unit in units:
        latest = (
            session.query(Reading)
            .filter(Reading.unit_id == unit.id)
            .order_by(Reading.created_at.desc())
            .first()
        )
        if latest and latest.level in (2, 3):
            save_reading(
                session,
                unit=unit,
                level=latest.level,
                source="manual",
                caretaker_id=latest.caretaker_id,
                raw_message="seed-status-sync #SAMPLE",
            )
        elif latest:
            unit.status = "green"
            unit.last_reading_at = latest.created_at


def main() -> None:
    print("PitFlow seed — SAMPLE DATA only")
    session = SessionLocal()
    try:
        upsert_users(session)
        units = upsert_sites_units(session)
        sites = session.query(Site).order_by(Site.id).all()
        caretakers = upsert_caretakers(session, sites)
        seed_readings(session, units, caretakers)
        session.commit()
        print(
            f"OK: {len(sites)} sites, {len(units)} units, "
            f"{len(caretakers)} caretakers, {session.query(User).count()} users, "
            f"{session.query(Reading).count()} readings"
        )
        print("Login (SAMPLE): admin +254700000001 / admin123")
        print("Care worker: +254700000002 / care123")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
        engine.dispose()


if __name__ == "__main__":
    main()

