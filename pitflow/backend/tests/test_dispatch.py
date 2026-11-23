from app.services.dispatch.config import BASE_PAYMENT_KES, PER_STOP_KES
from app.services.dispatch.routing import cluster_jobs, haversine_m, order_stops, payment_for_stops


def test_payment_formula():
    assert payment_for_stops(3) == BASE_PAYMENT_KES + PER_STOP_KES * 3


def test_haversine_nearby_kibera_mathare():
    # Kibera vs Mathare — more than 800m apart
    d = haversine_m(36.7884, -1.3133, 36.8586, -1.2594)
    assert d > 800


def test_cluster_and_order_same_site():
    # Three points within ~100m of Kibera centre
    base = {"priority": 0, "unit": type("U", (), {"code": "U001", "status": "red"})()}
    points = [
        {**base, "lon": 36.7884, "lat": -1.3133, "job": type("J", (), {"id": 1, "reason": "red"})()},
        {
            **base,
            "lon": 36.7889,
            "lat": -1.3135,
            "unit": type("U", (), {"code": "U002", "status": "amber"})(),
            "priority": 1,
            "job": type("J", (), {"id": 2, "reason": "amber"})(),
        },
        {
            **base,
            "lon": 36.7879,
            "lat": -1.3129,
            "unit": type("U", (), {"code": "U003", "status": "red"})(),
            "job": type("J", (), {"id": 3, "reason": "red"})(),
        },
    ]
    clusters = cluster_jobs(points)
    assert len(clusters) == 1
    assert len(clusters[0]) == 3
    ordered = order_stops(clusters[0])
    assert len(ordered) == 3
