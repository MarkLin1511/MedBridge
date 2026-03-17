from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Iterable


DOCUMENT_TYPE_LABELS = {
    "general_record": "General record",
    "allergy_list": "Allergy list",
    "billing_statement": "Billing statement",
    "care_plan": "Care plan",
    "consent_form": "Consent form",
    "consult_note": "Consult note",
    "discharge_summary": "Discharge summary",
    "encounter_summary": "Encounter summary",
    "history_and_physical": "History and physical",
    "imaging_report": "Imaging report",
    "immunization_record": "Immunization record",
    "insurance_document": "Insurance document",
    "lab_result": "Lab result",
    "medication_list": "Medication list",
    "operative_note": "Operative note",
    "pathology_report": "Pathology report",
    "prior_authorization": "Prior authorization",
    "problem_list": "Problem list",
    "progress_note": "Progress note",
    "referral_note": "Referral note",
    "therapy_note": "Therapy note",
    "vitals_sheet": "Vitals sheet",
    "wearable_report": "Wearable report",
}

DEFAULT_TARGETS_BY_RECORD_TYPE = {
    "general_record": ["patient", "provider", "dates", "document_type"],
    "allergy_list": ["allergies", "reactions", "severity", "source"],
    "billing_statement": ["charges", "cpt_codes", "balance", "date_of_service"],
    "care_plan": ["goals", "interventions", "follow_up", "care_team"],
    "consent_form": ["patient", "procedure", "consent_date", "signatures"],
    "consult_note": ["assessment", "plan", "problems", "provider", "follow_up"],
    "discharge_summary": ["diagnoses", "medications", "follow_up", "disposition", "instructions"],
    "encounter_summary": ["chief_complaint", "assessment", "plan", "orders", "follow_up"],
    "history_and_physical": ["history", "exam", "assessment", "plan", "past_medical_history"],
    "imaging_report": ["study", "findings", "impression", "ordering_provider"],
    "immunization_record": ["vaccines", "dates", "lot_numbers", "administering_site"],
    "insurance_document": ["payer", "member_id", "group_number", "coverage_dates"],
    "lab_result": ["lab_name", "value", "unit", "reference_range", "abnormal_flag", "collection_date"],
    "medication_list": ["medications", "dose", "sig", "frequency", "start_date"],
    "operative_note": ["procedure", "surgeon", "findings", "complications", "implants"],
    "pathology_report": ["specimen", "diagnosis", "microscopic_findings", "pathologist"],
    "prior_authorization": ["medication_or_service", "status", "payer", "authorization_number"],
    "problem_list": ["conditions", "onset", "status", "resolving_provider"],
    "progress_note": ["history", "vitals", "assessment", "plan", "medications"],
    "referral_note": ["reason_for_referral", "specialty", "history", "attachments", "requested_action"],
    "therapy_note": ["session_summary", "goals", "interventions", "next_steps"],
    "vitals_sheet": ["blood_pressure", "pulse", "temperature", "respiratory_rate", "weight"],
    "wearable_report": ["sleep", "steps", "heart_rate", "activity", "trend_window"],
}


@dataclass(frozen=True)
class SourceSystemProfile:
    display_name: str
    slug: str
    family: str
    care_setting: str
    common_aliases: tuple[str, ...]
    focus: tuple[str, ...]
    likely_record_types: tuple[str, ...]
    extraction_boosts: tuple[str, ...] = ()


