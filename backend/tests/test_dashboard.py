from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.models import DocumentReviewItem, LabObservation, MedicalDocument, MedicalRecord, PortalConnection, WearableData


class TestDashboard:
    def test_dashboard_returns_quantified_sections(
        self, client: TestClient, auth_headers: dict, session: Session, demo_user
    ):
        session.add(
            PortalConnection(
                patient_id=demo_user.patient_id,
                name="Epic MyChart",
                doctors="300,000+",
                status="connected",
                color="bg-violet-50",
            )
        )
        session.add(
            WearableData(
                patient_id=demo_user.patient_id,
                metric="heart_rate",
                value="68 bpm",
                trend="stable",
                period="Last 7 days",
                source="Apple Watch",
            )
        )
        session.add(
            LabObservation(
                patient_id=demo_user.patient_id,
                test_name="Hemoglobin A1c",
                value=5.8,
                unit="%",
                ref_range="4.0-5.6",
                status="high",
                source="Epic MyChart",
                timestamp=datetime.now(timezone.utc),
            )
        )
        document = MedicalDocument(
            patient_id=demo_user.patient_id,
            title="Outside lab summary",
            record_type="lab_result",
            source_system="Epic (MyChart)",
            source="Epic portal",
            provider="Dr. Rivera",
            document_date="2026-03-23",
            file_name="labs.pdf",
            content_type="application/pdf",
            extraction_profile="epic_mychart__lab_result",
            extraction_status="ready_for_review",
            encrypted_blob="encrypted",
        )
        session.add(document)
        session.commit()
        session.refresh(document)

        session.add(
            DocumentReviewItem(
                patient_id=demo_user.patient_id,
                document_id=document.id,
                status="pending_review",
                extraction_engine="openai_responses",
                source_mode="openai_pdf",
                confidence=0.91,
                summary="2 lab findings extracted",
                structured_payload="{}",
            )
        )
        session.add(
            MedicalRecord(
                patient_id=demo_user.patient_id,
                record_type="lab",
                title="A1c imported",
                description="5.8%",
                date="2026-03-23",
                source="Epic MyChart",
                provider="Dr. Rivera",
                flags="[]",
            )
        )
        session.commit()

        response = client.get("/api/dashboard", headers=auth_headers)
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["quantified_overview"]["score"] >= 0
        assert len(payload["health_axes"]) == 4
        assert payload["summary"]["pending_reviews"] == 1
        assert payload["summary"]["uploaded_documents"] == 1
        assert payload["translation"]["exportable_resources"] >= 2
        assert payload["ingestion"]["recent_documents"][0]["title"] == "Outside lab summary"

    def test_manual_lab_entry_creates_lab_and_record(
        self, client: TestClient, auth_headers: dict, session: Session, demo_user
    ):
        response = client.post(
            "/api/dashboard/manual-labs",
            headers=auth_headers,
            json={
                "test_name": "Glucose (fasting)",
                "value": 104,
                "unit": "mg/dL",
                "ref_range": "70-100",
                "source": "Manual entry",
                "collected_on": "2026-03-23",
            },
        )

        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["test_name"] == "Glucose (fasting)"
        assert payload["status"] == "high"

        labs = session.exec(select(LabObservation).where(LabObservation.patient_id == demo_user.patient_id)).all()
        assert len(labs) == 1
        assert labs[0].source == "Manual entry"

        records = session.exec(select(MedicalRecord).where(MedicalRecord.patient_id == demo_user.patient_id)).all()
        assert len(records) == 1
        assert records[0].title == "Glucose (fasting)"

        dashboard = client.get("/api/dashboard", headers=auth_headers)
        assert dashboard.status_code == 200
        assert dashboard.json()["summary"]["manual_lab_entries"] == 1
