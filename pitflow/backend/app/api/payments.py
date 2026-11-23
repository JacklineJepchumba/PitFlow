import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.deps import CurrentUser, require_roles
from app.db import get_session
from app.models import Payment, User
from app.schemas.api import PaymentMarkPaid, PaymentOut
from app.services.payments import mark_payment_paid

router = APIRouter()


@router.get("/payments", response_model=list[PaymentOut])
def list_payments(
    session: Session = Depends(get_session),
    _: User = Depends(require_roles("admin")),
):
    return session.query(Payment).order_by(Payment.id.desc()).all()


@router.post("/payments/{payment_id}/mark-paid", response_model=PaymentOut)
def pay(
    payment_id: int,
    body: PaymentMarkPaid,
    session: Session = Depends(get_session),
    _: User = Depends(require_roles("admin")),
):
    payment = session.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(404, detail="Payment not found")
    mark_payment_paid(session, payment, reference=body.reference)
    session.commit()
    session.refresh(payment)
    return payment


@router.get("/payments/export")
def export_csv(
    session: Session = Depends(get_session),
    _: User = Depends(require_roles("admin")),
):
    rows = session.query(Payment).order_by(Payment.id).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "trip_id", "amount_kes", "status", "paid_at", "reference"])
    for p in rows:
        writer.writerow(
            [p.id, p.trip_id, p.amount_kes, p.status, p.paid_at, p.reference]
        )
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=payments-sample.csv"},
    )
