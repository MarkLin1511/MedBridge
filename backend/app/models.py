from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class LabObservation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str
    test_name: str
    loinc: Optional[str] = None
    value: float
    unit: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
