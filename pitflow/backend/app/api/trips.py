from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.deps import CurrentUser, require_roles
from app.db import get_session
from app.models import Job, Trip, TripStop, User
from app.schemas.api import (
    SuggestedStop,
    SuggestedTrip,
    TripAssign,
    TripOut,
    TripStopOut,
    TripSuggestOut,
    StopUpdate,
)
from app.services.dispatch import create_trip_from_jobs, suggest_trips

router = APIRouter()


def _trip_out(trip: Trip) -> TripOut:
    stops = []
    for s in trip.stops:
        unit = s.job.unit if s.job else None
        stops.append(
            TripStopOut(
                id=s.id,
                trip_id=s.trip_id,
                job_id=s.job_id,
                unit_id=unit.id if unit else None,
                unit_code=unit.code if unit else None,
                stop_order=s.stop_order,
                visited_at=s.visited_at,
                bedding_topped=s.bedding_topped,
                pad_bin_emptied=s.pad_bin_emptied,
                notes=s.notes,
            )
        )
    return TripOut(
        id=trip.id,
        care_worker_id=trip.care_worker_id,
        care_worker_name=trip.care_worker.full_name if trip.care_worker else None,
        scheduled_for=trip.scheduled_for,
        status=trip.status,
        payment_kes=trip.payment_kes,
        stops=stops,
        created_at=trip.created_at,
    )


@router.post("/dispatch/suggest", response_model=TripSuggestOut)
def dispatch_suggest(
    session: Session = Depends(get_session),
    _: User = Depends(require_roles("admin")),
):
    proposals = suggest_trips(session)
    trips = [
        SuggestedTrip(
            payment_kes=p["payment_kes"],
            stops=[SuggestedStop(**s) for s in p["stops"]],
        )
        for p in proposals
    ]
    return TripSuggestOut(trips=trips)


@router.post("/trips", response_model=TripOut)
def confirm_trip(
    body: TripAssign,
    session: Session = Depends(get_session),
    _: User = Depends(require_roles("admin")),
):
    try:
        trip = create_trip_from_jobs(
            session,
            care_worker_id=body.care_worker_id,
            scheduled_for=body.scheduled_for,
            job_ids=body.job_ids,
        )
        session.commit()
    except ValueError as exc:
        session.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    trip = (
        session.query(Trip)
        .options(
            joinedload(Trip.stops).joinedload(TripStop.job).joinedload(Job.unit),
            joinedload(Trip.care_worker),
        )
        .filter(Trip.id == trip.id)
        .one()
    )
    return _trip_out(trip)


@router.get("/trips", response_model=list[TripOut])
def list_trips(user: CurrentUser, session: Session = Depends(get_session)):
    q = session.query(Trip).options(
        joinedload(Trip.stops).joinedload(TripStop.job).joinedload(Job.unit),
        joinedload(Trip.care_worker),
    )
    if user.role == "care_worker":
        q = q.filter(Trip.care_worker_id == user.id)
    trips = q.order_by(Trip.scheduled_for.desc(), Trip.id.desc()).all()
    return [_trip_out(t) for t in trips]


@router.get("/trips/{trip_id}", response_model=TripOut)
def get_trip(trip_id: int, user: CurrentUser, session: Session = Depends(get_session)):
    trip = (
        session.query(Trip)
        .options(
            joinedload(Trip.stops).joinedload(TripStop.job).joinedload(Job.unit),
            joinedload(Trip.care_worker),
        )
        .filter(Trip.id == trip_id)
        .first()
    )
    if trip is None:
        raise HTTPException(404, detail="Trip not found")
    if user.role == "care_worker" and trip.care_worker_id != user.id:
        raise HTTPException(403, detail="Not your trip")
    return _trip_out(trip)


@router.patch("/trips/{trip_id}/stops/{stop_id}", response_model=TripStopOut)
def patch_stop(
    trip_id: int,
    stop_id: int,
    body: StopUpdate,
    user: CurrentUser,
    session: Session = Depends(get_session),
):
    from app.services.trips import update_stop

    trip = session.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(404, detail="Trip not found")
    if user.role == "care_worker" and trip.care_worker_id != user.id:
        raise HTTPException(403, detail="Not your trip")
    stop = (
        session.query(TripStop)
        .options(joinedload(TripStop.job))
        .filter(TripStop.id == stop_id, TripStop.trip_id == trip_id)
        .first()
    )
    if stop is None:
        raise HTTPException(404, detail="Stop not found")
    update_stop(
        session,
        stop,
        bedding_topped=body.bedding_topped,
        pad_bin_emptied=body.pad_bin_emptied,
        notes=body.notes,
        mark_visited=body.mark_visited,
    )
    session.commit()
    session.refresh(stop)
    unit = stop.job.unit if stop.job else None
    return TripStopOut(
        id=stop.id,
        trip_id=stop.trip_id,
        job_id=stop.job_id,
        unit_id=unit.id if unit else None,
        unit_code=unit.code if unit else None,
        stop_order=stop.stop_order,
        visited_at=stop.visited_at,
        bedding_topped=stop.bedding_topped,
        pad_bin_emptied=stop.pad_bin_emptied,
        notes=stop.notes,
    )


@router.get("/care-workers")
def list_care_workers(
    session: Session = Depends(get_session),
    _: User = Depends(require_roles("admin")),
):
    workers = (
        session.query(User)
        .filter(User.role == "care_worker")
        .order_by(User.full_name)
        .all()
    )
    return [
        {"id": w.id, "full_name": w.full_name, "phone": w.phone} for w in workers
    ]
