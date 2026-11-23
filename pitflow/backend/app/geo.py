from sqlalchemy.orm import Session

from app.models import Site


def site_lon_lat(session: Session, site_id: int) -> tuple[float, float]:
    site = session.get(Site, site_id)
    if site is None:
        return 0.0, 0.0
    return float(site.lon), float(site.lat)
