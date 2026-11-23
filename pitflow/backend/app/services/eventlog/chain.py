"""Tamper-evident, hash-chained event log.

In-memory EventLog kept for unit tests. PersistedEventLog writes to Postgres.
"""
from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone

from sqlalchemy.orm import Session

GENESIS_HASH = "0" * 64


def compute_hash(prev_hash: str, event_type: str, payload: dict, ts: float) -> str:
    body = json.dumps(
        {"prev": prev_hash, "type": event_type, "payload": payload, "ts": ts},
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(body.encode()).hexdigest()


@dataclass
class Event:
    index: int
    event_type: str
    payload: dict
    ts: float
    prev_hash: str
    hash: str


@dataclass
class EventLog:
    events: list = field(default_factory=list)

    def append(self, event_type: str, payload: dict, ts: float | None = None) -> Event:
        ts = time.time() if ts is None else ts
        prev_hash = self.events[-1].hash if self.events else GENESIS_HASH
        event = Event(
            index=len(self.events),
            event_type=event_type,
            payload=payload,
            ts=ts,
            prev_hash=prev_hash,
            hash=compute_hash(prev_hash, event_type, payload, ts),
        )
        self.events.append(event)
        return event

    def verify(self) -> bool:
        prev_hash = GENESIS_HASH
        for e in self.events:
            if e.prev_hash != prev_hash:
                return False
            if e.hash != compute_hash(e.prev_hash, e.event_type, e.payload, e.ts):
                return False
            prev_hash = e.hash
        return True


def append_event(session: Session, kind: str, payload: dict) -> "app.models.Event":
    from app.models import Event as EventRow

    last = (
        session.query(EventRow).order_by(EventRow.id.desc()).first()
    )
    prev_hash = last.hash if last else GENESIS_HASH
    ts = time.time()
    digest = compute_hash(prev_hash, kind, payload, ts)
    row = EventRow(
        kind=kind,
        payload=payload,
        prev_hash=prev_hash,
        hash=digest,
        created_at=datetime.fromtimestamp(ts, tz=timezone.utc),
    )
    session.add(row)
    session.flush()
    return row
