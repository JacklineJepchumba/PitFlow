from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import CurrentUser
from app.db import get_session
from app.models import Batch, Trip, TripStop
from app.schemas.api import BatchCreate, BatchOut
from app.services.ledger import check_batch_compliance
from app.services.trips import log_batch

router = APIRouter()


@router.get("/batches", response_model=list[BatchOut])
def list_batches(user: CurrentUser, session: Session = Depends(get_session)):
    rows = session.query(Batch).order_by(Batch.removed_at.desc()).limit(200).all()
    return [
        BatchOut(
            id=b.id,
            unit_id=b.unit_id,
            trip_stop_id=b.trip_stop_id,
            weight_kg=b.weight_kg,
            removed_at=b.removed_at,
            destination=b.destination,
            tested=b.tested,
            notes=b.notes,
            compliance_flag=check_batch_compliance(b),
        )
        for b in rows
    ]


@router.post("/batches", response_model=BatchOut)
def create_batch(
    body: BatchCreate,
    user: CurrentUser,
    session: Session = Depends(get_session),
):
    stop = session.get(TripStop, body.trip_stop_id)
    if stop is None:
        raise HTTPException(404, detail="trip_stop not found")
    trip = session.get(Trip, stop.trip_id)
    if user.role == "care_worker" and (
        trip is None or trip.care_worker_id != user.id
    ):
        raise HTTPException(403, detail="Not your trip")
    try:
        batch = log_batch(
            session,
            unit_id=body.unit_id,
            trip_stop_id=body.trip_stop_id,
            weight_kg=body.weight_kg,
            destination=body.destination,
            notes=body.notes,
        )
        session.commit()
    except ValueError as exc:
        session.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return BatchOut(
        id=batch.id,
        unit_id=batch.unit_id,
        trip_stop_id=batch.trip_stop_id,
        weight_kg=batch.weight_kg,
        removed_at=batch.removed_at,
        destination=batch.destination,
        tested=batch.tested,
        notes=batch.notes,
        compliance_flag=check_batch_compliance(batch),
    )
