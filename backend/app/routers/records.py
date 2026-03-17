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
from app.document_intelligence import (
    build_extraction_profile,
    capability_payload,
    extraction_targets_for,
    iter_supported_record_types,
    normalize_source_system,
    profile_for_source_system,
)

router = APIRouter(prefix="/api", tags=["records"])

ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/tiff",
}
ALLOWED_RECORD_TYPES = set(iter_supported_record_types())
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


def _parse_sort_date(value: str) -> datetime:
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        return datetime.min


def _document_timeline_type(record_type: str) -> str:
    if record_type in {"lab_result", "pathology_report"}:
        return "lab"
    if record_type == "medication_list":
        return "medication"
    if record_type == "imaging_report":
        return "imaging"
    if record_type in {"wearable_report", "vitals_sheet"}:
        return "wearable"
    if record_type in {
        "care_plan",
        "consult_note",
        "discharge_summary",
        "encounter_summary",
        "history_and_physical",
        "operative_note",
        "progress_note",
        "referral_note",
        "therapy_note",
    }:
        return "visit"
    return "document"

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
                MedicalDocument.source_system.ilike(search_pattern),
                MedicalDocument.source.ilike(search_pattern),
                MedicalDocument.facility.ilike(search_pattern),
                MedicalDocument.provider.ilike(search_pattern),
                MedicalDocument.file_name.ilike(search_pattern),
                MedicalDocument.record_type.ilike(search_pattern),
                MedicalDocument.extraction_profile.ilike(search_pattern),
            )
        )

    records = session.exec(record_stmt).all()
    documents = session.exec(document_stmt).all()

    if type and type != "all":
        documents = [document for document in documents if _document_timeline_type(document.record_type) == type]

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
            "type": _document_timeline_type(document.record_type),
            "title": document.title,
            "description": f"Uploaded {document.file_name}",
            "date": document.document_date,
            "source_system": document.source_system,
            "source": document.source,
            "facility": document.facility,
            "provider": document.provider,
            "flags": ["Uploaded file"],
            "classification": document.record_type,
            "ocr_status": document.ocr_status,
            "extraction_status": document.extraction_status,
            "extraction_profile": document.extraction_profile,
            "source_family": profile_for_source_system(document.source_system).family,
            "extraction_targets": extraction_targets_for(document.record_type, document.source_system),
            "download_url": f"/api/records/documents/{document.id}/download",
        }
        for document in documents
    ]

    combined.sort(key=lambda item: _parse_sort_date(item["date"]), reverse=True)
    return combined[skip: skip + limit]


@router.post("/records/documents")
async def upload_document(
    file: UploadFile = File(...),
    source_system: str = Form(...),
    source: str = Form(...),
    facility: Optional[str] = Form(default=None),
    provider: str = Form(...),
    document_date: str = Form(...),
    record_type: str = Form(...),
    title: str = Form(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if file.content_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type. Upload a PDF or common medical image format.")
    if record_type not in ALLOWED_RECORD_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported medical document type.")

    try:
        datetime.strptime(document_date, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Document date must be YYYY-MM-DD.") from exc

    clean_title = title.strip() or (file.filename or "Uploaded document")
    clean_source_system = source_system.strip()
    clean_source = source.strip()
    clean_facility = facility.strip() if facility else None
    clean_provider = provider.strip()
    if not clean_source_system or not clean_source or not clean_provider:
        raise HTTPException(status_code=400, detail="Source system, source label, and provider are required.")

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File is too large. Max size is 8 MB.")

    document = MedicalDocument(
        patient_id=user.patient_id,
        title=clean_title,
        record_type=record_type,
        source_system=clean_source_system,
        source=clean_source,
        facility=clean_facility,
        provider=clean_provider,
        document_date=document_date,
        file_name=file.filename or "document",
        content_type=file.content_type or "application/octet-stream",
        extraction_profile=build_extraction_profile(clean_source_system, record_type),
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
        "source_system": document.source_system,
        "source": document.source,
        "facility": document.facility,
        "provider": document.provider,
        "type": _document_timeline_type(document.record_type),
        "classification": document.record_type,
        "ocr_status": document.ocr_status,
        "extraction_status": document.extraction_status,
        "extraction_profile": document.extraction_profile,
        "source_family": profile_for_source_system(document.source_system).family,
        "extraction_targets": extraction_targets_for(document.record_type, document.source_system),
        "download_url": f"/api/records/documents/{document.id}/download",
    }


@router.get("/records/document-intelligence")
def get_document_intelligence_capabilities(
    user: User = Depends(get_current_user),
):
    return capability_payload()


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
