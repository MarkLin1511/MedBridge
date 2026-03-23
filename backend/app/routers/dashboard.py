from __future__ import annotations

import json
import logging
import re
from collections import Counter
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.auth import get_current_user
from app.db import get_session
from app.models import (
    AuditLog,
    DocumentReviewItem,
    LabObservation,
    MedicalDocument,
    MedicalRecord,
    PortalConnection,
    User,
    WearableData,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["dashboard"])

MANUAL_LAB_SOURCES = {"manual entry", "patient typed entry", "self-reported"}


class ManualLabEntryRequest(BaseModel):
    test_name: str
    value: float
    unit: str
    ref_range: str | None = None
    status: str | None = None
    source: str = "Manual entry"
    collected_on: str | None = None


def _relative_time(dt: datetime | None) -> str | None:
    if not dt:
        return None
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = diff.total_seconds()
    if seconds < 60:
        return "just now"
    if seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    if seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    if seconds < 604800:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    weeks = int(seconds / 604800)
    return f"{weeks} week{'s' if weeks != 1 else ''} ago"


def _clamp(value: float, lower: int = 0, upper: int = 100) -> int:
    return int(max(lower, min(upper, round(value))))


def _parse_metric_number(value: str | None) -> float | None:
    if not value:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", value)
    return float(match.group(0)) if match else None


def _parse_blood_pressure(value: str | None) -> tuple[int | None, int | None]:
    if not value:
        return None, None
    match = re.search(r"(\d{2,3})\s*/\s*(\d{2,3})", value)
    if not match:
        return None, None
    return int(match.group(1)), int(match.group(2))


def _derive_status(value: float, ref_range: str | None) -> str:
    if not ref_range:
        return "normal"
    if ref_range.startswith("<"):
        try:
            return "high" if value >= float(ref_range[1:]) else "normal"
        except ValueError:
            return "normal"
    if "-" in ref_range:
        lower, upper = ref_range.split("-", 1)
        try:
            low = float(lower)
            high = float(upper)
        except ValueError:
            return "normal"
        if value < low:
            return "low"
        if value > high:
            return "high"
        return "normal"
    return "normal"


def _latest_lab_with_keywords(labs: list[LabObservation], keywords: tuple[str, ...]) -> LabObservation | None:
    matches = [lab for lab in labs if any(keyword in lab.test_name.lower() for keyword in keywords)]
    return max(matches, key=lambda lab: lab.timestamp) if matches else None


def _metric_map(vitals_raw: list[WearableData]) -> dict[str, WearableData]:
    latest: dict[str, WearableData] = {}
    for vital in vitals_raw:
        if vital.metric not in latest:
            latest[vital.metric] = vital
    return latest


def _timeline_type(record_type: str) -> str:
    if record_type in {"lab_result", "pathology_report"}:
        return "lab"
    if record_type == "medication_list":
        return "medication"
    if record_type == "imaging_report":
        return "imaging"
    if record_type in {"wearable_report", "vitals_sheet"}:
        return "wearable"
    return "visit"


def _review_item_map(review_items: list[DocumentReviewItem]) -> dict[int, DocumentReviewItem]:
    latest: dict[int, DocumentReviewItem] = {}
    for item in sorted(review_items, key=lambda current: current.created_at):
        latest[item.document_id] = item
    return latest


def _source_bucket(source: str | None) -> str:
    normalized = (source or "").lower()
    if not normalized:
        return "Unknown"
    if normalized in MANUAL_LAB_SOURCES:
        return "Manual"
    if "watch" in normalized or "fitbit" in normalized or "apple" in normalized:
        return "Wearables"
    if "document" in normalized or "portal" in normalized or "epic" in normalized or "va" in normalized:
        return "Clinical systems"
    return "Clinical systems"


