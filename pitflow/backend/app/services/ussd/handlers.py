"""Africa's Talking SMS/USSD handlers + local simulator entry points."""
from __future__ import annotations

import re

from sqlalchemy.orm import Session

from app.models import Caretaker, Unit
from app.services.readings import save_reading

SMS_PATTERN = re.compile(
    r"^\s*([A-Za-z]?\d{1,4}|[A-Za-z]{1,3}\d{1,4})\s+([123])\s*$"
)


def normalize_phone(phone: str) -> str:
    digits = re.sub(r"[^\d+]", "", phone or "")
    if digits.startswith("0") and len(digits) == 10:
        return "+254" + digits[1:]
    if digits.startswith("254") and not digits.startswith("+"):
        return "+" + digits
    return digits


def parse_sms_text(text: str) -> tuple[str, int] | None:
    if not text:
        return None
    match = SMS_PATTERN.match(text.strip())
    if not match:
        return None
    code = match.group(1).upper()
    if not code.startswith("U"):
        code = f"U{code}" if code.isdigit() else code
    return code, int(match.group(2))


def handle_sms(session: Session, *, sender: str, text: str) -> str:
    phone = normalize_phone(sender)
    caretaker = session.query(Caretaker).filter(Caretaker.phone == phone).first()
    if caretaker is None:
        return "Unknown phone. Ask your supervisor to register you. (SAMPLE)"

    parsed = parse_sms_text(text)
    if parsed is None:
        return "Send like: U014 2  (unit code, level 1-3). (SAMPLE)"

    code, level = parsed
    unit = session.query(Unit).filter(Unit.code == code, Unit.active.is_(True)).first()
    if unit is None:
        return f"Unit {code} not found. (SAMPLE)"

    save_reading(
        session,
        unit=unit,
        level=level,
        source="sms",
        caretaker_id=caretaker.id,
        raw_message=text,
    )
    session.commit()
    return f"Thanks. {code} marked level {level} ({unit.status}). (SAMPLE)"


def handle_ussd(
    session: Session,
    *,
    phone_number: str,
    text: str,
) -> str:
    """Return Africa's Talking plain-text response (CON / END)."""
    phone = normalize_phone(phone_number)
    caretaker = session.query(Caretaker).filter(Caretaker.phone == phone).first()
    parts = [p for p in (text or "").split("*") if p != ""]

    if caretaker is None:
        return "END Unknown phone. Ask your supervisor to register you. (SAMPLE)"

    if not parts:
        return (
            "CON Pit Sidecar (SAMPLE)\n"
            "1. Report level\n"
            "2. Report problem"
        )

    if parts[0] == "1":
        if len(parts) == 1:
            return "CON Enter unit code (e.g. U014):"
        if len(parts) == 2:
            return "CON Enter level 1 (low), 2 (medium) or 3 (full):"
        code = parts[1].strip().upper()
        if not code.startswith("U"):
            code = f"U{code}" if code.isdigit() else code
        try:
            level = int(parts[2])
        except ValueError:
            return "END Level must be 1, 2 or 3. (SAMPLE)"
        if level not in (1, 2, 3):
            return "END Level must be 1, 2 or 3. (SAMPLE)"
        unit = (
            session.query(Unit)
            .filter(Unit.code == code, Unit.active.is_(True))
            .first()
        )
        if unit is None:
            return f"END Unit {code} not found. (SAMPLE)"
        save_reading(
            session,
            unit=unit,
            level=level,
            source="ussd",
            caretaker_id=caretaker.id,
            raw_message=text,
        )
        session.commit()
        return f"END Thanks. {code} is {unit.status}. (SAMPLE)"

    if parts[0] == "2":
        if len(parts) == 1:
            return "CON Briefly describe the problem:"
        note = parts[1][:200]
        return f"END Problem noted for {caretaker.name}: {note}. Supervisor will follow up. (SAMPLE)"

    return "END Invalid choice. (SAMPLE)"
