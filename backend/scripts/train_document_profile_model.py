#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import random
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Iterable

from app.document_intelligence import (
    DOCUMENT_TYPE_LABELS,
    SOURCE_SYSTEMS,
    DEFAULT_TARGETS_BY_RECORD_TYPE,
)


TOKEN_RE = re.compile(r"[a-z0-9]+")
TRAINING_RANDOM_SEED = 1511
DEFAULT_EXAMPLE_COUNT = 1000

PATIENTS = [
    ("Marcus Johnson", "1985-04-19"),
    ("Elena Rivera", "1978-11-02"),
    ("Noah Patel", "1993-08-12"),
    ("Sophia Martinez", "1969-06-27"),
    ("James Chen", "1958-01-14"),
    ("Ava Thompson", "2001-09-22"),
    ("Daniel Kim", "1989-02-03"),
    ("Olivia Brooks", "1974-12-09"),
]

PROVIDERS = [
    "Dr. Sarah Chen",
    "Dr. Michael Rivera",
    "Dr. Priya Patel",
    "Dr. James Wright",
    "Dr. Leah Brooks",
    "Dr. Rebecca Nguyen",
]

FACILITIES = [
    "Bayview Medical Center",
    "Downtown Family Medicine",
    "Starlight Cardiology",
    "North Shore Specialty Clinic",
    "Riverbend Outpatient Center",
    "Pacific General Hospital",
]

MEDICATIONS = [
    ("Metformin", "500 mg", "daily"),
    ("Lisinopril", "10 mg", "daily"),
    ("Atorvastatin", "20 mg", "nightly"),
    ("Levothyroxine", "75 mcg", "daily"),
    ("Albuterol", "2 puffs", "as needed"),
    ("Sertraline", "50 mg", "daily"),
]

LABS = [
    ("Hemoglobin A1c", "4548-4", "%", 5.8, "4.0-5.6"),
    ("Glucose", "2345-7", "mg/dL", 108, "70-100"),
    ("Total Cholesterol", "2093-3", "mg/dL", 212, "<200"),
    ("Creatinine", "2160-0", "mg/dL", 1.0, "0.6-1.3"),
    ("TSH", "3016-3", "mIU/L", 2.7, "0.4-4.5"),
]

SPECIALTY_MARKERS = {
    "epic_mychart": ["MyChart", "Encounter", "Visit Type", "MRN"],
    "oracle_cerner": ["Cerner", "PowerChart", "FIN", "Admission Date"],
    "meditech": ["MEDITECH", "Account Number", "Unit"],
    "athenahealth": ["athenaOne", "Portal", "Appointment"],
    "nextgen_healthcare": ["NextGen", "SOAP", "Problem List"],
    "tebra": ["Tebra", "Kareo", "PatientPop"],
    "practice_fusion": ["Practice Fusion", "eRx", "Chart Summary"],
    "greenway_intergy": ["Greenway", "Intergy", "Practice Management"],
    "advancedmd": ["AdvancedMD", "PM", "Claims"],
    "allscripts_veradigm": ["Allscripts", "Veradigm", "Results"],
    "drchrono": ["DrChrono", "iPad", "Mobile Chart"],
    "curemd": ["CureMD", "Patient Intake", "Eligibility"],
    "praxis_emr": ["Praxis", "Concept Processing", "Assessment"],
    "nextech": ["Nextech", "Laterality", "Procedure"],
    "behavioral_health": ["Therapy", "Session", "Behavioral Health"],
    "eclinicalworks": ["eClinicalWorks", "eCW", "Patient Portal"],
    "va_health": ["VA", "My HealtheVet", "Veteran"],
    "generic_scanned_record": ["Scanned Copy", "Uploaded Document", "External Record"],
}


@dataclass
class Example:
    text: str
    source_system: str
    record_type: str
    pdf_path: str


def tokenize(text: str) -> list[str]:
    return TOKEN_RE.findall(text.lower())


def _escape_pdf_text(line: str) -> str:
    return line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_pdf(lines: Iterable[str]) -> bytes:
    y = 720
    content_lines = ["BT", "/F1 12 Tf"]
    for line in lines:
        content_lines.append(f"72 {y} Td ({_escape_pdf_text(line)}) Tj")
        y -= 18
    content_lines.append("ET")
    content = "\n".join(content_lines).encode("latin-1", "ignore")

    objects = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
        b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        f"5 0 obj\n<< /Length {len(content)} >>\nstream\n".encode("latin-1") + content + b"\nendstream\nendobj\n",
    ]

    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(output))
        output.extend(obj)

    xref_start = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))

    output.extend(
        f"trailer\n<< /Root 1 0 R /Size {len(objects) + 1} >>\nstartxref\n{xref_start}\n%%EOF".encode("latin-1")
    )
    return bytes(output)


def random_date(rng: random.Random) -> str:
    start = date(2024, 1, 1)
    return (start + timedelta(days=rng.randint(0, 800))).isoformat()


