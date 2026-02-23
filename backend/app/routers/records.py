import json
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, or_
from typing import Optional
from app.db import get_session
from app.models import User, MedicalRecord
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["records"])


@router.get("/records")
def list_records(
    type: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    stmt = select(MedicalRecord).where(MedicalRecord.patient_id == user.patient_id)

    if type and type != "all":
        stmt = stmt.where(MedicalRecord.record_type == type)

    # Search by title or description
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                MedicalRecord.title.ilike(search_pattern),
                MedicalRecord.description.ilike(search_pattern),
            )
        )

    stmt = stmt.order_by(MedicalRecord.date.desc()).offset(skip).limit(limit)
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
