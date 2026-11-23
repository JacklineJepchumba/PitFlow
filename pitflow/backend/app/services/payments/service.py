"""Trip payments. M-Pesa Daraja sandbox gated by feature flag (off by default)."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Payment, Trip
from app.services.eventlog.chain import append_event


def create_owed_payment(session: Session, trip: Trip) -> Payment:
    existing = session.query(Payment).filter(Payment.trip_id == trip.id).first()
    if existing:
        return existing
    payment = Payment(
        trip_id=trip.id,
        amount_kes=trip.payment_kes,
        status="owed",
    )
    session.add(payment)
    session.flush()
    append_event(
        session,
        "payment.owed",
        {
            "payment_id": payment.id,
            "trip_id": trip.id,
            "amount_kes": payment.amount_kes,
            "sample": True,
        },
    )
    if settings.daraja_payouts_enabled:
        # Sandbox hook — never auto-send without explicit flag + keys
        payment.reference = "DARAJA-SANDBOX-PENDING"
    return payment


def mark_payment_paid(
    session: Session, payment: Payment, reference: str | None = None
) -> Payment:
    payment.status = "paid"
    payment.paid_at = datetime.now(timezone.utc)
    payment.reference = reference or payment.reference or "MANUAL-SAMPLE"
    if payment.trip:
        payment.trip.status = "paid"
    append_event(
        session,
        "payment.paid",
        {
            "payment_id": payment.id,
            "trip_id": payment.trip_id,
            "reference": payment.reference,
            "sample": True,
        },
    )
    return payment
