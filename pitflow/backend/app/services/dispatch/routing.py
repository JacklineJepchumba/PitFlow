"""Cluster open jobs and order stops with OR-Tools. SAMPLE DATA only."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from math import asin, cos, radians, sin, sqrt
from typing import Any

from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload

from app.models import Job, Trip, TripStop, Unit, User
from app.services.dispatch.config import (
    BASE_PAYMENT_KES,
    CLUSTER_RADIUS_M,
    MAX_STOPS_PER_TRIP,
    OVERDUE_DAYS,
    PER_STOP_KES,
)
from app.services.eventlog.chain import append_event

STATUS_PRIORITY = {"red": 0, "amber": 1, "green": 2}


def haversine_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    r = 6371000.0
    p1, p2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dl = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(p1) * cos(p2) * sin(dl / 2) ** 2
    return 2 * r * asin(sqrt(a))


def _coords(session: Session, unit_id: int) -> tuple[float, float]:
    row = session.execute(
        text(
            "SELECT ST_X(location::geometry) AS lon, ST_Y(location::geometry) AS lat "
            "FROM sites s JOIN units u ON u.site_id = s.id WHERE u.id = :uid"
        ),
        {"uid": unit_id},
    ).mappings().first()
    if not row:
        raise ValueError(f"No coordinates for unit {unit_id}")
    return float(row["lon"]), float(row["lat"])


def open_jobs_needing_visit(session: Session) -> list[Job]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=OVERDUE_DAYS)
    jobs = (
        session.query(Job)
        .options(joinedload(Job.unit).joinedload(Unit.site))
        .join(Unit)
        .filter(Job.status == "open", Unit.active.is_(True))
        .all()
    )
    # Also ensure overdue units without open jobs get one (caller may seed these)
    overdue_units = (
        session.query(Unit)
        .filter(
            Unit.active.is_(True),
            (Unit.last_visited_at.is_(None)) | (Unit.last_visited_at < cutoff),
            Unit.status == "green",
        )
        .all()
    )
    for unit in overdue_units:
        existing = (
            session.query(Job)
            .filter(Job.unit_id == unit.id, Job.status == "open")
            .first()
        )
        if existing is None:
            job = Job(unit_id=unit.id, reason="overdue", status="open")
            job.unit = unit
            session.add(job)
            session.flush()
            jobs.append(job)
    return jobs


def _job_point(session: Session, job: Job) -> dict[str, Any]:
    lon, lat = _coords(session, job.unit_id)
    return {
        "job": job,
        "unit": job.unit,
        "lon": lon,
        "lat": lat,
        "priority": STATUS_PRIORITY.get(job.unit.status, 9),
    }


def cluster_jobs(points: list[dict[str, Any]]) -> list[list[dict[str, Any]]]:
    remaining = sorted(points, key=lambda p: (p["priority"], p["unit"].code))
    clusters: list[list[dict[str, Any]]] = []
    while remaining:
        seed = remaining.pop(0)
        cluster = [seed]
        still = []
        for p in remaining:
            if len(cluster) >= MAX_STOPS_PER_TRIP:
                still.append(p)
                continue
            d = haversine_m(seed["lon"], seed["lat"], p["lon"], p["lat"])
            if d <= CLUSTER_RADIUS_M:
                cluster.append(p)
            else:
                still.append(p)
        # Also pull points within radius of any member (greedy expansion)
        changed = True
        while changed and len(cluster) < MAX_STOPS_PER_TRIP:
            changed = False
            next_still = []
            for p in still:
                if len(cluster) >= MAX_STOPS_PER_TRIP:
                    next_still.append(p)
                    continue
                if any(
                    haversine_m(m["lon"], m["lat"], p["lon"], p["lat"]) <= CLUSTER_RADIUS_M
                    for m in cluster
                ):
                    cluster.append(p)
                    changed = True
                else:
                    next_still.append(p)
            still = next_still
        remaining = still
        clusters.append(cluster)
    return clusters


def order_stops(points: list[dict[str, Any]]) -> list[dict[str, Any]]:
    n = len(points)
    if n <= 1:
        return points
    dist = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                dist[i][j] = int(
                    haversine_m(
                        points[i]["lon"],
                        points[i]["lat"],
                        points[j]["lon"],
                        points[j]["lat"],
                    )
                )
    manager = pywrapcp.RoutingIndexManager(n, 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index: int, to_index: int) -> int:
        a = manager.IndexToNode(from_index)
        b = manager.IndexToNode(to_index)
        return dist[a][b]

    transit = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit)
    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    solution = routing.SolveWithParameters(params)
    if solution is None:
        return points
    ordered = []
    index = routing.Start(0)
    while not routing.IsEnd(index):
        ordered.append(points[manager.IndexToNode(index)])
        index = solution.Value(routing.NextVar(index))
    return ordered


def payment_for_stops(n: int) -> int:
    return BASE_PAYMENT_KES + PER_STOP_KES * n


def suggest_trips(session: Session) -> list[dict[str, Any]]:
    jobs = open_jobs_needing_visit(session)
    if not jobs:
        return []
    points = [_job_point(session, j) for j in jobs]
    clusters = cluster_jobs(points)
    proposals = []
    for cluster in clusters:
        ordered = order_stops(cluster)
        stops = []
        for i, p in enumerate(ordered, start=1):
            stops.append(
                {
                    "job_id": p["job"].id,
                    "unit_id": p["unit"].id,
                    "unit_code": p["unit"].code,
                    "reason": p["job"].reason,
                    "status": p["unit"].status,
                    "lon": p["lon"],
                    "lat": p["lat"],
                    "stop_order": i,
                }
            )
        proposals.append(
            {"payment_kes": payment_for_stops(len(stops)), "stops": stops}
        )
    return proposals


def create_trip_from_jobs(
    session: Session,
    *,
    care_worker_id: int,
    scheduled_for: date,
    job_ids: list[int],
) -> Trip:
    worker = session.get(User, care_worker_id)
    if worker is None or worker.role != "care_worker":
        raise ValueError("care_worker_id must be a care_worker user")

    jobs = (
        session.query(Job)
        .options(joinedload(Job.unit))
        .filter(Job.id.in_(job_ids), Job.status == "open")
        .all()
    )
    if len(jobs) != len(set(job_ids)):
        raise ValueError("One or more jobs are missing or not open")

    points = [_job_point(session, j) for j in jobs]
    ordered = order_stops(points)
    trip = Trip(
        care_worker_id=care_worker_id,
        scheduled_for=scheduled_for,
        status="planned",
        payment_kes=payment_for_stops(len(ordered)),
    )
    session.add(trip)
    session.flush()
    for i, p in enumerate(ordered, start=1):
        stop = TripStop(
            trip_id=trip.id,
            job_id=p["job"].id,
            stop_order=i,
        )
        session.add(stop)
        p["job"].status = "assigned"
    session.flush()
    append_event(
        session,
        "trip.created",
        {
            "trip_id": trip.id,
            "care_worker_id": care_worker_id,
            "job_ids": job_ids,
            "payment_kes": trip.payment_kes,
            "sample": True,
        },
    )
    return trip
