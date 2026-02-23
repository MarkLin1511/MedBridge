from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db import get_session
from app.models import User, AuditLog
from app.auth import get_current_user
from app.routers.dashboard import _relative_time

router = APIRouter(prefix="/api", tags=["audit"])


@router.get("/audit-log")
def get_audit_log(
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    entries = session.exec(
        select(AuditLog).where(AuditLog.patient_id == user.patient_id)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return [
        {
            "id": a.id,
            "action": a.action,
            "by": a.performed_by,
            "when": _relative_time(a.created_at),
            "icon": a.icon,
            "ip_address": a.ip_address,
            "resource": a.resource,
        }
        for a in entries
    ]
