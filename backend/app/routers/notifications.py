from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db import get_session
from app.models import User, Notification
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["notifications"])


@router.get("/notifications")
def get_notifications(
    skip: int = 0,
    limit: int = 20,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    results = session.exec(
        select(Notification).where(Notification.patient_id == user.patient_id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return [
        {
            "id": n.id,
            "type": n.notification_type,
            "title": n.title,
            "message": n.message,
            "read": n.read,
            "created_at": n.created_at.isoformat(),
        }
        for n in results
    ]


@router.put("/notifications/{notification_id}/read")
def mark_read(notification_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    n = session.get(Notification, notification_id)
    if not n or n.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.read = True
    session.commit()
    return {"status": "ok"}


@router.put("/notifications/read-all")
def mark_all_read(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    notifs = session.exec(
        select(Notification).where(Notification.patient_id == user.patient_id, Notification.read == False)
    ).all()
    for n in notifs:
        n.read = True
    session.commit()
    return {"status": "ok"}