def render_record_lines(source_slug: str, source_display: str, record_type: str, rng: random.Random) -> list[str]:
    patient_name, dob = rng.choice(PATIENTS)
    provider = rng.choice(PROVIDERS)
    facility = rng.choice(FACILITIES)
    visit_date = random_date(rng)
    markers = SPECIALTY_MARKERS[source_slug]
    lines = [
        source_display,
        f"{DOCUMENT_TYPE_LABELS[record_type]}",
        f"Patient: {patient_name}",
        f"DOB: {dob}",
        f"Provider: {provider}",
        f"Facility: {facility}",
        f"Document date: {visit_date}",
        f"System markers: {', '.join(rng.sample(markers, k=min(3, len(markers))))}",
    ]

    if record_type == "lab_result":
        test_name, loinc, unit, baseline, ref_range = rng.choice(LABS)
        result = round(baseline + rng.uniform(-1.8, 3.5), 1)
        lines.extend(
            [
                f"Lab: {test_name}",
                f"LOINC: {loinc}",
                f"Result: {result} {unit}",
                f"Reference range: {ref_range}",
                f"Collected: {visit_date}",
            ]
        )
    elif record_type == "medication_list":
        medication, dose, frequency = rng.choice(MEDICATIONS)
        lines.extend(
            [
                f"Medication: {medication}",
                f"Dose: {dose}",
                f"Frequency: {frequency}",
                f"Start date: {visit_date}",
                "Refill status: active",
            ]
        )
    elif record_type in {"progress_note", "consult_note", "encounter_summary"}:
        lines.extend(
            [
                f"Chief complaint: follow up for {rng.choice(['hypertension', 'prediabetes', 'chest discomfort', 'fatigue'])}",
                "Assessment: patient stable with ongoing monitoring needs.",
                "Plan: continue medications, review outside records, follow up in 3 months.",
                "Vitals: BP 128/82, Pulse 72, Weight 182 lb.",
            ]
        )
    elif record_type == "discharge_summary":
        lines.extend(
            [
                f"Admission date: {visit_date}",
                f"Discharge date: {random_date(rng)}",
                "Hospital course: symptoms improved after observation and medication adjustment.",
                "Disposition: discharge home with PCP follow up.",
                "Instructions: repeat labs and medication reconciliation within 1 week.",
            ]
        )
    elif record_type == "referral_note":
        lines.extend(
            [
                f"Reason for referral: {rng.choice(['cardiology', 'endocrinology', 'neurology', 'behavioral health'])}",
                "Requested action: specialist consult and treatment recommendations.",
                "Attached history: prior labs, medication list, problem summary.",
            ]
        )
    elif record_type == "therapy_note":
        lines.extend(
            [
                "Session summary: patient discussed anxiety triggers and sleep routine.",
                "Interventions: CBT reframing, breathing exercise, home practice.",
                "Next steps: continue weekly sessions and symptom journaling.",
            ]
        )
    elif record_type == "imaging_report":
        lines.extend(
            [
                f"Study: {rng.choice(['Chest X-Ray', 'MRI Brain', 'CT Abdomen', 'Shoulder Ultrasound'])}",
                "Findings: no acute process identified.",
                "Impression: stable exam with no new abnormality.",
            ]
        )
    elif record_type == "operative_note":
        lines.extend(
            [
                f"Procedure: {rng.choice(['cataract extraction', 'arthroscopy', 'skin lesion excision'])}",
                f"Surgeon: {provider}",
                "Findings: procedure completed without complications.",
                "Implants: none.",
            ]
        )
    elif record_type == "care_plan":
        lines.extend(
            [
                "Goals: improve blood pressure control and reduce LDL.",
                "Interventions: medication adherence, diet coaching, walking plan.",
                "Follow up: review progress in 8 weeks.",
            ]
        )
    else:
        targets = DEFAULT_TARGETS_BY_RECORD_TYPE.get(record_type, DEFAULT_TARGETS_BY_RECORD_TYPE["general_record"])
        lines.extend([f"{target.replace('_', ' ').title()}: synthetic value" for target in targets[:4]])

    lines.append(f"Extraction targets: {', '.join(DEFAULT_TARGETS_BY_RECORD_TYPE.get(record_type, []))}")
    return lines


def generate_examples(count: int, corpus_dir: Path) -> list[Example]:
    rng = random.Random(TRAINING_RANDOM_SEED)
    corpus_dir.mkdir(parents=True, exist_ok=True)
    eligible_sources = [profile for profile in SOURCE_SYSTEMS if profile.slug != "generic_scanned_record"]
    examples: list[Example] = []

    for index in range(count):
        profile = rng.choice(eligible_sources)
        record_type = rng.choice(profile.likely_record_types)
        lines = render_record_lines(profile.slug, profile.display_name, record_type, rng)
        pdf_path = corpus_dir / f"{index:04d}_{profile.slug}_{record_type}.pdf"
        pdf_path.write_bytes(build_pdf(lines))
        examples.append(
            Example(
                text="\n".join(lines),
                source_system=profile.slug,
                record_type=record_type,
                pdf_path=str(pdf_path),
            )
        )

    return examples


