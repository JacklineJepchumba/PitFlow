import pytest


def test_care_worker_blocked_from_other_trips(client, db_available):
    if not db_available:
        pytest.skip("database not available")

    # Login as care worker 1
    r1 = client.post(
        "/auth/login",
        json={"phone": "+254700000002", "password": "care123"},
    )
    if r1.status_code != 200:
        pytest.skip("seed data not loaded")
    token1 = r1.json()["access_token"]

    r2 = client.post(
        "/auth/login",
        json={"phone": "+254700000003", "password": "care123"},
    )
    assert r2.status_code == 200
    token2 = r2.json()["access_token"]
    uid2 = r2.json()["user_id"]

    # List trips as worker 1 — should not include worker 2's if any
    trips = client.get(
        "/trips", headers={"Authorization": f"Bearer {token1}"}
    ).json()
    for t in trips:
        assert t["care_worker_id"] == r1.json()["user_id"]

    # If worker 2 has a trip, worker 1 must get 403
    trips2 = client.get(
        "/trips", headers={"Authorization": f"Bearer {token2}"}
    ).json()
    if trips2:
        tid = trips2[0]["id"]
        denied = client.get(
            f"/trips/{tid}", headers={"Authorization": f"Bearer {token1}"}
        )
        assert denied.status_code == 403
    else:
        # Create nothing — assert worker cannot access a fake high id as other
        denied = client.get(
            "/trips/999999", headers={"Authorization": f"Bearer {token1}"}
        )
        assert denied.status_code in (403, 404)

    assert uid2 != r1.json()["user_id"]


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["service"] == "pitflow"
