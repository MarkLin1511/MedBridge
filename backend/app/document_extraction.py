from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
import io
import json
import re
from typing import Any

from pypdf import PdfReader
from sqlmodel import Session

from app.models import AuditLog, LabObservation, MedicalDocument, MedicalRecord, User, WearableData


LAB_CATALOG = {
    "hemoglobin a1c": {"loinc": "4548-4", "unit": "%", "ref_range": "4.0-5.6"},
    "a1c": {"loinc": "4548-4", "unit": "%", "ref_range": "4.0-5.6"},
    "glucose": {"loinc": "2345-7", "unit": "mg/dL", "ref_range": "70-100"},
    "fasting glucose": {"loinc": "1558-6", "unit": "mg/dL", "ref_range": "70-100"},
    "total cholesterol": {"loinc": "2093-3", "unit": "mg/dL", "ref_range": "<200"},
    "cholesterol": {"loinc": "2093-3", "unit": "mg/dL", "ref_range": "<200"},
    "creatinine": {"loinc": "2160-0", "unit": "mg/dL", "ref_range": "0.6-1.3"},
    "tsh": {"loinc": "3016-3", "unit": "mIU/L", "ref_range": "0.4-4.5"},
}

MEDICATION_PATTERN = re.compile(
    r"(?i)(metformin|lisinopril|atorvastatin|levothyroxine|albuterol|sertraline)\b[:\- ]*(\d+(?:\.\d+)?\s*(?:mg|mcg|puffs))?(?:.*?(daily|nightly|as needed|twice daily|once daily))?"
)
LAB_LINE_PATTERN = re.compile(
    r"(?i)(hemoglobin a1c|a1c|fasting glucose|glucose|total cholesterol|cholesterol|creatinine|tsh)"
    r"[^0-9]{0,20}(\d+(?:\.\d+)?)\s*(%|mg/dL|mIU/L|mmol/L)?(?:[^A-Za-z0-9]{0,12}(high|low|normal))?"
)
BP_PATTERN = re.compile(r"(?i)\b(?:bp|blood pressure)\b[^0-9]{0,10}(\d{2,3}/\d{2,3})")
HEART_RATE_PATTERN = re.compile(r"(?i)\b(?:pulse|heart rate|hr)\b[^0-9]{0,10}(\d{2,3})")
WEIGHT_PATTERN = re.compile(r"(?i)\bweight\b[^0-9]{0,10}(\d{2,3}(?:\.\d+)?)\s*(lb|lbs|kg)?")


@dataclass
class ExtractionArtifact:
    medical_records: list[MedicalRecord] = field(default_factory=list)
    lab_observations: list[LabObservation] = field(default_factory=list)
    wearable_data: list[WearableData] = field(default_factory=list)
    summary: list[str] = field(default_factory=list)


def extract_text_from_pdf_bytes(payload: bytes) -> str:
    reader = PdfReader(io.BytesIO(payload))
    parts: list[str] = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        if page_text.strip():
            parts.append(page_text)
    return "\n".join(parts).strip()


def _compact_text(text: str) -> str:
    return " ".join(text.split())


def _collect_section(lines: list[str], keys: tuple[str, ...]) -> str | None:
    for line in lines:
        for key in keys:
            if line.lower().startswith(key):
                return line.split(":", 1)[1].strip() if ":" in line else line.strip()
    return None


def _parse_labs(text: str, patient_id: str, source: str) -> list[LabObservation]:
    matches = []
    for match in LAB_LINE_PATTERN.finditer(text):
        label = match.group(1).lower()
        value = float(match.group(2))
        unit = match.group(3)
        status = (match.group(4) or "").lower() or None
        meta = LAB_CATALOG.get(label, LAB_CATALOG.get(label.replace("fasting ", ""), {}))
        if not unit:
            unit = meta.get("unit")

        if not status:
            ref = meta.get("ref_range", "")
            if ref and ref.startswith("<"):
                try:
                    status = "high" if value >= float(ref[1:]) else "normal"
                except ValueError:
                    status = "normal"
            elif ref and "-" in ref:
                low, high = ref.split("-", 1)
                try:
                    if value < float(low):
                        status = "low"
                    elif value > float(high):
                        status = "high"
                    else:
                        status = "normal"
                except ValueError:
                    status = "normal"

        matches.append(
            LabObservation(
                patient_id=patient_id,
                test_name=match.group(1).title(),
                loinc=meta.get("loinc"),
                value=value,
                unit=unit,
                ref_range=meta.get("ref_range"),
                status=status,
                source=source,
                timestamp=datetime.now(timezone.utc),
            )
        )
    return matches


def _parse_medications(text: str) -> list[dict[str, str]]:
    medications: list[dict[str, str]] = []
    for match in MEDICATION_PATTERN.finditer(text):
        name = match.group(1).title()
        dose = (match.group(2) or "").strip()
        frequency = (match.group(3) or "").strip()
        medications.append(
            {
                "name": name,
                "dose": dose,
                "frequency": frequency,
            }
        )
    deduped: list[dict[str, str]] = []
    seen = set()
    for med in medications:
        key = (med["name"], med["dose"], med["frequency"])
        if key not in seen:
            seen.add(key)
            deduped.append(med)
    return deduped