def split_examples(examples: list[Example]) -> tuple[list[Example], list[Example]]:
    rng = random.Random(TRAINING_RANDOM_SEED)
    shuffled = examples[:]
    rng.shuffle(shuffled)
    cutoff = int(len(shuffled) * 0.8)
    return shuffled[:cutoff], shuffled[cutoff:]


def train_nb_model(examples: list[Example], label_getter) -> dict:
    label_examples: dict[str, list[Counter[str]]] = defaultdict(list)
    label_counts: Counter[str] = Counter()
    vocabulary: Counter[str] = Counter()

    for example in examples:
        tokens = tokenize(example.text)
        token_counter = Counter(tokens)
        label = label_getter(example)
        label_examples[label].append(token_counter)
        label_counts[label] += 1
        vocabulary.update(token_counter)

    vocab = {token for token, freq in vocabulary.items() if freq >= 2}
    token_counts: dict[str, dict[str, int]] = {}
    total_tokens: dict[str, int] = {}
    total_examples = sum(label_counts.values())

    for label, counters in label_examples.items():
        merged = Counter()
        for counter in counters:
            for token, count in counter.items():
                if token in vocab:
                    merged[token] += count
        token_counts[label] = dict(merged)
        total_tokens[label] = sum(merged.values())

    priors = {
        label: math.log(count / total_examples)
        for label, count in label_counts.items()
    }

    return {
        "labels": sorted(label_counts.keys()),
        "priors": priors,
        "token_counts": token_counts,
        "total_tokens": total_tokens,
        "vocab_size": len(vocab),
    }


def predict(model: dict, text: str) -> tuple[str, float]:
    tokens = [token for token in tokenize(text) if token]
    scores: dict[str, float] = {}

    for label in model["labels"]:
        score = float(model["priors"][label])
        denominator = model["total_tokens"].get(label, 0) + model["vocab_size"]
        label_token_counts = model["token_counts"].get(label, {})
        for token in tokens:
            score += math.log((label_token_counts.get(token, 0) + 1) / max(denominator, 1))
        scores[label] = score

    best_label = max(scores, key=scores.get)
    max_score = scores[best_label]
    denominator = sum(math.exp(score - max_score) for score in scores.values())
    confidence = 1.0 / denominator if denominator else 0.0
    return best_label, confidence


def accuracy(model: dict, examples: list[Example], label_getter) -> float:
    if not examples:
        return 0.0
    correct = 0
    for example in examples:
        predicted, _ = predict(model, example.text)
        if predicted == label_getter(example):
            correct += 1
    return round(correct / len(examples), 4)


def write_manifest(examples: list[Example], manifest_path: Path) -> None:
    manifest_path.write_text(
        "\n".join(
            json.dumps(
                {
                    "pdf_name": Path(example.pdf_path).name,
                    "source_system": example.source_system,
                    "record_type": example.record_type,
                }
            )
            for example in examples
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a synthetic medical PDF corpus and train a lightweight profile model.")
    parser.add_argument("--count", type=int, default=DEFAULT_EXAMPLE_COUNT, help="Number of synthetic PDFs to generate.")
    parser.add_argument(
        "--corpus-dir",
        type=Path,
        default=Path("/tmp/medbridge-synthetic-document-corpus"),
        help="Directory where the synthetic PDFs will be written.",
    )
    parser.add_argument(
        "--artifact-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "generated",
        help="Directory where the trained model and report will be written.",
    )
    args = parser.parse_args()

    examples = generate_examples(args.count, args.corpus_dir)
    train_examples, validation_examples = split_examples(examples)

    source_model = train_nb_model(train_examples, lambda example: example.source_system)
    record_model = train_nb_model(train_examples, lambda example: example.record_type)

    args.artifact_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = args.artifact_dir / "synthetic_document_manifest.jsonl"
    report_path = args.artifact_dir / "document_profile_training_report.json"
    model_path = args.artifact_dir / "document_profile_model.json"

    write_manifest(examples, manifest_path)

    report = {
        "generated_documents": len(examples),
        "train_documents": len(train_examples),
        "validation_documents": len(validation_examples),
        "source_system_accuracy": accuracy(source_model, validation_examples, lambda example: example.source_system),
        "record_type_accuracy": accuracy(record_model, validation_examples, lambda example: example.record_type),
        "source_system_classes": source_model["labels"],
        "record_type_classes": record_model["labels"],
        "corpus_dir": str(args.corpus_dir),
        "manifest_file": manifest_path.name,
        "note": "Synthetic training data is useful for pipeline bootstrapping, not as a substitute for de-identified real clinical corpora.",
    }

    model_payload = {
        "summary": report,
        "source_system_model": source_model,
        "record_type_model": record_model,
    }

    report_path.write_text(json.dumps(report, indent=2))
    model_path.write_text(json.dumps(model_payload))

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
