from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import base64
import json
import os
from typing import Literal
from urllib import error as urllib_error
from urllib import request as urllib_request

from pydantic import BaseModel, Field, ValidationError
from sqlmodel import Session

from app.document_extraction import (
    BP_PATTERN,
    HEART_RATE_PATTERN,
    LAB_CATALOG,
    LAB_LINE_PATTERN,
    MEDICATION_PATTERN,
    WEIGHT_PATTERN,
    ExtractionArtifact,
)
from app.models import AuditLog, DocumentReviewItem, LabObservation, MedicalDocument, MedicalRecord, User, WearableData


OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
DEFAULT_DOCUMENT_MODEL = os.environ.get("OPENAI_DOCUMENT_MODEL", "gpt-5.4")
MAX_SUPPLEMENTAL_TEXT_CHARS = 18000


class ReviewLab(BaseModel):
    test_name: str
    value_text: str = ""
    numeric_value: float | None = None
    unit: str | None = None
    reference_range: str | None = None
    status: Literal["high", "low", "normal", "abnormal", "unknown"] = "unknown"
    note: str | None = None


class ReviewMedication(BaseModel):
    name: str
    dose: str | None = None
    frequency: str | None = None
    status: str | None = None
    note: str | None = None


class ReviewCondition(BaseModel):
    name: str
    status: str | None = None
    note: str | None = None


class ReviewVital(BaseModel):
    metric: str
    value: str
    unit: str | None = None
    note: str | None = None


class ClinicalDocumentReviewDraft(BaseModel):
    schema_version: str = "1.0"
    document_type: str
    source_system: str
    extraction_summary: str
    key_points: list[str] = Field(default_factory=list)
    care_plan: list[str] = Field(default_factory=list)
    quality_flags: list[str] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    labs: list[ReviewLab] = Field(default_factory=list)
    medications: list[ReviewMedication] = Field(default_factory=list)
    conditions: list[ReviewCondition] = Field(default_factory=list)
    vitals: list[ReviewVital] = Field(default_factory=list)


@dataclass
class ReviewDraftBuild:
    draft: ClinicalDocumentReviewDraft
    extraction_engine: str
    source_mode: str
    model_name: str | None
    refusal_reason: str | None = None


def _compact_text(value: str) -> str:
    return " ".join(value.split())


