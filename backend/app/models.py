from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field


class LabObservation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    test_name: str
    loinc: Optional[str] = None
    value: float
    unit: Optional[str] = None
    source: Optional[str] = Field(default=None, description="Portal or system the result came from")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
