"""
SMART on FHIR OAuth2 flow for EHR integration.

Supports Epic, Cerner, and generic FHIR servers.  The router implements
the full authorization-code flow: build an authorize URL, exchange the
callback code for tokens, persist encrypted tokens in a FHIRConnection
row, and fetch/sync patient data from the remote FHIR server.
"""

import json
import os
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from ..auth import get_current_user
from ..db import get_session
from ..encryption import encrypt_field, decrypt_field
from ..models import (
    AuditLog,
    FHIRConnection,
    LabObservation,
    MedicalRecord,
    User,
)

router = APIRouter(prefix="/api/fhir", tags=["smart-fhir"])

# ---------------------------------------------------------------------------
# EHR configuration registry
# ---------------------------------------------------------------------------

EHR_CONFIGS = {
    "epic": {
        "authorize_url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize",
        "token_url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",
        "fhir_base": "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
        "scopes": "openid fhirUser patient/*.read launch/patient",
    },
    "cerner": {
        "authorize_url": "https://authorization.cerner.com/tenants/ec2458f2-1e24-41c8-b71b-0e701af7583d/protocols/oauth2/profiles/smart-v1/personas/patient/authorize",
        "token_url": "https://authorization.cerner.com/tenants/ec2458f2-1e24-41c8-b71b-0e701af7583d/protocols/oauth2/profiles/smart-v1/token",
        "fhir_base": "https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d",
        "scopes": "openid fhirUser patient/*.read launch/patient",
    },
}

SMART_CLIENT_ID = os.environ.get("SMART_CLIENT_ID", "medbridge-local-dev")
SMART_REDIRECT_URI = os.environ.get(
    "SMART_REDIRECT_URI", "http://localhost:8000/api/fhir/callback"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _ehr_config(ehr: str, fhir_url: Optional[str] = None) -> dict:
    """Return the configuration dict for a known EHR or build one for a
    generic FHIR server whose base URL was supplied by the caller."""
    if ehr in EHR_CONFIGS:
        return EHR_CONFIGS[ehr]
    if ehr == "generic" and fhir_url:
        # For a generic FHIR server we derive well-known endpoints from the
        # base URL.  The caller is expected to provide a conformant server.
        base = fhir_url.rstrip("/")
        return {
            "authorize_url": f"{base}/auth/authorize",
            "token_url": f"{base}/auth/token",
            "fhir_base": base,
            "scopes": "openid fhirUser patient/*.read launch/patient",
        }
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unknown EHR '{ehr}'. Use 'epic', 'cerner', or 'generic' with a fhir_url.",
    )


def _fhir_get(url: str, access_token: str) -> dict:
    """Perform an authenticated GET against a FHIR endpoint and return the
    parsed JSON response.  Uses stdlib urllib so there are no extra deps."""
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/fhir+json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"FHIR server returned {exc.code}: {exc.reason}",
        )
    except urllib.error.URLError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not reach FHIR server: {exc.reason}",
        )


def _exchange_code_for_token(token_url: str, code: str) -> dict:
    """Exchange an OAuth2 authorization code for an access token."""
    data = urllib.parse.urlencode(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": SMART_REDIRECT_URI,
            "client_id": SMART_CLIENT_ID,
        }
    ).encode()
    req = urllib.request.Request(
        token_url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode() if exc.fp else ""
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Token exchange failed ({exc.code}): {body}",
        )
    except urllib.error.URLError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not reach token endpoint: {exc.reason}",
        )