def _safe_float(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _clip_text(value: str, limit: int = MAX_SUPPLEMENTAL_TEXT_CHARS) -> str:
    compacted = value.strip()
    if len(compacted) <= limit:
        return compacted
    return f"{compacted[:limit].rstrip()} ...[truncated]"


def _draft_to_payload(draft: ClinicalDocumentReviewDraft) -> str:
    return draft.model_dump_json()


def _schema() -> dict:
    return ClinicalDocumentReviewDraft.model_json_schema()


def _quality_flags_for_document(document: MedicalDocument, text: str) -> list[str]:
    flags: list[str] = []
    if not text.strip():
        flags.append("no_extracted_text")
    if document.record_type in {"general_record", "history_and_physical"}:
        flags.append("broad_document_type")
    return flags


def _parse_local_labs(text: str) -> list[ReviewLab]:
    labs: list[ReviewLab] = []
    seen: set[tuple[str, str]] = set()
    for match in LAB_LINE_PATTERN.finditer(text):
        label = match.group(1).lower()
        numeric_value = _safe_float(match.group(2))
        unit = match.group(3)
        explicit_status = (match.group(4) or "").lower()
        meta = LAB_CATALOG.get(label, LAB_CATALOG.get(label.replace("fasting ", ""), {}))
        if not unit:
            unit = meta.get("unit")

        status = explicit_status or "unknown"
        if status == "unknown" and numeric_value is not None:
            ref_range = meta.get("ref_range")
            if ref_range and ref_range.startswith("<"):
                cutoff = _safe_float(ref_range[1:])
                if cutoff is not None:
                    status = "high" if numeric_value >= cutoff else "normal"
            elif ref_range and "-" in ref_range:
                lower, upper = ref_range.split("-", 1)
                low = _safe_float(lower)
                high = _safe_float(upper)
                if low is not None and high is not None:
                    if numeric_value < low:
                        status = "low"
                    elif numeric_value > high:
                        status = "high"
                    else:
                        status = "normal"

        key = (match.group(1).title(), match.group(2))
        if key in seen:
            continue
        seen.add(key)
        labs.append(
            ReviewLab(
                test_name=match.group(1).title(),
                value_text=f"{match.group(2)} {unit or ''}".strip(),
                numeric_value=numeric_value,
                unit=unit,
                reference_range=meta.get("ref_range"),
                status=status if status in {"high", "low", "normal", "abnormal"} else "unknown",
            )
        )
    return labs


def _parse_local_medications(text: str) -> list[ReviewMedication]:
    medications: list[ReviewMedication] = []
    seen: set[tuple[str, str, str]] = set()
    for match in MEDICATION_PATTERN.finditer(text):
        medication = ReviewMedication(
            name=match.group(1).title(),
            dose=(match.group(2) or "").strip() or None,
            frequency=(match.group(3) or "").strip() or None,
            status="active",
        )
        key = (medication.name, medication.dose or "", medication.frequency or "")
        if key in seen:
            continue
        seen.add(key)
        medications.append(medication)
    return medications


def _parse_local_vitals(text: str) -> list[ReviewVital]:
    vitals: list[ReviewVital] = []
    bp_match = BP_PATTERN.search(text)
    hr_match = HEART_RATE_PATTERN.search(text)
    weight_match = WEIGHT_PATTERN.search(text)
    if bp_match:
        vitals.append(ReviewVital(metric="blood_pressure", value=bp_match.group(1)))
    if hr_match:
        vitals.append(ReviewVital(metric="heart_rate", value=hr_match.group(1), unit="bpm"))
    if weight_match:
        vitals.append(
            ReviewVital(
                metric="weight",
                value=weight_match.group(1),
                unit=(weight_match.group(2) or "lb").lower(),
            )
        )
    return vitals


def build_local_review_draft(document: MedicalDocument, text: str, reason: str | None = None) -> ClinicalDocumentReviewDraft:
    labs = _parse_local_labs(text)
    medications = _parse_local_medications(text)
    vitals = _parse_local_vitals(text)
    quality_flags = _quality_flags_for_document(document, text)
    if reason:
        quality_flags.append(reason)

    summary_parts = []
    if labs:
        summary_parts.append(f"{len(labs)} lab finding{'s' if len(labs) != 1 else ''}")
    if medications:
        summary_parts.append(f"{len(medications)} medication{'s' if len(medications) != 1 else ''}")
    if vitals:
        summary_parts.append(f"{len(vitals)} vital{'s' if len(vitals) != 1 else ''}")
    if not summary_parts:
        summary_parts.append("No confident structured findings yet")

    care_plan: list[str] = []
    compact_text = _compact_text(text)
    if compact_text:
        care_plan.append(compact_text[:220])

    return ClinicalDocumentReviewDraft(
        document_type=document.record_type,
        source_system=document.source_system,
        extraction_summary=" · ".join(summary_parts),
        key_points=[point for point in summary_parts if point],
        care_plan=care_plan[:2],
        quality_flags=quality_flags,
        confidence=0.46 if labs or medications or vitals else 0.22,
        labs=labs,
        medications=medications,
        vitals=vitals,
    )


def _build_prompt(document: MedicalDocument, supplemental_text: str | None) -> str:
    context_bits = [
        "You are extracting structured clinical facts from a medical document for a review queue.",
        "Return only facts explicitly stated in the document or supplemental OCR text.",
        "Do not invent medications, diagnoses, lab values, or normal ranges.",
        "If a field is ambiguous, leave it empty and add a short warning in quality_flags.",
        "Summarize the document in one concise sentence for a human reviewer.",
        f"Document type hint: {document.record_type}",
        f"Source system hint: {document.source_system}",
        f"Provider metadata: {document.provider}",
        f"Facility metadata: {document.facility or 'unknown'}",
        f"Document date metadata: {document.document_date}",
    ]
    if supplemental_text:
        context_bits.append("Supplemental OCR/text extraction is included below and may help with low-quality scans.")
        context_bits.append(_clip_text(supplemental_text))
    return "\n\n".join(context_bits)


def _extract_output_text(response_payload: dict) -> tuple[str | None, str | None]:
    collected: list[str] = []
    refusal_reason: str | None = None
    for item in response_payload.get("output", []):
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if content.get("type") == "output_text" and content.get("text"):
                collected.append(content["text"])
            if content.get("type") == "refusal" and content.get("refusal"):
                refusal_reason = content.get("refusal")
    text = "\n".join(piece for piece in collected if piece).strip()
    return (text or None, refusal_reason)


def _request_openai_review(document: MedicalDocument, payload: bytes, supplemental_text: str | None) -> tuple[ClinicalDocumentReviewDraft | None, str | None, str | None]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None, None, "OPENAI_API_KEY is not configured"

    content: list[dict] = []
    if document.content_type == "application/pdf":
        file_base64 = base64.b64encode(payload).decode("utf-8")
        content.append(
            {
                "type": "input_file",
                "filename": document.file_name,
                "file_data": f"data:{document.content_type};base64,{file_base64}",
            }
        )
    elif not supplemental_text:
        return None, None, "No OCR text is available for non-PDF document extraction"

    content.append(
        {
            "type": "input_text",
            "text": _build_prompt(document, supplemental_text),
        }
    )
    request_body = {
        "model": DEFAULT_DOCUMENT_MODEL,
        "input": [
            {
                "role": "user",
                "content": content,
            }
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "clinical_document_review_draft",
                "strict": True,
                "schema": _schema(),
            }
        },
        "max_output_tokens": 4000,
    }

    http_request = urllib_request.Request(
        OPENAI_RESPONSES_URL,
        data=json.dumps(request_body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib_request.urlopen(http_request, timeout=90) as response:
            raw_payload = response.read().decode("utf-8")
    except urllib_error.HTTPError as exc:
        error_payload = exc.read().decode("utf-8", "replace")
        return None, None, f"OpenAI extraction failed ({exc.code}): {error_payload[:400]}"
    except urllib_error.URLError as exc:
        return None, None, f"OpenAI extraction unavailable: {exc.reason}"

    parsed_response = json.loads(raw_payload)
    output_text, refusal_reason = _extract_output_text(parsed_response)
    if refusal_reason:
        return None, parsed_response.get("model"), refusal_reason
    if not output_text:
        return None, parsed_response.get("model"), "OpenAI returned no structured extraction output"

    try:
        draft = ClinicalDocumentReviewDraft.model_validate_json(output_text)
    except ValidationError as exc:
        return None, parsed_response.get("model"), f"OpenAI output did not match the strict schema: {exc.errors()[0]['msg']}"

    return draft, parsed_response.get("model"), None


def build_review_draft(document: MedicalDocument, payload: bytes, supplemental_text: str | None = None) -> ReviewDraftBuild:
    source_mode = "openai_pdf" if document.content_type == "application/pdf" else "openai_text"
    ai_draft, model_name, ai_issue = _request_openai_review(document, payload, supplemental_text)
    if ai_draft is not None:
        return ReviewDraftBuild(
            draft=ai_draft,
            extraction_engine="openai_responses",
            source_mode=source_mode,
            model_name=model_name or DEFAULT_DOCUMENT_MODEL,
        )

    fallback_reason = None
    if ai_issue:
        fallback_reason = "openai_fallback"
    local_draft = build_local_review_draft(document, supplemental_text or "", fallback_reason)
    return ReviewDraftBuild(
        draft=local_draft,
        extraction_engine="local_heuristic",
        source_mode="local_text_fallback" if supplemental_text else "manual_review_required",
        model_name=model_name,
        refusal_reason=ai_issue,
    )


def create_review_item(document: MedicalDocument, draft_build: ReviewDraftBuild) -> DocumentReviewItem:
    return DocumentReviewItem(
        patient_id=document.patient_id,
        document_id=document.id or 0,
        status="pending_review",
        extraction_engine=draft_build.extraction_engine,
        source_mode=draft_build.source_mode,
        model_name=draft_build.model_name,
        confidence=draft_build.draft.confidence,
        summary=draft_build.draft.extraction_summary,
        caution_flags=json.dumps(draft_build.draft.quality_flags),
        structured_payload=_draft_to_payload(draft_build.draft),
        refusal_reason=draft_build.refusal_reason,
    )


def _document_timeline_type(record_type: str) -> str:
    if record_type in {"lab_result", "pathology_report"}:
        return "lab"
    if record_type == "medication_list":
        return "medication"
    if record_type == "imaging_report":
        return "imaging"
    if record_type in {"wearable_report", "vitals_sheet"}:
        return "wearable"
    return "visit"


def _review_summary_description(draft: ClinicalDocumentReviewDraft) -> str:
    parts = [draft.extraction_summary]
    if draft.conditions:
        parts.append("Conditions: " + "; ".join(condition.name for condition in draft.conditions[:4]))
    if draft.care_plan:
        parts.append("Plan: " + "; ".join(draft.care_plan[:3]))
    description = " ".join(part for part in parts if part).strip()
    return description[:420]


def build_artifacts_from_review(document: MedicalDocument, draft: ClinicalDocumentReviewDraft) -> ExtractionArtifact:
    artifact = ExtractionArtifact()
    source_label = document.source_system or document.source
    flags = [
        "AI reviewed extraction",
        f"document:{document.id}",
        f"reviewed:{document.record_type}",
    ]
    flags.extend(draft.quality_flags[:3])
    encoded_flags = json.dumps([flag for flag in flags if flag])

    for lab in draft.labs:
        description_parts = [lab.value_text]
        if lab.reference_range:
            description_parts.append(f"Ref {lab.reference_range}")
        if lab.status and lab.status != "unknown":
            description_parts.append(lab.status.title())
        artifact.medical_records.append(
            MedicalRecord(
                patient_id=document.patient_id,
                record_type="lab",
                title=lab.test_name,
                description=" · ".join(part for part in description_parts if part),
                date=document.document_date,
                source=source_label,
                provider=document.provider,
                flags=encoded_flags,
            )
        )
        if lab.numeric_value is not None:
            lab_key = lab.test_name.lower()
            catalog_meta = LAB_CATALOG.get(lab_key, LAB_CATALOG.get(lab_key.replace("fasting ", ""), {}))
            artifact.lab_observations.append(
                LabObservation(
                    patient_id=document.patient_id,
                    test_name=lab.test_name,
                    loinc=catalog_meta.get("loinc"),
                    value=lab.numeric_value,
                    unit=lab.unit,
                    ref_range=lab.reference_range or catalog_meta.get("ref_range"),
                    status=None if lab.status == "unknown" else lab.status,
                    source=source_label,
                    timestamp=datetime.now(timezone.utc),
                )
            )

    for medication in draft.medications:
        medication_bits = [medication.dose or "", medication.frequency or "", medication.status or ""]
        artifact.medical_records.append(
            MedicalRecord(
                patient_id=document.patient_id,
                record_type="medication",
                title=medication.name,
                description=" · ".join(bit for bit in medication_bits if bit) or "Imported from reviewed document",
                date=document.document_date,
                source=source_label,
                provider=document.provider,
                flags=encoded_flags,
            )
        )

    for vital in draft.vitals:
        wearable_value = vital.value if not vital.unit else f"{vital.value} {vital.unit}"
        artifact.wearable_data.append(
            WearableData(
                patient_id=document.patient_id,
                metric=vital.metric,
                value=wearable_value,
                trend="stable",
                period="Imported document",
                source=source_label,
            )
        )

    description = _review_summary_description(draft)
    should_add_summary_record = bool(description) or bool(draft.care_plan) or bool(draft.conditions)
    if should_add_summary_record:
        artifact.medical_records.append(
            MedicalRecord(
                patient_id=document.patient_id,
                record_type=_document_timeline_type(document.record_type),
                title=document.title,
                description=description or "Reviewed document imported into MedBridge",
                date=document.document_date,
                source=source_label,
                provider=document.provider,
                flags=encoded_flags,
            )
        )

    return artifact


def persist_review_approval(
    session: Session,
    user: User,
    document: MedicalDocument,
    review_item: DocumentReviewItem,
) -> int:
    draft = ClinicalDocumentReviewDraft.model_validate(review_item.get_payload())
    artifact = build_artifacts_from_review(document, draft)

    count = 0
    for record in artifact.medical_records:
        session.add(record)
        count += 1
    for lab in artifact.lab_observations:
        session.add(lab)
        count += 1
    for wearable in artifact.wearable_data:
        session.add(wearable)
        count += 1

    session.add(
        AuditLog(
            patient_id=user.patient_id,
            action=f"Approved {count} clinical items from {document.file_name}",
            performed_by="You",
            icon="sync",
            resource=f"document:{document.id}",
        )
    )
    return count
