from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db import get_session
from ..models import User, ProviderAccess, AuditLog, Notification
from ..auth import get_current_user

router = APIRouter(prefix="/api", tags=["providers"])


@router.get("/providers")
def get_providers(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    all_providers = session.exec(
        select(ProviderAccess).where(ProviderAccess.patient_id == user.patient_id)
    ).all()

    connected = [
        {
            "id": p.id,
            "name": p.provider_name,
            "specialty": p.specialty,
            "facility": p.facility,
            "portal": p.portal,
            "lastAccess": p.last_access or "Never",
            "accessLevel": p.access_level,
            "status": p.status,
        }
        for p in all_providers if p.status == "active"
    ]

    pending = [
        {
            "id": p.id,
            "name": p.provider_name,
            "specialty": p.specialty,
            "facility": p.facility,
            "portal": p.portal,
            "requestedAccess": p.requested_access or "Full records",
            "requestDate": p.request_date or "",
        }
        for p in all_providers if p.status == "pending"
    ]

    return {"connected": connected, "pending": pending}


@router.post("/providers/{provider_id}/approve")
def approve_provider(provider_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    p = session.get(ProviderAccess, provider_id)
    if not p or p.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Provider not found")
    p.status = "active"
    session.add(AuditLog(patient_id=user.patient_id, action=f"Approved access for {p.provider_name}", performed_by="You", icon="share"))
    session.add(Notification(patient_id=user.patient_id, notification_type="system", title="Provider approved", message=f"{p.provider_name} now has access to your records"))
    session.commit()
    return {"status": "ok"}


@router.post("/providers/{provider_id}/deny")
def deny_provider(provider_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    p = session.get(ProviderAccess, provider_id)
    if not p or p.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Provider not found")
    p.status = "revoked"
    session.commit()
    return {"status": "ok"}


@router.post("/providers/{provider_id}/revoke")
def revoke_provider(provider_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    p = session.get(ProviderAccess, provider_id)
    if not p or p.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Provider not found")
    p.status = "revoked"
    session.add(AuditLog(patient_id=user.patient_id, action=f"Revoked access for {p.provider_name}", performed_by="You", icon="share"))
    session.commit()
    return {"status": "ok"}
