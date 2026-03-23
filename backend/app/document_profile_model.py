from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any


MODEL_PATH = Path(__file__).resolve().parents[1] / "generated" / "document_profile_model.json"
TOKEN_RE = re.compile(r"[a-z0-9]+")
SOURCE_SYSTEM_HINTS = {
    "epic (mychart)": "epic_mychart",
    "epic mychart": "epic_mychart",
    "mychart": "epic_mychart",
    "oracle health": "oracle_cerner",
    "cerner": "oracle_cerner",
    "meditech": "meditech",
    "athenahealth": "athenahealth",
    "athenaone": "athenahealth",
    "eclinicalworks": "eclinicalworks",
    "e clinical works": "eclinicalworks",
    "nextgen": "nextgen_healthcare",
    "tebra": "tebra",
    "kareo": "tebra",
    "patientpop": "tebra",
    "practice fusion": "practice_fusion",
    "greenway": "greenway_intergy",
    "intergy": "greenway_intergy",
    "advancedmd": "advancedmd",
    "allscripts": "allscripts_veradigm",
    "veradigm": "allscripts_veradigm",
    "drchrono": "drchrono",
    "curemd": "curemd",
    "praxis": "praxis_emr",
    "nextech": "nextech",
    "simplepractice": "behavioral_health",
    "therapynotes": "behavioral_health",
    "va health": "va_health",
    "my healthevet": "va_health",
}


def _tokenize(text: str) -> list[str]:
    return TOKEN_RE.findall(text.lower())


def _load_model() -> dict[str, Any] | None:
    if not MODEL_PATH.exists():
        return None
    return json.loads(MODEL_PATH.read_text())


def model_summary() -> dict[str, Any] | None:
    payload = _load_model()
    if not payload:
        return None
    return payload.get("summary")


def _predict_label(bundle: dict[str, Any], text: str) -> dict[str, Any]:
    tokens = _tokenize(text)
    labels = bundle["labels"]
    if not labels:
        return {"label": None, "confidence": 0.0}

    vocab_size = max(bundle.get("vocab_size", 1), 1)
    token_counts = bundle["token_counts"]
    total_tokens = bundle["total_tokens"]
    priors = bundle["priors"]

    scores: dict[str, float] = {}
    for label in labels:
        score = float(priors.get(label, -20.0))
        denominator = float(total_tokens.get(label, 0) + vocab_size)
        label_token_counts = token_counts.get(label, {})
        for token in tokens:
            score += math.log((label_token_counts.get(token, 0) + 1) / denominator)
        scores[label] = score

    top_label = max(scores, key=scores.get)
    max_score = scores[top_label]
    denominator = sum(math.exp(score - max_score) for score in scores.values())
    confidence = 1.0 / denominator if denominator else 0.0
    return {
        "label": top_label,
        "confidence": round(confidence, 4),
    }


def _forced_source_label(text: str) -> str | None:
    normalized = " ".join(text.lower().split())
    for hint, label in SOURCE_SYSTEM_HINTS.items():
        if hint in normalized:
            return label
    return None


def classify_text(text: str) -> dict[str, Any] | None:
    payload = _load_model()
    if not payload:
        return None

    source_prediction = _predict_label(payload["source_system_model"], text)
    forced_source = _forced_source_label(text)
    if forced_source:
        source_prediction = {
            "label": forced_source,
            "confidence": max(source_prediction.get("confidence", 0.0), 0.995),
        }
    record_prediction = _predict_label(payload["record_type_model"], text)
    return {
        "source_system": source_prediction,
        "record_type": record_prediction,
        "model_summary": payload.get("summary"),
    }
