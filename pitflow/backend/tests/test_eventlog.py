from app.services.eventlog.chain import EventLog


def make_log():
    log = EventLog()
    log.append("job.created", {"job_id": 1}, ts=1.0)
    log.append("trip.started", {"trip_id": 1}, ts=2.0)
    log.append("load.checked_in", {"load_id": 1, "site": "demo-site"}, ts=3.0)
    return log


def test_clean_log_verifies():
    assert make_log().verify() is True


def test_edited_payload_is_detected():
    log = make_log()
    log.events[1].payload["trip_id"] = 99
    assert log.verify() is False


def test_removed_event_is_detected():
    log = make_log()
    del log.events[1]
    assert log.verify() is False