SOURCE_SYSTEMS: tuple[SourceSystemProfile, ...] = (
    SourceSystemProfile(
        display_name="Epic (MyChart)",
        slug="epic_mychart",
        family="hospital",
        care_setting="large health systems",
        common_aliases=("epic", "epic mychart", "mychart"),
        focus=("encounter continuity", "lab ingestion", "provider handoff packets"),
        likely_record_types=("discharge_summary", "encounter_summary", "lab_result", "medication_list", "progress_note"),
        extraction_boosts=("mrn", "visit_location", "encounter_type"),
    ),
    SourceSystemProfile(
        display_name="Oracle Health (Cerner)",
        slug="oracle_cerner",
        family="hospital",
        care_setting="enterprise hospitals",
        common_aliases=("oracle cerner", "oracle health", "cerner"),
        focus=("inpatient summaries", "results routing", "clinical documentation"),
        likely_record_types=("discharge_summary", "consult_note", "lab_result", "operative_note", "imaging_report"),
        extraction_boosts=("fin_number", "admission_date", "discharge_date"),
    ),
    SourceSystemProfile(
        display_name="MEDITECH",
        slug="meditech",
        family="hospital",
        care_setting="community hospitals",
        common_aliases=("meditech",),
        focus=("hospital transitions", "medication reconciliation", "lab summaries"),
        likely_record_types=("discharge_summary", "encounter_summary", "lab_result", "medication_list", "care_plan"),
        extraction_boosts=("account_number", "unit_location"),
    ),
    SourceSystemProfile(
        display_name="athenahealth (athenaOne)",
        slug="athenahealth",
        family="ambulatory",
        care_setting="ambulatory and multispecialty groups",
        common_aliases=("athenahealth", "athenaone", "athena"),
        focus=("office visit summaries", "medication reconciliation", "referral workflow"),
        likely_record_types=("progress_note", "referral_note", "medication_list", "lab_result", "encounter_summary"),
        extraction_boosts=("appointment_type", "portal_message"),
    ),
    SourceSystemProfile(
        display_name="NextGen Healthcare",
        slug="nextgen_healthcare",
        family="ambulatory",
        care_setting="ambulatory specialty practices",
        common_aliases=("nextgen", "nextgen healthcare"),
        focus=("specialty notes", "problem lists", "visit plans"),
        likely_record_types=("progress_note", "consult_note", "problem_list", "lab_result", "care_plan"),
    ),
    SourceSystemProfile(
        display_name="Tebra (Kareo + PatientPop)",
        slug="tebra",
        family="ambulatory",
        care_setting="independent practices",
        common_aliases=("tebra", "kareo", "patientpop"),
        focus=("small practice workflows", "billing + chart context", "visit recaps"),
        likely_record_types=("encounter_summary", "billing_statement", "progress_note", "insurance_document"),
    ),
    SourceSystemProfile(
        display_name="Practice Fusion",
        slug="practice_fusion",
        family="ambulatory",
        care_setting="small outpatient clinics",
        common_aliases=("practice fusion",),
        focus=("visit notes", "e-prescribing context", "labs"),
        likely_record_types=("progress_note", "medication_list", "lab_result", "problem_list"),
    ),
    SourceSystemProfile(
        display_name="Greenway Health / Intergy",
        slug="greenway_intergy",
        family="ambulatory",
        care_setting="physician practices",
        common_aliases=("greenway health", "intergy", "greenway"),
        focus=("practice workflows", "clinical + billing crossover", "follow-up plans"),
        likely_record_types=("progress_note", "billing_statement", "medication_list", "care_plan"),
    ),
    SourceSystemProfile(
        display_name="AdvancedMD",
        slug="advancedmd",
        family="ambulatory",
        care_setting="independent and specialty practices",
        common_aliases=("advancedmd",),
        focus=("chart notes", "billing statements", "patient intake"),
        likely_record_types=("progress_note", "billing_statement", "insurance_document", "encounter_summary"),
    ),
    SourceSystemProfile(
        display_name="Allscripts / Veradigm",
        slug="allscripts_veradigm",
        family="mixed",
        care_setting="hospital and physician groups",
        common_aliases=("allscripts", "veradigm", "allscripts / veradigm"),
        focus=("legacy chart exports", "results import", "referral packets"),
        likely_record_types=("encounter_summary", "lab_result", "imaging_report", "referral_note"),
    ),
    SourceSystemProfile(
        display_name="DrChrono",
        slug="drchrono",
        family="ambulatory",
        care_setting="smaller practices",
        common_aliases=("drchrono",),
        focus=("mobile-first notes", "visit summaries", "prescriptions"),
        likely_record_types=("progress_note", "medication_list", "encounter_summary"),
    ),
    SourceSystemProfile(
        display_name="CureMD",
        slug="curemd",
        family="ambulatory",
        care_setting="outpatient clinics",
        common_aliases=("curemd",),
        focus=("visit notes", "billing context", "lab results"),
        likely_record_types=("progress_note", "lab_result", "billing_statement", "insurance_document"),
    ),
    SourceSystemProfile(
        display_name="Praxis EMR",
        slug="praxis_emr",
        family="ambulatory",
        care_setting="specialty practices",
        common_aliases=("praxis", "praxis emr"),
        focus=("free-text notes", "specialty templates", "longitudinal assessment"),
        likely_record_types=("progress_note", "consult_note", "care_plan"),
        extraction_boosts=("free_text_reasoning",),
    ),
    SourceSystemProfile(
        display_name="Nextech",
        slug="nextech",
        family="specialty",
        care_setting="ophthalmology and aesthetics",
        common_aliases=("nextech",),
        focus=("specialty measurements", "procedure notes", "imaging"),
        likely_record_types=("progress_note", "operative_note", "imaging_report", "encounter_summary"),
        extraction_boosts=("laterality", "specialty_measurements"),
    ),
    SourceSystemProfile(
        display_name="SimplePractice / TherapyNotes",
        slug="behavioral_health",
        family="behavioral_health",
        care_setting="mental health practices",
        common_aliases=("simplepractice", "therapynotes", "simplepractice / therapynotes"),
        focus=("therapy notes", "care plans", "intake paperwork"),
        likely_record_types=("therapy_note", "care_plan", "consent_form", "insurance_document"),
    ),
    SourceSystemProfile(
        display_name="eClinicalWorks",
        slug="eclinicalworks",
        family="ambulatory",
        care_setting="primary care and multispecialty",
        common_aliases=("eclinicalworks", "ecw"),
        focus=("visit summaries", "medication reconciliation", "referrals"),
        likely_record_types=("progress_note", "medication_list", "referral_note", "lab_result", "encounter_summary"),
        extraction_boosts=("section_headers", "patient_portal_layout"),
    ),
    SourceSystemProfile(
        display_name="VA Health",
        slug="va_health",
        family="government",
        care_setting="federal health system",
        common_aliases=("va", "va health", "myhealthevet"),
        focus=("problem lists", "results", "visit continuity"),
        likely_record_types=("encounter_summary", "lab_result", "problem_list", "medication_list"),
    ),
    SourceSystemProfile(
        display_name="Generic scanned record",
        slug="generic_scanned_record",
        family="generic",
        care_setting="paper or unknown source",
        common_aliases=("generic", "unknown", "scanned", "uploaded pdf"),
        focus=("ocr first", "fallback extraction", "human review"),
        likely_record_types=tuple(DOCUMENT_TYPE_LABELS.keys()),
        extraction_boosts=("ocr_cleanup", "review_queue"),
    ),
)