def _parse_wearables(text: str, patient_id: str, source: str) -> list[WearableData]:
    vitals: list[WearableData] = []
    bp_match = BP_PATTERN.search(text)
    hr_match = HEART_RATE_PATTERN.search(text)
    weight_match = WEIGHT_PATTERN.search(text)

    if bp_match:
        vitals.append(
            WearableData(
                patient_id=patient_id,
                metric="blood_pressure",
                value=bp_match.group(1),
                trend="stable",
                period="Imported document",
                source=source,
            )
        )
    if hr_match:
        vitals.append(
            WearableData(
                patient_id=patient_id,
                metric="heart_rate",
                value=hr_match.group(1),
                trend="stable",
                period="Imported document",
                source=source,
            )
        )
    if weight_match:
        unit = (weight_match.group(2) or "lb").lower()
        vitals.append(
            WearableData(
                patient_id=patient_id,
                metric="weight",
                value=f"{weight_match.group(1)} {unit}",
                trend="stable",
                period="Imported document",
                source=source,
            )
        )
    return vitals


def build_extraction_artifacts(document: MedicalDocument, text: str, source_label: str) -> ExtractionArtifact:
    artifact = ExtractionArtifact()
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    link_flags = json.dumps(["Extracted from uploaded document", f"document:{document.id}"])

    if document.record_type in {"lab_result", "pathology_report"}:
        labs = _parse_labs(text, document.patient_id, source_label)
        artifact.lab_observations.extend(labs)
        for lab in labs:
            description = f"{lab.value} {lab.unit or ''}".strip()
            if lab.ref_range:
                description += f" · Ref {lab.ref_range}"
            artifact.medical_records.append(
                MedicalRecord(
                    patient_id=document.patient_id,
                    record_type="lab",
                    title=lab.test_name,
                    description=description,
                    date=document.document_date,
                    source=source_label,
                    provider=document.provider,
                    flags=json.dumps(
                        [flag for flag in ["Extracted from uploaded document", f"document:{document.id}", (lab.status or "").title()] if flag]
                    ),
                )
            )
        if labs:
            artifact.summary.append(f"{len(labs)} lab results extracted")

    if document.record_type == "medication_list":
        medications = _parse_medications(text)
        for med in medications:
            dose_fragment = med["dose"] or "dose not found"
            frequency_fragment = med["frequency"] or "frequency not found"
            artifact.medical_records.append(
                MedicalRecord(
                    patient_id=document.patient_id,
                    record_type="medication",
                    title=med["name"],
                    description=f"{dose_fragment} · {frequency_fragment}",
                    date=document.document_date,
                    source=source_label,
                    provider=document.provider,
                    flags=link_flags,
                )
            )
        if medications:
            artifact.summary.append(f"{len(medications)} medications extracted")

    if document.record_type in {"wearable_report", "vitals_sheet"}:
        wearable_rows = _parse_wearables(text, document.patient_id, source_label)
        artifact.wearable_data.extend(wearable_rows)
        if wearable_rows:
            artifact.summary.append(f"{len(wearable_rows)} vitals extracted")

    timeline_type = {
        "imaging_report": "imaging",
        "wearable_report": "wearable",
        "vitals_sheet": "wearable",
    }.get(document.record_type, "visit")

    section_bits = [
        _collect_section(lines, ("chief complaint", "reason for referral", "study", "procedure")),
        _collect_section(lines, ("assessment", "findings", "hospital course", "session summary")),
        _collect_section(lines, ("plan", "impression", "instructions", "next steps", "requested action")),
    ]
    summary_text = " ".join(bit for bit in section_bits if bit)
    if not summary_text:
        summary_text = _compact_text(text)[:280]

    should_add_summary_record = document.record_type in {
        "care_plan",
        "consult_note",
        "discharge_summary",
        "encounter_summary",
        "general_record",
        "history_and_physical",
        "imaging_report",
        "operative_note",
        "problem_list",
        "progress_note",
        "referral_note",
        "therapy_note",
        "vitals_sheet",
        "wearable_report",
    }
    if should_add_summary_record and summary_text:
        artifact.medical_records.append(
            MedicalRecord(
                patient_id=document.patient_id,
                record_type=timeline_type,
                title=document.title,
                description=summary_text,
                date=document.document_date,
                source=source_label,
                provider=document.provider,
                flags=link_flags,
            )
        )
        artifact.summary.append("summary record created")

    return artifact


def extract_document(document: MedicalDocument, payload: bytes, supplied_text: str | None = None) -> tuple[str, str, str, int]:
    text = (supplied_text or "").strip()
    if text:
        return text, "completed_browser_ocr", "complete", len(text)

    if document.content_type == "application/pdf":
        pdf_text = extract_text_from_pdf_bytes(payload)
        if pdf_text:
            return pdf_text, "completed_pdf_text", "complete", len(pdf_text)
        return "", "needs_browser_ocr", "needs_review", 0

    if document.content_type.startswith("image/"):
        return "", "needs_browser_ocr", "needs_review", 0

    return "", "unavailable", "needs_review", 0


def persist_extraction(
    session: Session,
    user: User,
    document: MedicalDocument,
    extracted_text: str,
) -> int:
    source_label = document.source_system or document.source
    artifact = build_extraction_artifacts(document, extracted_text, source_label)

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

    if count:
        session.add(
            AuditLog(
                patient_id=user.patient_id,
                action=f"Extracted {count} clinical items from {document.file_name}",
                performed_by="MedBridge AI",
                icon="sync",
                resource=f"document:{document.id}",
            )
        )

    return count
