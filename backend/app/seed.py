"""
Seed script for MedBridge demo data.
Run: cd backend && python -m app.seed
Creates a demo patient with realistic health scenario.
Login: marcus.johnson@email.com / demo1234
"""
import json
from datetime import datetime, timedelta, timezone
from sqlmodel import SQLModel, Session, select
from .db import engine
from .models import (
    User, LabObservation, MedicalRecord, WearableData,
    ProviderAccess, PortalConnection, AuditLog, Notification,
)
from .auth import hash_password


def seed():
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # Check if already seeded
        existing = session.exec(select(User).where(User.email == "marcus.johnson@email.com")).first()
        if existing:
            print("Demo data already exists. Skipping seed.")
            return

        now = datetime.now(timezone.utc)

        # ─── Demo User ───────────────────────────────────────────
        user = User(
            email="marcus.johnson@email.com",
            first_name="Marcus",
            last_name="Johnson",
            role="patient",
            hashed_password=hash_password("demo1234"),
            patient_id="MBR-20240001",
            dob="1988-03-14",
            two_factor_enabled=True,
            share_labs=True,
            share_wearable=True,
            allow_export=True,
            require_approval=True,
        )
        session.add(user)
        session.flush()

        pid = "MBR-20240001"

        # ─── Lab Observations ────────────────────────────────────
        labs = [
            # Glucose trend (pre-diabetes progression)
            {"test_name": "Glucose (fasting)", "loinc": "1558-6", "value": 95, "unit": "mg/dL", "ref_range": "70-100", "status": "normal", "source": "Epic MyChart", "timestamp": now - timedelta(days=240)},
            {"test_name": "Glucose (fasting)", "loinc": "1558-6", "value": 98, "unit": "mg/dL", "ref_range": "70-100", "status": "normal", "source": "Epic MyChart", "timestamp": now - timedelta(days=180)},
            {"test_name": "Glucose (fasting)", "loinc": "1558-6", "value": 105, "unit": "mg/dL", "ref_range": "70-100", "status": "high", "source": "VA Health", "timestamp": now - timedelta(days=120)},
            {"test_name": "Glucose (fasting)", "loinc": "1558-6", "value": 108, "unit": "mg/dL", "ref_range": "70-100", "status": "high", "source": "Epic MyChart", "timestamp": now - timedelta(days=60)},
            {"test_name": "Glucose (fasting)", "loinc": "1558-6", "value": 112, "unit": "mg/dL", "ref_range": "70-100", "status": "high", "source": "VA Health", "timestamp": now - timedelta(days=26)},
            # A1c trend
            {"test_name": "Hemoglobin A1c", "loinc": "4548-4", "value": 5.4, "unit": "%", "ref_range": "4.0-5.6", "status": "normal", "source": "Epic MyChart", "timestamp": now - timedelta(days=330)},
            {"test_name": "Hemoglobin A1c", "loinc": "4548-4", "value": 5.5, "unit": "%", "ref_range": "4.0-5.6", "status": "normal", "source": "Epic MyChart", "timestamp": now - timedelta(days=240)},
            {"test_name": "Hemoglobin A1c", "loinc": "4548-4", "value": 5.7, "unit": "%", "ref_range": "4.0-5.6", "status": "high", "source": "VA Health", "timestamp": now - timedelta(days=150)},
            {"test_name": "Hemoglobin A1c", "loinc": "4548-4", "value": 5.9, "unit": "%", "ref_range": "4.0-5.6", "status": "high", "source": "Epic MyChart", "timestamp": now - timedelta(days=60)},
            {"test_name": "Hemoglobin A1c", "loinc": "4548-4", "value": 6.1, "unit": "%", "ref_range": "4.0-5.6", "status": "high", "source": "VA Health", "timestamp": now - timedelta(days=26)},
            # Cholesterol trend
            {"test_name": "Cholesterol (total)", "loinc": "2093-3", "value": 195, "unit": "mg/dL", "ref_range": "<200", "status": "normal", "source": "Epic MyChart", "timestamp": now - timedelta(days=330)},
            {"test_name": "Cholesterol (total)", "loinc": "2093-3", "value": 200, "unit": "mg/dL", "ref_range": "<200", "status": "normal", "source": "Epic MyChart", "timestamp": now - timedelta(days=240)},
            {"test_name": "Cholesterol (total)", "loinc": "2093-3", "value": 208, "unit": "mg/dL", "ref_range": "<200", "status": "high", "source": "VA Health", "timestamp": now - timedelta(days=150)},
            {"test_name": "Cholesterol (total)", "loinc": "2093-3", "value": 215, "unit": "mg/dL", "ref_range": "<200", "status": "high", "source": "Epic MyChart", "timestamp": now - timedelta(days=60)},
            # Other labs from CMP panel
            {"test_name": "Potassium", "loinc": "2823-3", "value": 4.1, "unit": "mmol/L", "ref_range": "3.5-5.0", "status": "normal", "source": "Epic MyChart", "timestamp": now - timedelta(days=13)},
            {"test_name": "Sodium", "loinc": "2951-2", "value": 141, "unit": "mmol/L", "ref_range": "136-145", "status": "normal", "source": "Epic MyChart", "timestamp": now - timedelta(days=13)},
            {"test_name": "Calcium", "loinc": "17861-6", "value": 9.8, "unit": "mg/dL", "ref_range": "8.5-10.5", "status": "normal", "source": "Epic MyChart", "timestamp": now - timedelta(days=13)},
            {"test_name": "Creatinine", "loinc": "2160-0", "value": 1.0, "unit": "mg/dL", "ref_range": "0.7-1.3", "status": "normal", "source": "VA Health", "timestamp": now - timedelta(days=26)},
            {"test_name": "TSH", "loinc": "3016-3", "value": 2.4, "unit": "mIU/L", "ref_range": "0.4-4.0", "status": "normal", "source": "Epic MyChart", "timestamp": now - timedelta(days=70)},
        ]
        for lab_data in labs:
            session.add(LabObservation(patient_id=pid, **lab_data))

        # ─── Medical Records ─────────────────────────────────────
        records = [
            {"record_type": "lab", "title": "Complete Metabolic Panel (CMP)", "description": "Potassium 4.1 mmol/L, Sodium 141 mmol/L, Calcium 9.8 mg/dL, Glucose 112 mg/dL", "date": "2026-02-10", "source": "Epic MyChart", "provider": "Dr. Sarah Chen", "flags": json.dumps(["Glucose: High"])},
            {"record_type": "wearable", "title": "Weekly Health Summary", "description": "Avg HR: 72 bpm, Avg HRV: 42 ms, Sleep: 7.2h avg, Steps: 8,400 avg/day", "date": "2026-02-09", "source": "Apple Watch", "provider": "Self-reported", "flags": "[]"},
            {"record_type": "lab", "title": "Hemoglobin A1c + Fasting Glucose", "description": "A1c: 6.1% (High), Fasting Glucose: 112 mg/dL (High), Creatinine: 1.0 mg/dL", "date": "2026-01-28", "source": "VA Health", "provider": "Dr. James Wright", "flags": json.dumps(["A1c: High", "Glucose: High"])},
            {"record_type": "medication", "title": "Metformin 500mg prescribed", "description": "Take once daily with dinner. Monitor blood glucose weekly. Follow up in 3 months.", "date": "2026-01-28", "source": "VA Health", "provider": "Dr. James Wright", "flags": "[]"},
            {"record_type": "visit", "title": "Annual Physical Exam", "description": "BP: 128/82, Weight: 185 lbs, BMI: 26.1. Pre-diabetic markers discussed. Lifestyle modifications recommended.", "date": "2026-01-15", "source": "Epic MyChart", "provider": "Dr. Sarah Chen", "flags": "[]"},
            {"record_type": "lab", "title": "Lipid Panel + TSH", "description": "Total Cholesterol: 215 mg/dL (High), LDL: 140 mg/dL, HDL: 48 mg/dL, TSH: 2.4 mIU/L", "date": "2025-12-15", "source": "Epic MyChart", "provider": "Dr. Sarah Chen", "flags": json.dumps(["Cholesterol: High"])},
            {"record_type": "imaging", "title": "Chest X-Ray", "description": "No acute cardiopulmonary process. Heart size normal. Lungs clear bilaterally.", "date": "2025-11-20", "source": "VA Health", "provider": "Dr. Maria Lopez", "flags": "[]"},
            {"record_type": "visit", "title": "Cardiology Consultation", "description": "Elevated cholesterol discussed. Statin therapy considered but deferred for lifestyle changes. Recheck in 6 months.", "date": "2025-11-10", "source": "Epic MyChart", "provider": "Dr. Raj Patel", "flags": "[]"},
        ]
        for rec_data in records:
            session.add(MedicalRecord(patient_id=pid, **rec_data))

        # ─── Wearable Data ───────────────────────────────────────
        wearables = [
            {"metric": "heart_rate", "value": "72 bpm", "trend": "stable", "period": "Last 7 days", "source": "Apple Watch Series 9"},
            {"metric": "hrv", "value": "42 ms", "trend": "up", "period": "Last 7 days", "source": "Apple Watch Series 9"},
            {"metric": "blood_pressure", "value": "128/82", "trend": "stable", "period": "Last reading", "source": "Apple Watch Series 9"},
            {"metric": "resting_hr", "value": "64 bpm", "trend": "down", "period": "Last 30 days", "source": "Apple Watch Series 9"},
        ]
        for w_data in wearables:
            session.add(WearableData(patient_id=pid, **w_data))

        # ─── Provider Access ─────────────────────────────────────
        providers = [
            {"provider_name": "Dr. Sarah Chen", "specialty": "Primary Care", "facility": "Bay Area Medical Group", "portal": "Epic MyChart", "access_level": "Full records", "status": "active", "last_access": "2 hours ago"},
            {"provider_name": "Dr. James Wright", "specialty": "Internal Medicine", "facility": "VA Palo Alto Health Care", "portal": "VA Health", "access_level": "Full records", "status": "active", "last_access": "3 weeks ago"},
            {"provider_name": "Dr. Raj Patel", "specialty": "Cardiology", "facility": "Stanford Heart Center", "portal": "Epic MyChart", "access_level": "Labs & vitals only", "status": "active", "last_access": "2 days ago"},
            {"provider_name": "Dr. Maria Lopez", "specialty": "Radiology", "facility": "VA Palo Alto Health Care", "portal": "VA Health", "access_level": "Imaging records", "status": "pending", "requested_access": "Imaging records", "request_date": "2026-02-18"},
        ]
        for p_data in providers:
            session.add(ProviderAccess(patient_id=pid, **p_data))

        # ─── Portal Connections ───────────────────────────────────
        portal_list = [
            {"name": "Epic MyChart", "doctors": "300,000+", "status": "connected", "color": "bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800"},
            {"name": "VA Health", "doctors": "150,000+", "status": "connected", "color": "bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"},
            {"name": "Cerner / Oracle Health", "doctors": "250,000+", "status": "available", "color": "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"},
            {"name": "Athenahealth", "doctors": "160,000+", "status": "available", "color": "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"},
            {"name": "Apple Health", "doctors": "N/A", "status": "connected", "color": "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"},
            {"name": "Allscripts", "doctors": "180,000+", "status": "available", "color": "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"},
        ]
        for portal_data in portal_list:
            session.add(PortalConnection(patient_id=pid, **portal_data))

        # ─── Audit Log ───────────────────────────────────────────
        audit_entries = [
            {"action": "Lab results viewed", "performed_by": "Dr. Sarah Chen (PCP)", "icon": "eye", "created_at": now - timedelta(hours=2)},
            {"action": "Wearable data synced", "performed_by": "Apple Watch", "icon": "sync", "created_at": now - timedelta(hours=6)},
            {"action": "Records shared", "performed_by": "You → Dr. Patel (Cardiology)", "icon": "share", "created_at": now - timedelta(days=2)},
            {"action": "Lab results ingested", "performed_by": "VA Health Portal", "icon": "download", "created_at": now - timedelta(weeks=3)},
            {"action": "Annual physical completed", "performed_by": "Dr. Sarah Chen (PCP)", "icon": "eye", "created_at": now - timedelta(days=39)},
            {"action": "Portal connected", "performed_by": "You", "icon": "sync", "created_at": now - timedelta(days=90)},
        ]
        for a_data in audit_entries:
            session.add(AuditLog(patient_id=pid, **a_data))

        # ─── Notifications ────────────────────────────────────────
        notifications = [
            {"notification_type": "lab_result", "title": "New lab results", "message": "Your Complete Metabolic Panel results from Epic MyChart are ready to view.", "read": False, "created_at": now - timedelta(hours=1)},
            {"notification_type": "provider_request", "title": "Provider access request", "message": "Dr. Maria Lopez (Radiology) is requesting access to your imaging records.", "read": False, "created_at": now - timedelta(hours=3)},
            {"notification_type": "wearable_sync", "title": "Wearable sync complete", "message": "Your Apple Watch data has been synced. 7-day health summary is ready.", "read": False, "created_at": now - timedelta(hours=6)},
            {"notification_type": "system", "title": "Weekly health summary", "message": "Your weekly health summary for Feb 10-16 is available.", "read": True, "created_at": now - timedelta(days=3)},
            {"notification_type": "lab_result", "title": "A1c results flagged", "message": "Your Hemoglobin A1c from VA Health shows elevated levels (6.1%). Consider discussing with your provider.", "read": True, "created_at": now - timedelta(days=26)},
        ]
        for n_data in notifications:
            session.add(Notification(patient_id=pid, **n_data))

        session.commit()
        print("Demo data seeded successfully!")
        print("Login: marcus.johnson@email.com / demo1234")


if __name__ == "__main__":
    seed()
