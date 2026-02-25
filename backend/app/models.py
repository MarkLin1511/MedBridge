from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
import json


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    first_name: str
    last_name: str
    role: str = Field(default="patient")  # patient, provider, admin
    hashed_password: str
    patient_id: str = Field(unique=True, index=True)
    dob: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    two_factor_enabled: bool = Field(default=False)
    session_timeout: int = Field(default=30)
    share_labs: bool = Field(default=True)
    share_wearable: bool = Field(default=True)
    allow_export: bool = Field(default=True)
    require_approval: bool = Field(default=True)
    notify_labs: str = Field(default="email_push")
    notify_provider_requests: str = Field(default="email_push")
    notify_wearable_sync: str = Field(default="push")
    notify_weekly_summary: str = Field(default="email")


class LabObservation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    test_name: str
    loinc: Optional[str] = None
    value: float
    unit: Optional[str] = None
    ref_range: Optional[str] = None
    status: Optional[str] = None  # normal, high, low
    source: Optional[str] = Field(default=None)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MedicalRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    record_type: str  # lab, medication, imaging, visit, wearable
    title: str
    description: str
    date: str
    source: str
    provider: str
    flags: str = Field(default="[]")  # JSON array of flag strings
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def get_flags(self) -> list:
        return json.loads(self.flags) if self.flags else []


class WearableData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    metric: str  # heart_rate, hrv, blood_pressure, resting_hr, steps, sleep
    value: str
    trend: Optional[str] = None  # up, down, stable
    period: Optional[str] = None
    source: str = Field(default="Apple Watch")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProviderAccess(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    provider_name: str
    specialty: str
    facility: str
    portal: str
    access_level: str = Field(default="Full records")
    status: str = Field(default="active")  # active, pending, revoked
    requested_access: Optional[str] = None  # for pending requests
    request_date: Optional[str] = None
    last_access: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PortalConnection(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    name: str
    doctors: str  # e.g. "300,000+"
    status: str = Field(default="available")  # connected, available
    color: str = Field(default="")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    action: str
    performed_by: str
    icon: str = Field(default="eye")  # eye, sync, share, download
    ip_address: Optional[str] = None
    resource: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    notification_type: str  # lab_result, provider_request, wearable_sync, system
    title: str
    message: str
    read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FHIRConnection(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    ehr_name: str  # epic, cerner, generic
    fhir_base_url: str
    access_token: str  # encrypted via encryption module
    refresh_token: Optional[str] = None  # encrypted via encryption module
    token_expires_at: Optional[datetime] = None
    patient_fhir_id: Optional[str] = None
    status: str = Field(default="active")  # active, expired, revoked
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_synced_at: Optional[datetime] = None
