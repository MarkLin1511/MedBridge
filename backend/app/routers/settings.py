import re
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session
from app.db import get_session
from app.models import User, AuditLog
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["settings"])

# Whitelist of fields that may be updated via the settings endpoint
ALLOWED_FIELDS = {
    "first_name",
    "last_name",
    "email",
    "dob",
    "two_factor_enabled",
    "session_timeout",
    "share_labs",
    "share_wearable",
    "allow_export",
    "require_approval",
    "notify_labs",
    "notify_provider_requests",
    "notify_wearable_sync",
    "notify_weekly_summary",
}

# Simple but effective email regex
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


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
    updates = data.model_dump(exclude_none=True)
    changed_fields = []

    for field, value in updates.items():
        # Only allow whitelisted fields -- reject anything else
        if field not in ALLOWED_FIELDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Field '{field}' is not allowed to be updated.",
            )

        # Validate email format when email is being changed
        if field == "email" and not EMAIL_REGEX.match(value):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid email format.",
            )

        setattr(user, field, value)
        changed_fields.append(field)

    session.add(user)

    # Audit log for settings changes
    if changed_fields:
        session.add(AuditLog(
            patient_id=user.patient_id,
            action=f"Updated settings: {', '.join(changed_fields)}",
            performed_by="You",
            icon="eye",
        ))

    session.commit()
    session.refresh(user)
    return {"status": "ok"}
