from fastapi import APIRouter, Depends, Form, Response
from sqlalchemy.orm import Session

from app.db import get_session
from app.services.ussd import handle_sms, handle_ussd

router = APIRouter()


@router.post("/sms")
def africa_talking_sms(
    session: Session = Depends(get_session),
    from_: str = Form(alias="from"),
    to: str = Form(""),
    text: str = Form(""),
):
    reply = handle_sms(session, sender=from_, text=text)
    return Response(content=reply, media_type="text/plain")


@router.post("/ussd")
def africa_talking_ussd(
    session: Session = Depends(get_session),
    sessionId: str = Form(""),
    serviceCode: str = Form(""),
    phoneNumber: str = Form(""),
    text: str = Form(""),
):
    reply = handle_ussd(session, phone_number=phoneNumber, text=text)
    return Response(content=reply, media_type="text/plain")


@router.post("/simulate/sms")
def simulate_sms(
    session: Session = Depends(get_session),
    from_: str = Form(alias="from"),
    text: str = Form(""),
):
    reply = handle_sms(session, sender=from_, text=text)
    return {"reply": reply, "sample": True}


@router.post("/simulate/ussd")
def simulate_ussd(
    session: Session = Depends(get_session),
    phoneNumber: str = Form(""),
    text: str = Form(""),
):
    reply = handle_ussd(session, phone_number=phoneNumber, text=text)
    return {"reply": reply, "sample": True}
