from datetime import datetime, timezone
from sqlalchemy import false
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from sqlmodel import Session, select, or_
from typing import Optional
from pydantic import BaseModel
from app.db import get_session
from app.models import User, MedicalRecord, MedicalDocument, AuditLog, DocumentReviewItem
from app.auth import get_current_user
from app.encryption import encrypt_bytes, decrypt_bytes
from app.document_intelligence import (
    build_extraction_profile,
    capability_payload,
    extraction_targets_for,
    iter_supported_record_types,
    profile_for_source_system,
)
from app.document_extraction import extract_document
from app.document_ai import build_review_draft, create_review_item, persist_review_approval
from app.document_profile_model import classify_text, model_summary

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


class DocumentClassificationRequest(BaseModel):
    text: str


def _review_counts(payload: dict) -> dict[str, int]:
    return {
        "labs": len(payload.get("labs", [])),
        "medications": len(payload.get("medications", [])),
        "conditions": len(payload.get("conditions", [])),
        "vitals": len(payload.get("vitals", [])),
        "care_plan": len(payload.get("care_plan", [])),
    }


def _latest_review_items(review_items: list[DocumentReviewItem]) -> dict[int, DocumentReviewItem]:
    latest_by_document: dict[int, DocumentReviewItem] = {}
    for item in sorted(review_items, key=lambda current: current.created_at):
        latest_by_document[item.document_id] = item
    return latest_by_document


def _serialize_review_item(review_item: DocumentReviewItem, document: MedicalDocument) -> dict:
    payload = review_item.get_payload()
    return {
        "id": review_item.id,
        "document_id": document.id,
        "document_title": document.title,
        "document_date": document.document_date,
        "source": document.source,
        "source_system": document.source_system,
        "provider": document.provider,
        "facility": document.facility,
        "status": review_item.status,
        "confidence": review_item.confidence,
        "summary": review_item.summary,
        "caution_flags": review_item.get_caution_flags(),
        "model_name": review_item.model_name,
        "extraction_engine": review_item.extraction_engine,
        "source_mode": review_item.source_mode,
        "refusal_reason": review_item.refusal_reason,
        "counts": _review_counts(payload),
        "findings": payload,
        "created_at": review_item.created_at.isoformat(),
        "download_url": f"/api/records/documents/{document.id}/download",
    }


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
    all_record_stmt = select(MedicalRecord).where(MedicalRecord.patient_id == user.patient_id)
    review_stmt = select(DocumentReviewItem).where(DocumentReviewItem.patient_id == user.patient_id)

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
    all_patient_records = session.exec(all_record_stmt).all()
    review_items = session.exec(review_stmt).all()
    latest_review_by_document = _latest_review_items(review_items)
    derived_counts: dict[int, int] = {}
    for record in all_patient_records:
        for flag in record.get_flags():
            if isinstance(flag, str) and flag.startswith("document:"):
                try:
                    document_id = int(flag.split(":", 1)[1])
                except ValueError:
                    continue
                derived_counts[document_id] = derived_counts.get(document_id, 0) + 1

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
            "flags": [
                "Uploaded file",
                *(
                    ["Ready for review"]
                    if latest_review_by_document.get(document.id) and latest_review_by_document[document.id].status == "pending_review"
                    else []
                ),
                *( [f"Extracted {derived_counts.get(document.id, 0)} items"] if derived_counts.get(document.id, 0) else []),
            ],
            "classification": document.record_type,
            "ocr_status": document.ocr_status,
            "extraction_status": document.extraction_status,
            "extraction_profile": document.extraction_profile,
            "source_family": profile_for_source_system(document.source_system).family,
            "extraction_targets": extraction_targets_for(document.record_type, document.source_system),
            "derived_records_count": derived_counts.get(document.id, 0),
            "review_item_id": latest_review_by_document[document.id].id if latest_review_by_document.get(document.id) else None,
            "review_status": latest_review_by_document[document.id].status if latest_review_by_document.get(document.id) else None,
            "review_summary": latest_review_by_document[document.id].summary if latest_review_by_document.get(document.id) else None,
            "review_confidence": latest_review_by_document[document.id].confidence if latest_review_by_document.get(document.id) else None,
            "review_caution_flags": latest_review_by_document[document.id].get_caution_flags() if latest_review_by_document.get(document.id) else [],
            "review_counts": _review_counts(latest_review_by_document[document.id].get_payload()) if latest_review_by_document.get(document.id) else None,
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
    extracted_text: Optional[str] = Form(default=None),
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
    normalized_supplied_text = (extracted_text or "").strip() or None
    extracted_content, ocr_status, _extraction_status, text_length = extract_document(document, payload, normalized_supplied_text)
    document.ocr_status = ocr_status
    derived_records_count = 0
    review_item: DocumentReviewItem | None = None
    if document.content_type == "application/pdf" or normalized_supplied_text or extracted_content:
        draft_build = build_review_draft(document, payload, normalized_supplied_text or extracted_content)
        review_item = create_review_item(document, draft_build)
        session.add(review_item)
        document.extraction_status = "ready_for_review"
    else:
        document.extraction_status = "needs_review"
    session.add(AuditLog(
        patient_id=user.patient_id,
        action=f"Uploaded {document.file_name}",
        performed_by="You",
        icon="download",
        resource=f"document:{document.id}",
    ))
    session.commit()
    session.refresh(document)
    if review_item:
        session.refresh(review_item)

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
        "derived_records_count": derived_records_count,
        "extracted_text_length": text_length,
        "review_item_id": review_item.id if review_item else None,
        "review_status": review_item.status if review_item else None,
        "review_summary": review_item.summary if review_item else None,
        "review_confidence": review_item.confidence if review_item else None,
        "review_caution_flags": review_item.get_caution_flags() if review_item else [],
        "review_counts": _review_counts(review_item.get_payload()) if review_item else None,
        "download_url": f"/api/records/documents/{document.id}/download",
    }


