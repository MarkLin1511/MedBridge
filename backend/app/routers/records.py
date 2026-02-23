import json
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import Optional
from ..db import get_session
from ..models import User, MedicalRecord
from ..auth import get_current_user

router = APIRouter(prefix="/api", tags=["records"])


@router.get("/records")
def get_records(
    type: Optional[str] = Query(default=None),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    stmt = select(MedicalRecord).where(MedicalRecord.patient_id == user.patient_id)
    if type and type != "all":
        stmt = stmt.where(MedicalRecord.record_type == type)
    stmt = stmt.order_by(MedicalRecord.date.desc())
    results = session.exec(stmt).all()
    return [
        {
            "id": r.id,
            "type": r.record_type,
            "title": r.title,
            "description": r.description,
            "date": r.date,
            "source": r.source,
            "provider": r.provider,
            "flags": r.get_flags(),
        }
        for r in results
    ]
