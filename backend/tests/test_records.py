"""Tests for medical records endpoints: list, filter, search, pagination."""
import json
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import MedicalRecord, MedicalDocument
from app.encryption import decrypt_bytes, encrypt_bytes


def _make_record(patient_id: str, **overrides) -> MedicalRecord:
    """Helper to create a MedicalRecord with sensible defaults."""
    defaults = {
        "patient_id": patient_id,
        "record_type": "lab",
        "title": "Blood Panel",
        "description": "Routine blood work results",
        "date": "2026-01-15",
        "source": "Epic MyChart",
        "provider": "Dr. Smith",
        "flags": "[]",
    }
    defaults.update(overrides)
    return MedicalRecord(**defaults)


class TestListRecords:
    """GET /api/records"""

    def test_list_records_empty(self, client: TestClient, auth_headers: dict):
        """When there are no records, the endpoint returns an empty list."""
        resp = client.get("/api/records", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        assert resp.json() == [], "Should return an empty list when no records exist"

    def test_list_records_with_data(
        self, client: TestClient, auth_headers: dict, session: Session, demo_user
    ):
        """Adding a record to the DB makes it appear in the response."""
        rec = _make_record(
            demo_user.patient_id,
            title="CMP Panel",
            description="Complete Metabolic Panel",
            date="2026-02-01",
        )
        session.add(rec)
        session.commit()

        resp = client.get("/api/records", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1, "Expected exactly one record"
        assert data[0]["title"] == "CMP Panel"
        assert data[0]["type"] == "lab"

    def test_filter_by_type(
        self, client: TestClient, auth_headers: dict, session: Session, demo_user
    ):
        """Filtering by record_type returns only records of that type."""
        session.add(_make_record(demo_user.patient_id, record_type="lab", title="Lab A"))
        session.add(_make_record(demo_user.patient_id, record_type="medication", title="Med B"))
        session.add(_make_record(demo_user.patient_id, record_type="imaging", title="Img C"))
        session.commit()

        resp = client.get("/api/records?type=medication", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1, "Expected exactly one medication record"
        assert data[0]["title"] == "Med B"
        assert data[0]["type"] == "medication"

    def test_search_records(
        self, client: TestClient, auth_headers: dict, session: Session, demo_user
    ):
        """Searching by keyword matches against title and description."""
        session.add(
            _make_record(
                demo_user.patient_id,
                title="Hemoglobin A1c",
                description="A1c elevated at 6.1%",
            )
        )
        session.add(
            _make_record(
                demo_user.patient_id,
                title="Chest X-Ray",
                description="Lungs clear bilaterally",
            )
        )
        session.commit()

        resp = client.get("/api/records?search=hemoglobin", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1, "Expected exactly one matching record for 'hemoglobin'"
        assert data[0]["title"] == "Hemoglobin A1c"

    def test_search_records_matches_provider_source_and_flags(
        self, client: TestClient, auth_headers: dict, session: Session, demo_user
    ):
        """Search should also match source, provider, and serialized flags."""
        session.add(
            _make_record(
                demo_user.patient_id,
                title="Medication refill",
                description="Prescription renewed",
                source="Cleveland Clinic Portal",
                provider="Dr. Rivera",
                flags=json.dumps(["follow-up", "urgent"]),
            )
        )
        session.commit()

        provider_resp = client.get("/api/records?search=rivera", headers=auth_headers)
        assert provider_resp.status_code == 200
        assert len(provider_resp.json()) == 1

        source_resp = client.get("/api/records?search=cleveland", headers=auth_headers)
        assert source_resp.status_code == 200
        assert len(source_resp.json()) == 1

        flag_resp = client.get("/api/records?search=urgent", headers=auth_headers)
        assert flag_resp.status_code == 200
        assert len(flag_resp.json()) == 1

    def test_pagination(
        self, client: TestClient, auth_headers: dict, session: Session, demo_user
    ):
        """skip/limit query params return the correct subset of records."""
        for i in range(5):
            session.add(
                _make_record(
                    demo_user.patient_id,
                    title=f"Record {i}",
                    date=f"2026-01-{10 + i:02d}",
                )
            )
        session.commit()

        resp = client.get("/api/records?skip=0&limit=2", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2, "Expected exactly 2 records with limit=2"

        resp2 = client.get("/api/records?skip=2&limit=2", headers=auth_headers)
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert len(data2) == 2, "Expected 2 records for second page"

        # Ensure no overlap between pages
        titles_page1 = {r["title"] for r in data}
        titles_page2 = {r["title"] for r in data2}
        assert titles_page1.isdisjoint(titles_page2), "Pages should not overlap"

    def test_records_unauthenticated(self, client: TestClient):
        """Accessing records without a token returns 401."""
        resp = client.get("/api/records")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}: {resp.text}"


class TestDocumentUploads:
    """Document upload and download flows."""

    def test_upload_document_and_list_it(
        self, client: TestClient, auth_headers: dict, session: Session, demo_user
    ):
        response = client.post(
            "/api/records/documents",
            headers=auth_headers,
            data={
                "source_system": "eClinicalWorks",
                "source": "eClinicalWorks",
                "provider": "Dr. Avery",
                "facility": "Downtown Cardiology",
                "document_date": "2026-03-14",
                "record_type": "progress_note",
                "title": "After visit summary",
            },
            files={"file": ("visit-summary.pdf", b"demo-pdf", "application/pdf")},
        )

        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        payload = response.json()
        assert payload["type"] == "visit"
        assert payload["classification"] == "progress_note"
        assert payload["source_system"] == "eClinicalWorks"
        assert payload["facility"] == "Downtown Cardiology"
        assert payload["extraction_profile"] == "eclinicalworks__progress_note"
        assert payload["source_family"] == "ambulatory"
        assert "assessment" in payload["extraction_targets"]
        assert "patient_portal_layout" in payload["extraction_targets"]

        stored = session.get(MedicalDocument, payload["id"])
        assert stored is not None
        assert stored.patient_id == demo_user.patient_id
        assert stored.source_system == "eClinicalWorks"
        assert stored.facility == "Downtown Cardiology"
        assert decrypt_bytes(stored.encrypted_blob) == b"demo-pdf"

        list_response = client.get("/api/records?type=document", headers=auth_headers)
        assert list_response.status_code == 200
        records = list_response.json()
        assert len(records) == 1
        assert records[0]["title"] == "After visit summary"
        assert records[0]["download_url"] == f"/api/records/documents/{payload['id']}/download"

        visit_filter = client.get("/api/records?type=visit", headers=auth_headers)
        assert visit_filter.status_code == 200
        visit_records = visit_filter.json()
        assert len(visit_records) == 1
        assert visit_records[0]["classification"] == "progress_note"
        assert visit_records[0]["extraction_profile"] == "eclinicalworks__progress_note"
        assert "vitals" in visit_records[0]["extraction_targets"]

    def test_download_document_requires_matching_user(
        self, client: TestClient, auth_headers: dict, session: Session, demo_user
    ):
        document = MedicalDocument(
            patient_id=demo_user.patient_id,
            title="Imported lab",
            record_type="lab_result",
            source="VA Health",
            provider="Dr. House",
            document_date="2026-03-12",
            file_name="lab.pdf",
            content_type="application/pdf",
            encrypted_blob=encrypt_bytes(b"lab-data"),
        )
        session.add(document)
        session.commit()
        session.refresh(document)

        download = client.get(f"/api/records/documents/{document.id}/download", headers=auth_headers)
        assert download.status_code == 200
        assert download.content == b"lab-data"

    def test_document_intelligence_capabilities_include_major_systems(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.get("/api/records/document-intelligence", headers=auth_headers)
        assert response.status_code == 200
        payload = response.json()

        systems = {item["display_name"] for item in payload["source_systems"]}
        assert "Epic (MyChart)" in systems
        assert "Oracle Health (Cerner)" in systems
        assert "MEDITECH" in systems
        assert "athenahealth (athenaOne)" in systems
        assert "eClinicalWorks" in systems
        assert "NextGen Healthcare" in systems
        assert "Tebra (Kareo + PatientPop)" in systems
        assert "Practice Fusion" in systems
        assert "Greenway Health / Intergy" in systems
        assert "AdvancedMD" in systems
        assert "Allscripts / Veradigm" in systems
        assert "DrChrono" in systems
        assert "CureMD" in systems
        assert "Praxis EMR" in systems
        assert "Nextech" in systems
        assert "SimplePractice / TherapyNotes" in systems

        document_types = {item["value"]: item for item in payload["document_types"]}
        assert "progress_note" in document_types
        assert "assessment" in document_types["progress_note"]["default_targets"]
        assert payload["model_summary"]["generated_documents"] == 1000
        assert payload["model_summary"]["record_type_accuracy"] == 1.0

    def test_document_intelligence_classifier_returns_predictions(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.post(
            "/api/records/document-intelligence/classify",
            headers=auth_headers,
            json={
                "text": "\n".join(
                    [
                        "eClinicalWorks",
                        "Progress note",
                        "Patient: Marcus Johnson",
                        "Chief complaint: follow up for hypertension",
                        "Assessment: patient stable with ongoing monitoring needs.",
                        "Plan: continue medications and follow up in 3 months.",
                        "Vitals: BP 128/82, Pulse 72, Weight 182 lb.",
                    ]
                )
            },
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["source_system"]["label"] == "eclinicalworks"
        assert payload["record_type"]["label"] == "progress_note"