def _sync_fhir_data(
    connection: FHIRConnection,
    patient_id: str,
    session: Session,
) -> dict:
    """Fetch Patient + Observation resources from the FHIR server and persist
    them as local LabObservation / MedicalRecord rows.  Returns a summary."""
    access_token = decrypt_field(connection.access_token)
    fhir_base = connection.fhir_base_url.rstrip("/")
    fhir_patient_id = connection.patient_fhir_id or "self"
    synced = {"patient": False, "observations": 0, "records": 0}

    # --- Patient resource ---------------------------------------------------
    try:
        patient = _fhir_get(f"{fhir_base}/Patient/{fhir_patient_id}", access_token)
        if patient.get("resourceType") == "Patient":
            synced["patient"] = True
            # Store as a MedicalRecord for reference
            name_parts = patient.get("name", [{}])[0]
            display_name = " ".join(name_parts.get("given", [])) + " " + name_parts.get("family", "")
            session.add(
                MedicalRecord(
                    patient_id=patient_id,
                    record_type="visit",
                    title=f"FHIR Patient record ({connection.ehr_name})",
                    description=f"Patient: {display_name.strip()}. Birth date: {patient.get('birthDate', 'N/A')}.",
                    date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    source=connection.ehr_name.capitalize(),
                    provider=connection.ehr_name.capitalize(),
                )
            )
            synced["records"] += 1
    except HTTPException:
        pass  # Non-fatal; continue with observations

    # --- Observation resources ----------------------------------------------
    try:
        obs_bundle = _fhir_get(
            f"{fhir_base}/Observation?patient={fhir_patient_id}&_count=100",
            access_token,
        )
        for entry in obs_bundle.get("entry", []):
            resource = entry.get("resource", {})
            if resource.get("resourceType") != "Observation":
                continue

            # Extract meaningful fields
            code_obj = resource.get("code", {})
            codings = code_obj.get("coding", [{}])
            coding = codings[0] if codings else {}
            test_name = coding.get("display") or code_obj.get("text", "Unknown")
            loinc = coding.get("code")

            value_qty = resource.get("valueQuantity", {})
            value = value_qty.get("value")
            unit = value_qty.get("unit", "")

            ref_range_list = resource.get("referenceRange", [])
            ref_range = None
            if ref_range_list:
                low = ref_range_list[0].get("low", {}).get("value", "")
                high = ref_range_list[0].get("high", {}).get("value", "")
                if low or high:
                    ref_range = f"{low}-{high}"

            effective = resource.get("effectiveDateTime", datetime.now(timezone.utc).isoformat())

            if value is not None:
                session.add(
                    LabObservation(
                        patient_id=patient_id,
                        test_name=test_name,
                        loinc=loinc,
                        value=float(value),
                        unit=unit,
                        ref_range=ref_range,
                        status="normal",
                        source=f"FHIR:{connection.ehr_name}",
                        timestamp=datetime.fromisoformat(effective.replace("Z", "+00:00")),
                    )
                )
                synced["observations"] += 1

            # Also store as MedicalRecord
            session.add(
                MedicalRecord(
                    patient_id=patient_id,
                    record_type="lab",
                    title=test_name,
                    description=f"{test_name}: {value} {unit}".strip(),
                    date=effective[:10] if effective else datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    source=f"FHIR:{connection.ehr_name}",
                    provider=connection.ehr_name.capitalize(),
                )
            )
            synced["records"] += 1
    except HTTPException:
        pass  # Non-fatal; we return whatever we managed to sync

    connection.last_synced_at = datetime.now(timezone.utc)
    session.add(connection)
    session.commit()
    return synced


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/authorize")
def authorize(
    ehr: str = Query(..., description="EHR system: epic, cerner, or generic"),
    fhir_url: Optional[str] = Query(None, description="Base FHIR URL (required for generic)"),
    user: User = Depends(get_current_user),
):
    """Build and return the SMART on FHIR authorization URL that the frontend
    should redirect the user to."""
    cfg = _ehr_config(ehr, fhir_url)
    params = {
        "response_type": "code",
        "client_id": SMART_CLIENT_ID,
        "redirect_uri": SMART_REDIRECT_URI,
        "scope": cfg["scopes"],
        "state": f"{user.patient_id}|{ehr}|{cfg['fhir_base']}",
        "aud": cfg["fhir_base"],
    }
    authorize_url = f"{cfg['authorize_url']}?{urllib.parse.urlencode(params)}"
    return {"authorize_url": authorize_url, "ehr": ehr}


