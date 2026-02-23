from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db import get_session
from app.models import User, PortalConnection, AuditLog, Notification
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["portals"])


@router.get("/portals")
def get_portals(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    results = session.exec(
        select(PortalConnection).where(PortalConnection.patient_id == user.patient_id)
    ).all()
    return [{"id": p.id, "name": p.name, "doctors": p.doctors, "status": p.status, "color": p.color} for p in results]


def _get_portal_or_404(portal_id: int, user: User, session: Session) -> PortalConnection:
    """Validate portal exists and belongs to the current user, or raise 404."""
    p = session.get(PortalConnection, portal_id)
    if not p or p.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Portal not found")
    return p


@router.post("/portals/{portal_id}/connect")
def connect_portal(portal_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    p = _get_portal_or_404(portal_id, user, session)
    p.status = "connected"
    session.add(AuditLog(patient_id=user.patient_id, action=f"Connected {p.name}", performed_by="You", icon="sync"))
    session.add(Notification(patient_id=user.patient_id, notification_type="system", title="Portal connected", message=f"{p.name} has been connected to your account"))
    session.commit()
    return {"status": "ok", "message": f"{p.name} connected successfully"}


@router.post("/portals/{portal_id}/disconnect")
def disconnect_portal(portal_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    p = _get_portal_or_404(portal_id, user, session)
    p.status = "available"
    session.add(AuditLog(patient_id=user.patient_id, action=f"Disconnected {p.name}", performed_by="You", icon="sync"))
    session.commit()
    return {"status": "ok"}
