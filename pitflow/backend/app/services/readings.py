"""Reading → unit status → open job → event. SAMPLE DATA path only."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Job, Reading, Unit
from app.services.eventlog.chain import append_event

LEVEL_STATUS = {1: "green", 2: "amber", 3: "red"}


def save_reading(
    session: Session,
    *,
    unit: Unit,
    level: int,
    source: str,
    caretaker_id: int | None = None,
    raw_message: str | None = None,
) -> Reading:
    if level not in (1, 2, 3):
        raise ValueError("level must be 1, 2 or 3")

    now = datetime.now(timezone.utc)
    reading = Reading(
        unit_id=unit.id,
        caretaker_id=caretaker_id,
        level=level,
        source=source,
        raw_message=raw_message,
        created_at=now,
    )
    session.add(reading)

    status = LEVEL_STATUS[level]
    unit.status = status
    unit.last_reading_at = now

    job = None
    if status in ("amber", "red"):
        open_job = (
            session.query(Job)
            .filter(Job.unit_id == unit.id, Job.status == "open")
            .first()
        )
        if open_job is None:
            job = Job(unit_id=unit.id, reason=status, status="open", created_at=now)
            session.add(job)

    session.flush()
    append_event(
        session,
        "reading.recorded",
        {
            "unit_id": unit.id,
            "unit_code": unit.code,
            "level": level,
            "status": status,
            "source": source,
            "job_id": job.id if job else None,
            "sample": True,
        },
    )
    return reading