@router.get("/callback")
def callback(
    code: str = Query(...),
    state: str = Query(...),
    session: Session = Depends(get_session),
):
    """OAuth2 callback.  Exchanges the authorization code for an access token,
    persists an encrypted FHIRConnection, and kicks off an initial data sync."""

    # Unpack state
    parts = state.split("|", 2)
    if len(parts) != 3:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    patient_id, ehr, fhir_base = parts

    cfg = _ehr_config(ehr, fhir_base if ehr == "generic" else None)

    # Exchange code for token
    token_resp = _exchange_code_for_token(cfg["token_url"], code)
    access_token = token_resp.get("access_token", "")
    refresh_token = token_resp.get("refresh_token")
    expires_in = token_resp.get("expires_in", 3600)
    patient_fhir_id = token_resp.get("patient")  # SMART launch context

    if not access_token:
        raise HTTPException(status_code=502, detail="No access_token in token response")

    # Build & persist the connection with encrypted tokens
    conn = FHIRConnection(
        patient_id=patient_id,
        ehr_name=ehr,
        fhir_base_url=cfg["fhir_base"],
        access_token=encrypt_field(access_token),
        refresh_token=encrypt_field(refresh_token) if refresh_token else None,
        token_expires_at=datetime.now(timezone.utc) + timedelta(seconds=int(expires_in)),
        patient_fhir_id=patient_fhir_id,
        status="active",
    )
    session.add(conn)
    session.commit()
    session.refresh(conn)

    # Audit
    session.add(
        AuditLog(
            patient_id=patient_id,
            action=f"FHIR connection established ({ehr})",
            performed_by="You",
            icon="sync",
        )
    )
    session.commit()

    # Initial sync
    sync_summary = _sync_fhir_data(conn, patient_id, session)

    return {
        "status": "connected",
        "connection_id": conn.id,
        "ehr": ehr,
        "patient_fhir_id": patient_fhir_id,
        "sync": sync_summary,
    }


@router.get("/connections")
def list_connections(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List all FHIR connections for the authenticated user."""
    conns = session.exec(
        select(FHIRConnection).where(FHIRConnection.patient_id == user.patient_id)
    ).all()
    return [
        {
            "id": c.id,
            "ehr_name": c.ehr_name,
            "fhir_base_url": c.fhir_base_url,
            "patient_fhir_id": c.patient_fhir_id,
            "status": c.status,
            "token_expires_at": c.token_expires_at.isoformat() if c.token_expires_at else None,
            "created_at": c.created_at.isoformat(),
            "last_synced_at": c.last_synced_at.isoformat() if c.last_synced_at else None,
        }
        for c in conns
    ]


@router.post("/connections/{connection_id}/sync")
def sync_connection(
    connection_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Re-sync patient data from a FHIR server for an existing connection."""
    conn = session.exec(
        select(FHIRConnection).where(
            FHIRConnection.id == connection_id,
            FHIRConnection.patient_id == user.patient_id,
        )
    ).first()
    if not conn:
        raise HTTPException(status_code=404, detail="FHIR connection not found")
    if conn.status != "active":
        raise HTTPException(
            status_code=400,
            detail=f"Connection is {conn.status}; cannot sync",
        )

    sync_summary = _sync_fhir_data(conn, user.patient_id, session)

    # Audit
    session.add(
        AuditLog(
            patient_id=user.patient_id,
            action=f"FHIR data re-synced ({conn.ehr_name})",
            performed_by="You",
            icon="sync",
        )
    )
    session.commit()

    return {"status": "synced", "connection_id": conn.id, "sync": sync_summary}


@router.delete("/connections/{connection_id}")
def delete_connection(
    connection_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Remove (revoke) a FHIR connection."""
    conn = session.exec(
        select(FHIRConnection).where(
            FHIRConnection.id == connection_id,
            FHIRConnection.patient_id == user.patient_id,
        )
    ).first()
    if not conn:
        raise HTTPException(status_code=404, detail="FHIR connection not found")

    ehr_name = conn.ehr_name
    session.delete(conn)
    session.commit()

    # Audit
    session.add(
        AuditLog(
            patient_id=user.patient_id,
            action=f"FHIR connection removed ({ehr_name})",
            performed_by="You",
            icon="sync",
        )
    )
    session.commit()

    return {"status": "deleted", "connection_id": connection_id}
