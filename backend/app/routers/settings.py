from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session
from ..db import get_session
from ..models import User
from ..auth import get_current_user

router = APIRouter(prefix="/api", tags=["settings"])


class SettingsUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    dob: str | None = None
    two_factor_enabled: bool | None = None
    session_timeout: int | None = None
    share_labs: bool | None = None
    share_wearable: bool | None = None
    allow_export: bool | None = None
    require_approval: bool | None = None
    notify_labs: str | None = None
    notify_provider_requests: str | None = None
    notify_wearable_sync: str | None = None
    notify_weekly_summary: str | None = None


@router.get("/settings")
def get_settings(user: User = Depends(get_current_user)):
    return {
        "profile": {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "dob": user.dob,
            "patient_id": user.patient_id,
        },
        "security": {
            "two_factor_enabled": user.two_factor_enabled,
            "session_timeout": user.session_timeout,
        },
        "privacy": {
            "share_labs": user.share_labs,
            "share_wearable": user.share_wearable,
            "allow_export": user.allow_export,
            "require_approval": user.require_approval,
        },
        "notifications": {
            "notify_labs": user.notify_labs,
            "notify_provider_requests": user.notify_provider_requests,
            "notify_wearable_sync": user.notify_wearable_sync,
            "notify_weekly_summary": user.notify_weekly_summary,
        },
    }


@router.put("/settings")
def update_settings(data: SettingsUpdate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"status": "ok"}