@router.get("/records/document-intelligence")
def get_document_intelligence_capabilities(
    user: User = Depends(get_current_user),
):
    payload = capability_payload()
    payload["model_summary"] = model_summary()
    return payload


@router.post("/records/document-intelligence/classify")
def classify_document_text(
    request: DocumentClassificationRequest,
    user: User = Depends(get_current_user),
):
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Document text is required for classification.")

    result = classify_text(text)
    if not result:
        raise HTTPException(status_code=503, detail="Document profile model is not available yet.")
    return result


@router.get("/records/review-queue")
def get_review_queue(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    review_items = session.exec(
        select(DocumentReviewItem).where(
            DocumentReviewItem.patient_id == user.patient_id,
            DocumentReviewItem.status == "pending_review",
        )
    ).all()
    document_ids = [item.document_id for item in review_items]
    documents = {
        document.id: document
        for document in session.exec(select(MedicalDocument).where(MedicalDocument.id.in_(document_ids))).all()
    } if document_ids else {}

    serialized = [
        _serialize_review_item(review_item, documents[review_item.document_id])
        for review_item in sorted(review_items, key=lambda current: current.created_at, reverse=True)
        if review_item.document_id in documents
    ]
    return serialized


@router.post("/records/review-queue/{review_id}/approve")
def approve_review_item(
    review_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    review_item = session.get(DocumentReviewItem, review_id)
    if not review_item or review_item.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Review item not found.")
    if review_item.status != "pending_review":
        raise HTTPException(status_code=409, detail="This extraction has already been reviewed.")

    document = session.get(MedicalDocument, review_item.document_id)
    if not document or document.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Document not found.")

    created_items = persist_review_approval(session, user, document, review_item)
    review_item.status = "approved"
    review_item.reviewed_by = "You"
    review_item.reviewed_at = datetime.now(timezone.utc)
    document.extraction_status = "approved_review"
    session.add(review_item)
    session.add(document)
    session.commit()
    return {"status": "approved", "created_items": created_items}


@router.post("/records/review-queue/{review_id}/reject")
def reject_review_item(
    review_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    review_item = session.get(DocumentReviewItem, review_id)
    if not review_item or review_item.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Review item not found.")
    if review_item.status != "pending_review":
        raise HTTPException(status_code=409, detail="This extraction has already been reviewed.")

    document = session.get(MedicalDocument, review_item.document_id)
    if not document or document.patient_id != user.patient_id:
        raise HTTPException(status_code=404, detail="Document not found.")

    review_item.status = "rejected"
    review_item.reviewed_by = "You"
    review_item.reviewed_at = datetime.now(timezone.utc)
    document.extraction_status = "rejected_review"
    session.add(review_item)
    session.add(document)
    session.add(
        AuditLog(
            patient_id=user.patient_id,
            action=f"Rejected AI extraction for {document.file_name}",
            performed_by="You",
            icon="eye",
            resource=f"document:{document.id}",
        )
    )
    session.commit()
    return {"status": "rejected"}


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
