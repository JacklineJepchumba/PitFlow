"""Demo mode: scripted SAMPLE flow for hackathon walkthroughs."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import require_roles
from app.db import get_session
from app.models import Caretaker, Unit, User
from app.services.dispatch import create_trip_from_jobs, suggest_trips
from app.services.ussd import handle_sms

router = APIRouter(prefix="/demo")


@router.post("/run")
def run_demo(
    session: Session = Depends(get_session),
    _: User = Depends(require_roles("admin")),
):
    """Three SMS readings → red unit → suggest trip → note for care worker completion."""
    caretaker = session.query(Caretaker).order_by(Caretaker.id).first()
    worker = (
        session.query(User).filter(User.role == "care_worker").order_by(User.id).first()
    )
    units = session.query(Unit).filter(Unit.active.is_(True)).order_by(Unit.code).limit(3).all()
    if not caretaker or not worker or len(units) < 3:
        return {"ok": False, "error": "Seed SAMPLE DATA first (python ../scripts/seed_demo.py)"}

    replies = []
    # Push three units toward full (level 3)
    for unit in units:
        reply = handle_sms(
            session,
            sender=caretaker.phone,
            text=f"{unit.code} 3",
        )
        replies.append(reply)

    proposals = suggest_trips(session)
    created_trip = None
    if proposals and proposals[0]["stops"]:
        job_ids = [s["job_id"] for s in proposals[0]["stops"][:3]]
        trip = create_trip_from_jobs(
            session,
            care_worker_id=worker.id,
            scheduled_for=date.today(),
            job_ids=job_ids,
        )
        session.commit()
        created_trip = {
            "trip_id": trip.id,
            "care_worker_id": worker.id,
            "payment_kes": trip.payment_kes,
            "stops": len(job_ids),
        }
    else:
        session.commit()

    return {
        "ok": True,
        "sample": True,
        "note": "Idea-stage demo — SAMPLE DATA only. Care worker should finish trip in the PWA.",
        "sms_replies": replies,
        "suggested_trips": len(proposals),
        "assigned_trip": created_trip,
    }
