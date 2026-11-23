from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    phone: str
    password: str


class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    user_id: int


class SiteOut(BaseModel):
    id: int
    name: str
    area: str
    lon: float
    lat: float
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class UnitOut(BaseModel):
    id: int
    code: str
    site_id: int
    site_name: Optional[str] = None
    area: Optional[str] = None
    status: str
    design: str
    capacity_users: int
    lon: Optional[float] = None
    lat: Optional[float] = None
    last_reading_at: Optional[datetime] = None
    last_visited_at: Optional[datetime] = None
    active: bool

    model_config = {"from_attributes": True}


class ReadingOut(BaseModel):
    id: int
    unit_id: int
    caretaker_id: Optional[int] = None
    level: int
    source: str
    raw_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TripStopOut(BaseModel):
    id: int
    trip_id: int
    job_id: int
    unit_id: Optional[int] = None
    unit_code: Optional[str] = None
    stop_order: int
    visited_at: Optional[datetime] = None
    bedding_topped: bool
    pad_bin_emptied: bool
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class TripOut(BaseModel):
    id: int
    care_worker_id: Optional[int] = None
    care_worker_name: Optional[str] = None
    scheduled_for: date
    status: str
    payment_kes: int
    stops: list[TripStopOut] = Field(default_factory=list)
    created_at: datetime

    model_config = {"from_attributes": True}


class SuggestedStop(BaseModel):
    job_id: int
    unit_id: int
    unit_code: str
    reason: str
    status: str
    lon: float
    lat: float
    stop_order: int


class SuggestedTrip(BaseModel):
    payment_kes: int
    stops: list[SuggestedStop]


class TripSuggestOut(BaseModel):
    trips: list[SuggestedTrip]
    note: str = "SAMPLE DATA — proposed only; not written until POST /trips"


class TripAssign(BaseModel):
    care_worker_id: int
    scheduled_for: date
    job_ids: list[int]


class StopUpdate(BaseModel):
    bedding_topped: Optional[bool] = None
    pad_bin_emptied: Optional[bool] = None
    notes: Optional[str] = None
    mark_visited: bool = False


class BatchCreate(BaseModel):
    unit_id: int
    trip_stop_id: int
    weight_kg: float
    destination: Optional[str] = "community drying bed (SAMPLE)"
    notes: Optional[str] = None


class BatchOut(BaseModel):
    id: int
    unit_id: int
    trip_stop_id: Optional[int] = None
    weight_kg: float
    removed_at: datetime
    destination: Optional[str] = None
    tested: bool
    notes: Optional[str] = None
    compliance_flag: Optional[str] = None

    model_config = {"from_attributes": True}


class PaymentOut(BaseModel):
    id: int
    trip_id: int
    amount_kes: int
    status: str
    paid_at: Optional[datetime] = None
    reference: Optional[str] = None

    model_config = {"from_attributes": True}


class PaymentMarkPaid(BaseModel):
    reference: Optional[str] = "MANUAL-SAMPLE"
