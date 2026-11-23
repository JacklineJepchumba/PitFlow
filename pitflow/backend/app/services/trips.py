"""Care worker trip completion helpers."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session, joinedload

from app.models import Batch, Job, Trip, TripStop, Unit
from app.services.eventlog.chain import append_event
from app.services.payments import create_owed_payment


def update_stop(
    session: Session,
    stop: TripStop,
    *,
    bedding_topped: bool | None = None,
    pad_bin_emptied: bool | None = None,
    notes: str | None = None,
    mark_visited: bool = False,
) -> TripStop:
    if bedding_topped is not None:
        stop.bedding_topped = bedding_topped
    if pad_bin_emptied is not None:
        stop.pad_bin_emptied = pad_bin_emptied
    if notes is not None:
        stop.notes = notes
    if mark_visited:
        stop.visited_at = datetime.now(timezone.utc)
        stop.job.status = "done"
        unit = session.get(Unit, stop.job.unit_id)
        if unit:
            unit.last_visited_at = stop.visited_at
            unit.status = "green"
        trip = session.get(Trip, stop.trip_id)
        if trip and trip.status == "planned":
            trip.status = "in_progress"
        append_event(
            session,
            "stop.visited",
            {"trip_stop_id": stop.id, "job_id": stop.job_id, "sample": True},
        )
        _maybe_finish_trip(session, stop.trip_id)
    return stop


def log_batch(
    session: Session,
    *,
    unit_id: int,
    trip_stop_id: int,
    weight_kg: float,
    destination: str | None,
    notes: str | None,
) -> Batch:
    stop = session.get(TripStop, trip_stop_id)
    if stop is None:
        raise ValueError("trip_stop not found")
    batch = Batch(
        unit_id=unit_id,
        trip_stop_id=trip_stop_id,
        weight_kg=weight_kg,
        destination=destination,
        tested=False,
        notes=notes,
    )
    session.add(batch)
    session.flush()
    append_event(
        session,
        "batch.created",
        {
            "batch_id": batch.id,
            "unit_id": unit_id,
            "weight_kg": weight_kg,
            "sample": True,
        },
    )
    return batch


def _maybe_finish_trip(session: Session, trip_id: int) -> None:
    trip = (
        session.query(Trip)
        .options(joinedload(Trip.stops))
        .filter(Trip.id == trip_id)
        .first()
    )
    if trip is None:
        return
    if trip.stops and all(s.visited_at is not None for s in trip.stops):
        trip.status = "done"
        create_owed_payment(session, trip)
        append_event(
            session,
            "trip.done",
            {"trip_id": trip.id, "payment_kes": trip.payment_kes, "sample": True},
        )
