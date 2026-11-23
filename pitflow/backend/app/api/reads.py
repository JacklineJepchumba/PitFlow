from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.deps import CurrentUser
from app.db import get_session
from app.geo import site_lon_lat
from app.models import Reading, Site, Unit
from app.schemas.api import ReadingOut, SiteOut, UnitOut

router = APIRouter()


@router.get("/sites", response_model=list[SiteOut])
def list_sites(user: CurrentUser, session: Session = Depends(get_session)):
    sites = session.query(Site).order_by(Site.id).all()
    out = []
    for s in sites:
        lon, lat = site_lon_lat(session, s.id)
        out.append(
            SiteOut(id=s.id, name=s.name, area=s.area, lon=lon, lat=lat, notes=s.notes)
        )
    return out


@router.get("/units", response_model=list[UnitOut])
def list_units(
    user: CurrentUser,
    status: str | None = None,
    session: Session = Depends(get_session),
):
    q = session.query(Unit).options(joinedload(Unit.site)).filter(Unit.active.is_(True))
    if status:
        q = q.filter(Unit.status == status)
    units = q.order_by(Unit.code).all()
    out = []
    for u in units:
        lon, lat = site_lon_lat(session, u.site_id)
        out.append(
            UnitOut(
                id=u.id,
                code=u.code,
                site_id=u.site_id,
                site_name=u.site.name if u.site else None,
                area=u.site.area if u.site else None,
                status=u.status,
                design=u.design,
                capacity_users=u.capacity_users,
                lon=lon,
                lat=lat,
                last_reading_at=u.last_reading_at,
                last_visited_at=u.last_visited_at,
                active=u.active,
            )
        )
    return out


@router.get("/readings", response_model=list[ReadingOut])
def list_readings(
    user: CurrentUser,
    unit_id: int | None = Query(default=None),
    session: Session = Depends(get_session),
):
    q = session.query(Reading).order_by(Reading.created_at.desc())
    if unit_id is not None:
        q = q.filter(Reading.unit_id == unit_id)
    return q.limit(200).all()
