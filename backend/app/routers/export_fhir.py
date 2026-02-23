import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from ..db import get_session
from ..models import User, LabObservation, MedicalRecord, AuditLog
from ..auth import get_current_user

router = APIRouter(prefix="/api", tags=["export"])


@router.get("/export/fhir")
def export_fhir(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    pid = user.patient_id

    # Build FHIR R4 Bundle
    bundle = {
        "resourceType": "Bundle",
        "type": "collection",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "meta": {
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
            "source": "MedBridge Health Platform",
        },
        "entry": [],
    }

    # Patient resource
    bundle["entry"].append({
        "resource": {
            "resourceType": "Patient",
            "id": pid,
            "name": [{"family": user.last_name, "given": [user.first_name]}],
            "birthDate": user.dob,
            "identifier": [{"system": "urn:medbridge:patient", "value": pid}],
        }
    })

    # Lab Observations
    labs = session.exec(select(LabObservation).where(LabObservation.patient_id == pid)).all()
    for lab in labs:
        obs = {
            "resource": {
                "resourceType": "Observation",
                "status": "final",
                "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "laboratory"}]}],
                "code": {"coding": [{"system": "http://loinc.org", "code": lab.loinc or "", "display": lab.test_name}]},
                "subject": {"reference": f"Patient/{pid}"},
                "effectiveDateTime": lab.timestamp.isoformat(),
                "valueQuantity": {"value": lab.value, "unit": lab.unit or "", "system": "http://unitsofmeasure.org"},
            }
        }
        if lab.source:
            obs["resource"]["performer"] = [{"display": lab.source}]
        bundle["entry"].append(obs)

    # Medical Records as DocumentReference
    records = session.exec(select(MedicalRecord).where(MedicalRecord.patient_id == pid)).all()
    for rec in records:
        doc = {
            "resource": {
                "resourceType": "DocumentReference",
                "status": "current",
                "type": {"text": rec.record_type},
                "subject": {"reference": f"Patient/{pid}"},
                "date": rec.date,
                "description": rec.title,
                "content": [{"attachment": {"contentType": "text/plain", "data": rec.description}}],
                "context": {"related": [{"display": rec.source}]},
            }
        }
        bundle["entry"].append(doc)

    # Log the export
    session.add(AuditLog(patient_id=pid, action="FHIR R4 data exported", performed_by="You", icon="download"))
    session.commit()

    return JSONResponse(
        content=bundle,
        headers={
            "Content-Disposition": f"attachment; filename=medbridge_{pid}_fhir_export.json",
            "Content-Type": "application/fhir+json",
        },
    )