def _compute_health_axes(
    all_labs: list[LabObservation],
    vitals_raw: list[WearableData],
    summary: dict,
) -> list[dict]:
    latest_vitals = _metric_map(vitals_raw)
    latest_a1c = _latest_lab_with_keywords(all_labs, ("a1c",))
    latest_glucose = _latest_lab_with_keywords(all_labs, ("glucose",))
    latest_cholesterol = _latest_lab_with_keywords(all_labs, ("cholesterol",))

    systolic, diastolic = _parse_blood_pressure(latest_vitals.get("blood_pressure").value if latest_vitals.get("blood_pressure") else None)
    resting_hr = _parse_metric_number(latest_vitals.get("resting_hr").value if latest_vitals.get("resting_hr") else None)
    heart_rate = _parse_metric_number(latest_vitals.get("heart_rate").value if latest_vitals.get("heart_rate") else None)
    hrv = _parse_metric_number(latest_vitals.get("hrv").value if latest_vitals.get("hrv") else None)

    metabolic_score = 72.0
    if latest_a1c:
        metabolic_score += 8 if latest_a1c.value <= 5.6 else 2 if latest_a1c.value <= 5.9 else -8 if latest_a1c.value <= 6.4 else -15
    if latest_glucose:
        metabolic_score += 6 if latest_glucose.value <= 100 else 0 if latest_glucose.value <= 110 else -6 if latest_glucose.value <= 125 else -12
    metabolic_score -= summary["abnormal_labs"] * 0.7

    cardio_score = 70.0
    if latest_cholesterol:
        cardio_score += 5 if latest_cholesterol.value < 200 else -7 if latest_cholesterol.value <= 239 else -12
    if systolic and diastolic:
        cardio_score += 6 if systolic < 125 and diastolic < 80 else -4 if systolic <= 135 and diastolic <= 85 else -12
    if resting_hr is not None:
        cardio_score += 6 if resting_hr <= 65 else 2 if resting_hr <= 75 else -8

    recovery_score = 68.0
    if hrv is not None:
        recovery_score += 8 if hrv >= 50 else 2 if hrv >= 35 else -10
    if heart_rate is not None:
        recovery_score += 5 if 60 <= heart_rate <= 75 else -4
    if latest_vitals.get("heart_rate") and latest_vitals.get("heart_rate").trend == "up":
        recovery_score -= 3
    if latest_vitals.get("hrv") and latest_vitals.get("hrv").trend == "up":
        recovery_score += 3

    continuity_score = 54.0
    continuity_score += min(summary["connected_portals"] * 12, 28)
    continuity_score += min(summary["uploaded_documents"] * 4, 12)
    continuity_score += min(summary["total_records"] / 2.5, 16)
    continuity_score -= summary["pending_reviews"] * 4

    return [
        {
            "slug": "metabolic",
            "label": "Metabolic",
            "score": _clamp(metabolic_score),
            "trend": "up" if latest_a1c and latest_a1c.value <= 5.9 else "stable" if latest_a1c else "stable",
            "summary": "Blood sugar and lipid markers pulled from lab history, with abnormal values weighted harder than normal wearables.",
            "focus": "Track A1c, fasting glucose, and cholesterol together so uploaded lab packets actually change the self-quant picture.",
            "metrics": [
                {"label": "A1c", "value": f"{latest_a1c.value:.1f}%" if latest_a1c else "No data", "status": latest_a1c.status if latest_a1c else "missing"},
                {"label": "Glucose", "value": f"{latest_glucose.value:.0f} mg/dL" if latest_glucose else "No data", "status": latest_glucose.status if latest_glucose else "missing"},
                {"label": "Cholesterol", "value": f"{latest_cholesterol.value:.0f} mg/dL" if latest_cholesterol else "No data", "status": latest_cholesterol.status if latest_cholesterol else "missing"},
            ],
        },
        {
            "slug": "cardiovascular",
            "label": "Cardiovascular",
            "score": _clamp(cardio_score),
            "trend": "stable" if systolic else "up",
            "summary": "Combines wearables with lipid labs so body signals and clinical markers sit in the same lane.",
            "focus": "Use wearable heart rate plus uploaded cholesterol and blood pressure records to spot longer-term drift.",
            "metrics": [
                {"label": "Blood pressure", "value": f"{systolic}/{diastolic}" if systolic and diastolic else "No data", "status": "normal" if systolic and systolic < 125 and diastolic < 80 else "attention" if systolic else "missing"},
                {"label": "Resting HR", "value": latest_vitals.get("resting_hr").value if latest_vitals.get("resting_hr") else "No data", "status": latest_vitals.get("resting_hr").trend if latest_vitals.get("resting_hr") else "missing"},
                {"label": "Total cholesterol", "value": f"{latest_cholesterol.value:.0f} mg/dL" if latest_cholesterol else "No data", "status": latest_cholesterol.status if latest_cholesterol else "missing"},
            ],
        },
        {
            "slug": "recovery",
            "label": "Recovery",
            "score": _clamp(recovery_score),
            "trend": "up" if latest_vitals.get("hrv") and latest_vitals.get("hrv").trend == "up" else "stable",
            "summary": "Wearable-led picture of stress, readiness, and day-to-day recovery rhythm.",
            "focus": "If you want the dashboard to feel quantified-self native, recovery needs to be as visible as labs.",
            "metrics": [
                {"label": "Heart rate", "value": latest_vitals.get("heart_rate").value if latest_vitals.get("heart_rate") else "No data", "status": latest_vitals.get("heart_rate").trend if latest_vitals.get("heart_rate") else "missing"},
                {"label": "HRV", "value": latest_vitals.get("hrv").value if latest_vitals.get("hrv") else "No data", "status": latest_vitals.get("hrv").trend if latest_vitals.get("hrv") else "missing"},
                {"label": "Wearable stream", "value": str(summary["wearable_metrics"]), "status": "connected" if summary["wearable_metrics"] else "missing"},
            ],
        },
        {
            "slug": "continuity",
            "label": "Continuity",
            "score": _clamp(continuity_score),
            "trend": "down" if summary["pending_reviews"] else "up",
            "summary": "How complete the health story is across uploads, portals, manual entries, and approved AI document imports.",
            "focus": "This is MedBridge’s moat: outside records and portal documents become quantified health context instead of dead files.",
            "metrics": [
                {"label": "Connected portals", "value": str(summary["connected_portals"]), "status": "connected" if summary["connected_portals"] else "missing"},
                {"label": "Pending AI reviews", "value": str(summary["pending_reviews"]), "status": "attention" if summary["pending_reviews"] else "clear"},
                {"label": "Uploaded documents", "value": str(summary["uploaded_documents"]), "status": "active" if summary["uploaded_documents"] else "missing"},
            ],
        },
    ]