def _normalize_free_text(value: str) -> str:
    lowered = value.strip().lower()
    cleaned = re.sub(r"[^a-z0-9]+", " ", lowered)
    return " ".join(cleaned.split())


ALIAS_LOOKUP = {}
for profile in SOURCE_SYSTEMS:
    ALIAS_LOOKUP[_normalize_free_text(profile.slug)] = profile
    ALIAS_LOOKUP[_normalize_free_text(profile.display_name)] = profile
    for alias in profile.common_aliases:
        ALIAS_LOOKUP[_normalize_free_text(alias)] = profile

SLUG_LOOKUP = {profile.slug: profile for profile in SOURCE_SYSTEMS}


def normalize_source_system(value: str) -> str:
    normalized = _normalize_free_text(value)
    profile = ALIAS_LOOKUP.get(normalized)
    if profile:
        return profile.slug
    return normalized.replace("/", " ").replace("-", " ").replace(" ", "_") or "generic_scanned_record"


def profile_for_source_system(value: str) -> SourceSystemProfile:
    slug = normalize_source_system(value)
    return SLUG_LOOKUP.get(slug, SLUG_LOOKUP["generic_scanned_record"])


def build_extraction_profile(source_system: str, record_type: str) -> str:
    return f"{normalize_source_system(source_system)}__{record_type}"


def extraction_targets_for(record_type: str, source_system: str) -> list[str]:
    targets = list(DEFAULT_TARGETS_BY_RECORD_TYPE.get(record_type, DEFAULT_TARGETS_BY_RECORD_TYPE["general_record"]))
    profile = profile_for_source_system(source_system)
    for item in profile.extraction_boosts:
        if item not in targets:
            targets.append(item)
    return targets


def capability_payload() -> dict:
    return {
        "source_systems": [
            {
                "display_name": profile.display_name,
                "slug": profile.slug,
                "family": profile.family,
                "care_setting": profile.care_setting,
                "focus": list(profile.focus),
                "likely_record_types": list(profile.likely_record_types),
            }
            for profile in SOURCE_SYSTEMS
        ],
        "document_types": [
            {
                "value": record_type,
                "label": label,
                "default_targets": DEFAULT_TARGETS_BY_RECORD_TYPE.get(record_type, []),
            }
            for record_type, label in DOCUMENT_TYPE_LABELS.items()
        ],
        "beta_note": "MedBridge currently ships vendor-aware profiling and target extraction coverage. OCR and model-based extraction are the next layer on top of this registry.",
    }


def source_system_suggestions() -> list[str]:
    return [profile.display_name for profile in SOURCE_SYSTEMS if profile.slug != "generic_scanned_record"]


def likely_record_types_for(source_system: str) -> list[str]:
    return list(profile_for_source_system(source_system).likely_record_types)


def iter_supported_record_types() -> Iterable[str]:
    return DOCUMENT_TYPE_LABELS.keys()
