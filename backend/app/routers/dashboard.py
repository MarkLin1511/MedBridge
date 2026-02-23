import json
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..db import get_session
from ..models import User, LabObservation, WearableData, AuditLog, PortalConnection
from ..auth import get_current_user

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
def get_dashboard(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    pid = user.patient_id

    # Connected portals
    portals = session.exec(
        select(PortalConnection).where(PortalConnection.patient_id == pid, PortalConnection.status == "connected")
    ).all()
    portal_names = [p.name for p in portals]

    # Wearable source
    wearable_portals = [p.name for p in portals if "Apple" in p.name or "Watch" in p.name or "Fitbit" in p.name]
    wearable_name = wearable_portals[0] if wearable_portals else None

    # Vitals from wearable data
    vitals_raw = session.exec(
        select(WearableData).where(WearableData.patient_id == pid).order_by(WearableData.timestamp.desc())
    ).all()
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

    # Lab trends - group by test name
    all_labs = session.exec(
        select(LabObservation).where(LabObservation.patient_id == pid).order_by(LabObservation.timestamp.asc())
    ).all()

    glucose_trend = [{"date": l.timestamp.strftime("%b %y"), "value": l.value, "source": l.source or ""}
                     for l in all_labs if "glucose" in l.test_name.lower()]
    a1c_trend = [{"date": l.timestamp.strftime("%b %y"), "value": l.value, "source": l.source or ""}
                 for l in all_labs if "a1c" in l.test_name.lower()]
    chol_trend = [{"date": l.timestamp.strftime("%b %y"), "value": l.value, "source": l.source or ""}
                  for l in all_labs if "cholesterol" in l.test_name.lower()]

    # Recent labs
    recent_labs = session.exec(
        select(LabObservation).where(LabObservation.patient_id == pid)
        .order_by(LabObservation.timestamp.desc()).limit(10)
    ).all()
    labs_out = [{
        "test": l.test_name, "loinc": l.loinc, "value": l.value, "unit": l.unit,
        "range": l.ref_range, "status": l.status or "normal",
        "date": l.timestamp.strftime("%Y-%m-%d"), "source": l.source or ""
    } for l in recent_labs]

    # Audit log
    audit_entries = session.exec(
        select(AuditLog).where(AuditLog.patient_id == pid).order_by(AuditLog.created_at.desc()).limit(10)
    ).all()
    audit_out = [{"action": a.action, "by": a.performed_by, "when": _relative_time(a.created_at), "icon": a.icon}
                 for a in audit_entries]

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