@router.get("/dashboard")
def get_dashboard(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    patient_id = user.patient_id

    portals = session.exec(
        select(PortalConnection).where(PortalConnection.patient_id == patient_id)
    ).all()
    connected_portals = [portal for portal in portals if portal.status == "connected"]
    portal_names = [portal.name for portal in connected_portals]
    wearable_portals = [portal.name for portal in connected_portals if "Apple" in portal.name or "Watch" in portal.name or "Fitbit" in portal.name]
    wearable_name = wearable_portals[0] if wearable_portals else None

    vitals_raw = session.exec(
        select(WearableData).where(WearableData.patient_id == patient_id).order_by(WearableData.timestamp.desc())
    ).all()
    latest_vitals = _metric_map(vitals_raw)
    vitals = []
    for metric, label in (
        ("heart_rate", "Avg Heart Rate"),
        ("hrv", "Avg HRV"),
        ("blood_pressure", "Blood Pressure"),
        ("resting_hr", "Resting HR"),
    ):
        if metric in latest_vitals:
            vital = latest_vitals[metric]
            vitals.append(
                {
                    "label": label,
                    "value": vital.value,
                    "trend": vital.trend or "stable",
                    "period": vital.period or "Last 7 days",
                }
            )

    all_labs = session.exec(
        select(LabObservation).where(LabObservation.patient_id == patient_id).order_by(LabObservation.timestamp.asc())
    ).all()
    records = session.exec(select(MedicalRecord).where(MedicalRecord.patient_id == patient_id)).all()
    documents = session.exec(
        select(MedicalDocument).where(MedicalDocument.patient_id == patient_id).order_by(MedicalDocument.created_at.desc())
    ).all()
    review_items = session.exec(
        select(DocumentReviewItem).where(DocumentReviewItem.patient_id == patient_id).order_by(DocumentReviewItem.created_at.desc())
    ).all()
    audit_entries = session.exec(
        select(AuditLog).where(AuditLog.patient_id == patient_id).order_by(AuditLog.created_at.desc()).limit(12)
    ).all()

    latest_review_by_document = _review_item_map(review_items)
    record_counts = Counter(record.record_type for record in records)
    abnormal_labs = [lab for lab in all_labs if (lab.status or "").lower() in {"high", "low"}]
    manual_lab_entries = [lab for lab in all_labs if (lab.source or "").strip().lower() in MANUAL_LAB_SOURCES]
    approved_document_imports = sum(1 for document in documents if document.extraction_status == "approved_review")
    pending_reviews = [item for item in review_items if item.status == "pending_review"]

    summary = {
        "total_records": len(records),
        "connected_portals": len(portal_names),
        "abnormal_labs": len(abnormal_labs),
        "wearable_metrics": len(vitals),
        "uploaded_documents": len(documents),
        "pending_reviews": len(pending_reviews),
        "manual_lab_entries": len(manual_lab_entries),
    }

    health_axes = _compute_health_axes(all_labs, vitals_raw, summary)
    quantified_score = _clamp(sum(axis["score"] for axis in health_axes) / len(health_axes)) if health_axes else 0
    quantified_overview = {
        "score": quantified_score,
        "mode": "quantified self + clinical records",
        "narrative": (
            "MedBridge is fusing wearable signals, manually typed labs, portal results, and AI-reviewed documents into one quantified health surface."
        ),
    }

    glucose_trend = [
        {"date": lab.timestamp.strftime("%b %y"), "value": lab.value, "source": lab.source or ""}
        for lab in all_labs
        if "glucose" in lab.test_name.lower()
    ]
    a1c_trend = [
        {"date": lab.timestamp.strftime("%b %y"), "value": lab.value, "source": lab.source or ""}
        for lab in all_labs
        if "a1c" in lab.test_name.lower()
    ]
    cholesterol_trend = [
        {"date": lab.timestamp.strftime("%b %y"), "value": lab.value, "source": lab.source or ""}
        for lab in all_labs
        if "cholesterol" in lab.test_name.lower()
    ]

    recent_labs = session.exec(
        select(LabObservation).where(LabObservation.patient_id == patient_id).order_by(LabObservation.timestamp.desc()).limit(10)
    ).all()
    labs_out = [
        {
            "test": lab.test_name,
            "loinc": lab.loinc,
            "value": lab.value,
            "unit": lab.unit,
            "range": lab.ref_range,
            "status": lab.status or "normal",
            "date": lab.timestamp.strftime("%Y-%m-%d"),
            "source": lab.source or "",
        }
        for lab in recent_labs
    ]

    data_coverage = [
        {"label": "Labs", "count": record_counts.get("lab", 0)},
        {"label": "Medications", "count": record_counts.get("medication", 0)},
        {"label": "Visits", "count": record_counts.get("visit", 0)},
        {"label": "Imaging", "count": record_counts.get("imaging", 0)},
        {"label": "Wearables", "count": record_counts.get("wearable", 0)},
    ]

    source_mix_counter: Counter[str] = Counter()
    for lab in all_labs:
        source_mix_counter[_source_bucket(lab.source)] += 1
    for document in documents:
        source_mix_counter["Uploaded documents"] += 1
    source_mix = [{"label": label, "count": count} for label, count in source_mix_counter.most_common()]

    derived_record_counts: dict[int, int] = {}
    for record in records:
        flags = json.loads(record.flags) if record.flags else []
        for flag in flags:
            if isinstance(flag, str) and flag.startswith("document:"):
                try:
                    document_id = int(flag.split(":", 1)[1])
                except ValueError:
                    continue
                derived_record_counts[document_id] = derived_record_counts.get(document_id, 0) + 1

    recent_documents = []
    for document in documents[:4]:
        review_item = latest_review_by_document.get(document.id)
        recent_documents.append(
            {
                "id": document.id,
                "title": document.title,
                "date": document.document_date,
                "source_system": document.source_system,
                "source": document.source,
                "status": document.extraction_status,
                "review_summary": review_item.summary if review_item else None,
                "review_confidence": review_item.confidence if review_item else None,
                "derived_records_count": derived_record_counts.get(document.id, 0),
            }
        )

    care_alerts = []
    if abnormal_labs:
        latest_abnormal = max(abnormal_labs, key=lambda lab: lab.timestamp)
        care_alerts.append(
            {
                "severity": (latest_abnormal.status or "attention").lower(),
                "title": f"{latest_abnormal.test_name} is outside range",
                "detail": f"{latest_abnormal.value} {latest_abnormal.unit or ''} from {latest_abnormal.source or 'uploaded labs'}".strip(),
            }
        )
    if pending_reviews:
        care_alerts.append(
            {
                "severity": "info",
                "title": f"{len(pending_reviews)} portal document{'s' if len(pending_reviews) != 1 else ''} waiting for review",
                "detail": "Approve AI-scraped records so they land in the quantified dashboard and become exportable.",
            }
        )
    if not manual_lab_entries:
        care_alerts.append(
            {
                "severity": "info",
                "title": "No manual lab entries yet",
                "detail": "Type a lab by hand when a result arrives outside a portal or before a file is available.",
            }
        )

    last_export = next((entry for entry in audit_entries if entry.action == "FHIR R4 data exported"), None)
    translation = {
        "exportable_resources": len(records) + len(all_labs) + len(documents),
        "supported_formats": ["FHIR R4 JSON"],
        "last_exported_at": _relative_time(last_export.created_at) if last_export else None,
        "narrative": (
            "Every approved document extraction and typed lab can be translated into a portable FHIR bundle for the next portal or provider workflow."
        ),
    }

    ingestion = {
        "uploaded_documents": len(documents),
        "pending_reviews": len(pending_reviews),
        "approved_document_imports": approved_document_imports,
        "manual_lab_entries": len(manual_lab_entries),
        "recent_documents": recent_documents,
        "source_mix": source_mix,
    }

    audit_out = [
        {"action": entry.action, "by": entry.performed_by, "when": _relative_time(entry.created_at), "icon": entry.icon}
        for entry in audit_entries
    ]

    try:
        session.add(
            AuditLog(
                patient_id=patient_id,
                action="Viewed dashboard",
                performed_by="You",
                icon="eye",
            )
        )
        session.commit()
    except Exception as exc:
        logger.error("Failed to write dashboard audit log for patient %s: %s", patient_id, exc)

    return {
        "patient": {
            "name": f"{user.first_name} {user.last_name}",
            "dob": user.dob,
            "patient_id": user.patient_id,
            "connected_portals": portal_names,
            "wearable": wearable_name,
        },
        "summary": summary,
        "quantified_overview": quantified_overview,
        "health_axes": health_axes,
        "vitals": vitals,
        "lab_trends": {
            "glucose": glucose_trend,
            "a1c": a1c_trend,
            "cholesterol": cholesterol_trend,
        },
        "care_alerts": care_alerts[:4],
        "data_coverage": data_coverage,
        "recent_labs": labs_out,
        "ingestion": ingestion,
        "translation": translation,
        "audit_log": audit_out,
    }


@router.post("/dashboard/manual-labs")
def create_manual_lab_entry(
    request: ManualLabEntryRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    test_name = request.test_name.strip()
    unit = request.unit.strip()
    source = request.source.strip() or "Manual entry"
    collected_on = request.collected_on or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if not test_name:
        raise HTTPException(status_code=400, detail="Test name is required.")
    if not unit:
        raise HTTPException(status_code=400, detail="Unit is required.")
    try:
        observed_at = datetime.strptime(collected_on, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Collected date must be YYYY-MM-DD.") from exc

    status = (request.status or "").lower() or _derive_status(request.value, request.ref_range)
    lab = LabObservation(
        patient_id=user.patient_id,
        test_name=test_name,
        value=request.value,
        unit=unit,
        ref_range=request.ref_range,
        status=status,
        source=source,
        timestamp=observed_at,
    )
    session.add(lab)
    session.add(
        MedicalRecord(
            patient_id=user.patient_id,
            record_type="lab",
            title=test_name,
            description=f"{request.value} {unit}" + (f" · Ref {request.ref_range}" if request.ref_range else ""),
            date=collected_on,
            source=source,
            provider="Self-reported",
            flags=json.dumps(["Manual entry"]),
        )
    )
    session.add(
        AuditLog(
            patient_id=user.patient_id,
            action=f"Manually added {test_name}",
            performed_by="You",
            icon="download",
        )
    )
    session.commit()
    session.refresh(lab)

    return {
        "id": lab.id,
        "test_name": lab.test_name,
        "value": lab.value,
        "unit": lab.unit,
        "status": lab.status,
        "date": collected_on,
        "source": lab.source,
    }
