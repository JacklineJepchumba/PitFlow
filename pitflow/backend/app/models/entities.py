from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'care_worker')", name="ck_users_role"),
    )

    trips: Mapped[list[Trip]] = relationship(back_populates="care_worker")


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    area: Mapped[str] = mapped_column(String(120), nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    units: Mapped[list[Unit]] = relationship(back_populates="site")
    caretakers: Mapped[list[Caretaker]] = relationship(back_populates="site")


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    site_id: Mapped[int] = mapped_column(ForeignKey("sites.id"), nullable=False)
    capacity_users: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    design: Mapped[str] = mapped_column(String(16), default="wide", nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="green", nullable=False)
    last_reading_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_visited_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    installed_on: Mapped[Optional[date]] = mapped_column(Date)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        CheckConstraint("design IN ('wide', 'tall')", name="ck_units_design"),
        CheckConstraint("status IN ('green', 'amber', 'red')", name="ck_units_status"),
    )

    site: Mapped[Site] = relationship(back_populates="units")
    readings: Mapped[list[Reading]] = relationship(back_populates="unit")
    jobs: Mapped[list[Job]] = relationship(back_populates="unit")
    batches: Mapped[list[Batch]] = relationship(back_populates="unit")


class Caretaker(Base):
    __tablename__ = "caretakers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    site_id: Mapped[int] = mapped_column(ForeignKey("sites.id"), nullable=False)

    site: Mapped[Site] = relationship(back_populates="caretakers")
    readings: Mapped[list[Reading]] = relationship(back_populates="caretaker")


class Reading(Base):
    __tablename__ = "readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False)
    caretaker_id: Mapped[Optional[int]] = mapped_column(ForeignKey("caretakers.id"))
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    source: Mapped[str] = mapped_column(String(16), nullable=False)
    raw_message: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint("level IN (1, 2, 3)", name="ck_readings_level"),
        CheckConstraint(
            "source IN ('sms', 'ussd', 'manual')", name="ck_readings_source"
        ),
    )

    unit: Mapped[Unit] = relationship(back_populates="readings")
    caretaker: Mapped[Optional[Caretaker]] = relationship(back_populates="readings")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False)
    reason: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="open", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint("reason IN ('amber', 'red', 'overdue')", name="ck_jobs_reason"),
        CheckConstraint(
            "status IN ('open', 'assigned', 'done')", name="ck_jobs_status"
        ),
    )

    unit: Mapped[Unit] = relationship(back_populates="jobs")
    trip_stops: Mapped[list[TripStop]] = relationship(back_populates="job")


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    care_worker_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    scheduled_for: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="planned", nullable=False)
    payment_kes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('planned', 'in_progress', 'done', 'paid')",
            name="ck_trips_status",
        ),
    )

    care_worker: Mapped[Optional[User]] = relationship(back_populates="trips")
    stops: Mapped[list[TripStop]] = relationship(
        back_populates="trip", order_by="TripStop.stop_order"
    )
    payment: Mapped[Optional[Payment]] = relationship(back_populates="trip", uselist=False)


class TripStop(Base):
    __tablename__ = "trip_stops"
    __table_args__ = (UniqueConstraint("trip_id", "job_id", name="uq_trip_job"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), nullable=False)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), nullable=False)
    stop_order: Mapped[int] = mapped_column(Integer, nullable=False)
    visited_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    bedding_topped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pad_bin_emptied: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    trip: Mapped[Trip] = relationship(back_populates="stops")
    job: Mapped[Job] = relationship(back_populates="trip_stops")
    batches: Mapped[list[Batch]] = relationship(back_populates="trip_stop")


class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False)
    trip_stop_id: Mapped[Optional[int]] = mapped_column(ForeignKey("trip_stops.id"))
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    removed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    destination: Mapped[Optional[str]] = mapped_column(String(120))
    tested: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    unit: Mapped[Unit] = relationship(back_populates="batches")
    trip_stop: Mapped[Optional[TripStop]] = relationship(back_populates="batches")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), unique=True, nullable=False)
    amount_kes: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="owed", nullable=False)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    reference: Mapped[Optional[str]] = mapped_column(String(120))

    __table_args__ = (
        CheckConstraint("status IN ('owed', 'paid')", name="ck_payments_status"),
    )

    trip: Mapped[Trip] = relationship(back_populates="payment")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kind: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    prev_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
