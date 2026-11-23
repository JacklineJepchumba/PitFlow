from sqlalchemy import text
from sqlalchemy.orm import Session


def point_wkt(lon: float, lat: float) -> str:
    return f"SRID=4326;POINT({lon} {lat})"


def site_lon_lat(session: Session, site_id: int) -> tuple[float, float]:
    row = session.execute(
        text(
            "SELECT ST_X(location::geometry) AS lon, ST_Y(location::geometry) AS lat "
            "FROM sites WHERE id = :sid"
        ),
        {"sid": site_id},
    ).mappings().first()
    if not row:
        return 0.0, 0.0
    return float(row["lon"]), float(row["lat"])
