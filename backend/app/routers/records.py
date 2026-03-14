from datetime import datetime
from sqlalchemy import false
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from sqlmodel import Session, select, or_
from typing import Optional
from app.db import get_session
from app.models import User, MedicalRecord, MedicalDocument, AuditLog
from app.auth import get_current_user
from app.encryption import encrypt_bytes, decrypt_bytes

router = APIRouter(prefix="/api", tags=["records"])

ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}
ALLOWED_RECORD_TYPES = {"lab", "medication", "imaging", "visit", "wearable", "general"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


def _parse_sort_date(value: str) -> datetime:
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        return datetime.min


@router.get("/records")
def list_records(
    type: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    record_stmt = select(MedicalRecord).where(MedicalRecord.patient_id == user.patient_id)
    document_stmt = select(MedicalDocument).where(MedicalDocument.patient_id == user.patient_id)

    if type and type != "all":
        if type == "document":
            record_stmt = record_stmt.where(false())
        else:
            record_stmt = record_stmt.where(MedicalRecord.record_type == type)
            document_stmt = document_stmt.where(MedicalDocument.record_type == type)

    if search:
        search_pattern = f"%{search}%"
        record_stmt = record_stmt.where(
            or_(
                MedicalRecord.title.ilike(search_pattern),
                MedicalRecord.description.ilike(search_pattern),
                MedicalRecord.source.ilike(search_pattern),
                MedicalRecord.provider.ilike(search_pattern),
                MedicalRecord.flags.ilike(search_pattern),
            )
        )
        document_stmt = document_stmt.where(
            or_(
                MedicalDocument.title.ilike(search_pattern),
                MedicalDocument.source.ilike(search_pattern),
                MedicalDocument.provider.ilike(search_pattern),
                MedicalDocument.file_name.ilike(search_pattern),
                MedicalDocument.record_type.ilike(search_pattern),
            )
        )

    records = session.exec(record_stmt).all()
    documents = session.exec(document_stmt).all()

    combined = [
        {
            "id": record.id,
            "type": record.record_type,
            "title": record.title,
            "description": record.description,
            "date": record.date,
            "source": record.source,
            "provider": record.provider,
            "flags": record.get_flags(),
            "classification": None,
            "download_url": None,
        }
        for record in records
    ] + [
        {
            "id": document.id,
            "type": "document",
            "title": document.title,
            "description": f"Uploaded {document.file_name}",
            "date": document.document_date,
            "source": document.source,
            "provider": document.provider,
            "flags": ["Uploaded file"],
            "classification": document.record_type,
            "download_url": f"/api/records/documents/{document.id}/download",
        }
        for document in documents
    ]

    combined.sort(key=lambda item: _parse_sort_date(item["date"]), reverse=True)
    return combined[skip: skip + limit]


@router.post("/records/documents")
async def upload_document(
    file: UploadFile = File(...),
    source: str = Form(...),
    provider: str = Form(...),
    document_date: str = Form(...),
    record_type: str = Form(...),
    title: str = Form(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if file.content_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type. Upload a PDF or image.")
    if record_type not in ALLOWED_RECORD_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported record type.")

    try:
        datetime.strptime(document_date, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Document date must be YYYY-MM-DD.") from exc

    clean_title = title.strip() or (file.filename or "Uploaded document")
    clean_source = source.strip()
    clean_provider = provider.strip()
    if not clean_source or not clean_provider:
        raise HTTPException(status_code=400, detail="Source and provider are required.")

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File is too large. Max size is 8 MB.")

    document = MedicalDocument(
        patient_id=user.patient_id,
        title=clean_title,
        record_type=record_type,
        source=clean_source,
        provider=clean_provider,
        document_date=document_date,
        file_name=file.filename or "document",
        content_type=file.content_type or "application/octet-stream",
        encrypted_blob=encrypt_bytes(payload),
    )
    session.add(document)
    session.flush()
    session.add(AuditLog(
        patient_id=user.patient_id,
        action=f"Uploaded {document.file_name}",
        performed_by="You",
        icon="download",
        resource=f"document:{document.id}",
    ))
    session.commit()
    session.refresh(document)

    return {
        "id": document.id,
        "title": document.title,
        "date": document.document_date,
        "source": document.source,
        "provider": document.provider,
        "type": "document",
        "classification": document.record_type,
        "download_url": f"/api/records/documents/{document.id}/download",
    }


@router.get("/records/documents/{document_id}/download")
def download_document(
    document_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    document = session.get(MedicalDocument, document_id)
    if not document or document.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Document not found.")

    return Response(
        content=decrypt_bytes(document.encrypted_blob),
        media_type=document.content_type,
        headers={"Content-Disposition": f'attachment; filename="{document.file_name}"'},
    )
