import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db import get_session
from app.models import User, LabObservation, WearableData, AuditLog, PortalConnection
from app.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
def get_dashboard(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    pid = user.patient_id

    try:
        # Connected portals
        portals = session.exec(
            select(PortalConnection).where(PortalConnection.patient_id == pid, PortalConnection.status == "connected")
        ).all()
        portal_names = [p.name for p in portals]
    except Exception as e:
        logger.error(f"Failed to fetch portals for patient {pid}: {e}")
        portals = []
        portal_names = []

    # Wearable source
    wearable_portals = [p.name for p in portals if "Apple" in p.name or "Watch" in p.name or "Fitbit" in p.name]
    wearable_name = wearable_portals[0] if wearable_portals else None

    try:
        # Vitals from wearable data
        vitals_raw = session.exec(
            select(WearableData).where(WearableData.patient_id == pid).order_by(WearableData.timestamp.desc())
        ).all()
    except Exception as e:
        logger.error(f"Failed to fetch wearable data for patient {pid}: {e}")
        vitals_raw = []

    vitals = []
    seen_metrics = set()
    for v in vitals_raw:
        if v.metric not in seen_metrics:
            seen_metrics.add(v.metric)
            label_map = {
                "heart_rate": "Avg Heart Rate",
                "hrv": "Avg HRV",
                "blood_pressure": "Blood Pressure",
                "resting_hr": "Resting HR",
            }
            vitals.append({
                "label": label_map.get(v.metric, v.metric),
                "value": v.value,
                "trend": v.trend or "stable",
                "period": v.period or "Last 7 days",
            })

    try:
        # Lab trends - group by test name
        all_labs = session.exec(
            select(LabObservation).where(LabObservation.patient_id == pid).order_by(LabObservation.timestamp.asc())
        ).all()
    except Exception as e:
        logger.error(f"Failed to fetch lab observations for patient {pid}: {e}")
        all_labs = []

    glucose_trend = [{"date": l.timestamp.strftime("%b %y"), "value": l.value, "source": l.source or ""}
                     for l in all_labs if "glucose" in l.test_name.lower()]
    a1c_trend = [{"date": l.timestamp.strftime("%b %y"), "value": l.value, "source": l.source or ""}
                 for l in all_labs if "a1c" in l.test_name.lower()]
    chol_trend = [{"date": l.timestamp.strftime("%b %y"), "value": l.value, "source": l.source or ""}
                  for l in all_labs if "cholesterol" in l.test_name.lower()]

    try:
        # Recent labs
        recent_labs = session.exec(
            select(LabObservation).where(LabObservation.patient_id == pid)
            .order_by(LabObservation.timestamp.desc()).limit(10)
        ).all()
    except Exception as e:
        logger.error(f"Failed to fetch recent labs for patient {pid}: {e}")
        recent_labs = []

    labs_out = [{
        "test": l.test_name, "loinc": l.loinc, "value": l.value, "unit": l.unit,
        "range": l.ref_range, "status": l.status or "normal",
        "date": l.timestamp.strftime("%Y-%m-%d"), "source": l.source or ""
    } for l in recent_labs]

    try:
        # Audit log
        audit_entries = session.exec(
            select(AuditLog).where(AuditLog.patient_id == pid).order_by(AuditLog.created_at.desc()).limit(10)
        ).all()
    except Exception as e:
        logger.error(f"Failed to fetch audit log for patient {pid}: {e}")
        audit_entries = []

    audit_out = [{"action": a.action, "by": a.performed_by, "when": _relative_time(a.created_at), "icon": a.icon}
                 for a in audit_entries]

    # Record audit log entry for dashboard view
    try:
        session.add(AuditLog(
            patient_id=pid,
            action="Viewed dashboard",
            performed_by="You",
            icon="eye",
        ))
        session.commit()
    except Exception as e:
        logger.error(f"Failed to write dashboard view audit log for patient {pid}: {e}")

    return {
        "patient": {
            "name": f"{user.first_name} {user.last_name}",
            "dob": user.dob,
            "patient_id": user.patient_id,
            "connected_portals": portal_names,
            "wearable": wearable_name,
        },
        "vitals": vitals,
        "lab_trends": {
            "glucose": glucose_trend,
            "a1c": a1c_trend,
            "cholesterol": chol_trend,
        },
        "recent_labs": labs_out,
        "audit_log": audit_out,
    }


def _relative_time(dt):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        from datetime import timezone as tz
        dt = dt.replace(tzinfo=tz.utc)
    diff = now - dt
    seconds = diff.total_seconds()
    if seconds < 60:
        return "just now"
    if seconds < 3600:
        m = int(seconds / 60)
        return f"{m} minute{'s' if m != 1 else ''} ago"
    if seconds < 86400:
        h = int(seconds / 3600)
        return f"{h} hour{'s' if h != 1 else ''} ago"
    if seconds < 604800:
        d = int(seconds / 86400)
        return f"{d} day{'s' if d != 1 else ''} ago"
    w = int(seconds / 604800)
    return f"{w} week{'s' if w != 1 else ''} ago"
