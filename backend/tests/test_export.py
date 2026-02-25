"""Tests for FHIR R4 export endpoint."""
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import LabObservation, MedicalRecord


class TestFHIRExport:
    """GET /api/export/fhir"""

    def test_fhir_export(
        self, client: TestClient, auth_headers: dict, session: Session, demo_user
    ):
        """Exporting with labs and records produces a valid FHIR R4 Bundle."""
        pid = demo_user.patient_id

        # Add lab observations
        session.add(
            LabObservation(
                patient_id=pid,
                test_name="Glucose (fasting)",
                loinc="1558-6",
                value=112,
                unit="mg/dL",
                ref_range="70-100",
                status="high",
                source="Epic MyChart",
                timestamp=datetime.now(timezone.utc) - timedelta(days=10),
            )
        )
        session.add(
            LabObservation(
                patient_id=pid,
                test_name="Hemoglobin A1c",
                loinc="4548-4",
                value=6.1,
                unit="%",
                ref_range="4.0-5.6",
                status="high",
                source="VA Health",
                timestamp=datetime.now(timezone.utc) - timedelta(days=20),
            )
        )

        # Add medical records
        session.add(
            MedicalRecord(
                patient_id=pid,
                record_type="lab",
                title="CMP Panel",
                description="Complete Metabolic Panel results",
                date="2026-02-01",
                source="Epic MyChart",
                provider="Dr. Chen",
                flags="[]",
            )
        )
        session.commit()

        resp = client.get("/api/export/fhir", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

        bundle = resp.json()

        # Verify top-level FHIR Bundle structure
        assert bundle["resourceType"] == "Bundle", "resourceType must be 'Bundle'"
        assert bundle["type"] == "collection", "Bundle type must be 'collection'"
        assert "timestamp" in bundle, "Bundle must have a timestamp"
        assert "entry" in bundle, "Bundle must have an entry array"

        entries = bundle["entry"]
        resource_types = [e["resource"]["resourceType"] for e in entries]

        # Must include a Patient resource
        assert "Patient" in resource_types, "Bundle should contain a Patient resource"

        # Must include Observation resources (from the 2 labs)
        observation_count = resource_types.count("Observation")
        assert observation_count == 2, (
            f"Expected 2 Observation entries (labs), got {observation_count}"
        )

        # Must include DocumentReference resources (from the 1 medical record)
        doc_ref_count = resource_types.count("DocumentReference")
        assert doc_ref_count == 1, (
            f"Expected 1 DocumentReference entry (record), got {doc_ref_count}"
        )

        # Verify Patient resource details
        patient_entry = next(e for e in entries if e["resource"]["resourceType"] == "Patient")
        patient = patient_entry["resource"]
        assert patient["id"] == pid
        assert patient["name"][0]["family"] == "User"
        assert patient["name"][0]["given"] == ["Test"]

        # Verify an Observation has the correct LOINC code
        observations = [e for e in entries if e["resource"]["resourceType"] == "Observation"]
        loinc_codes = [
            obs["resource"]["code"]["coding"][0]["code"] for obs in observations
        ]
        assert "1558-6" in loinc_codes, "Glucose LOINC code should be present"
        assert "4548-4" in loinc_codes, "A1c LOINC code should be present"
