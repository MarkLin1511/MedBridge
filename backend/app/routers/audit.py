from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..db import get_session
from ..models import User, AuditLog
from ..auth import get_current_user
from .dashboard import _relative_time

router = APIRouter(prefix="/api", tags=["audit"])


@router.get("/audit-log")
def get_audit_log(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    entries = session.exec(
        select(AuditLog).where(AuditLog.patient_id == user.patient_id)
        .order_by(AuditLog.created_at.desc()).limit(50)
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
