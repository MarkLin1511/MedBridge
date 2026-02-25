"""Tests for provider access endpoints: list, approve, deny."""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import ProviderAccess


def _make_provider(patient_id: str, **overrides) -> ProviderAccess:
    """Helper to create a ProviderAccess row with sensible defaults."""
    defaults = {
        "patient_id": patient_id,
        "provider_name": "Dr. Test Provider",
        "specialty": "General",
        "facility": "Test Hospital",
        "portal": "Epic MyChart",
        "access_level": "Full records",
        "status": "pending",
        "requested_access": "Full records",
        "request_date": "2026-02-20",
    }
    defaults.update(overrides)
    return ProviderAccess(**defaults)


class TestListProviders:
    """GET /api/providers"""

    def test_list_providers_empty(self, client: TestClient, auth_headers: dict):
        """When there are no providers, both connected and pending are empty."""
        resp = client.get("/api/providers", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        body = resp.json()
        assert body["connected"] == [], "connected should be empty"
        assert body["pending"] == [], "pending should be empty"


class TestApproveProvider:
    """POST /api/providers/{id}/approve"""

    def test_approve_provider(
        self, client: TestClient, auth_headers: dict, session: Session, demo_user
    ):
        """Approving a pending provider changes its status to active."""
        provider = _make_provider(demo_user.patient_id, status="pending")
        session.add(provider)
        session.commit()
        session.refresh(provider)

        resp = client.post(
            f"/api/providers/{provider.id}/approve",
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        assert resp.json()["status"] == "ok"

        # Verify the provider now appears in the connected list
        list_resp = client.get("/api/providers", headers=auth_headers)
        body = list_resp.json()
        active_ids = [p["id"] for p in body["connected"]]
        assert provider.id in active_ids, "Approved provider should appear in connected list"
        pending_ids = [p["id"] for p in body["pending"]]
        assert provider.id not in pending_ids, "Approved provider should no longer be pending"


class TestDenyProvider:
    """POST /api/providers/{id}/deny"""

    def test_deny_provider(
        self, client: TestClient, auth_headers: dict, session: Session, demo_user
    ):
        """Denying a pending provider changes its status to revoked."""
        provider = _make_provider(demo_user.patient_id, status="pending")
        session.add(provider)
        session.commit()
        session.refresh(provider)

        resp = client.post(
            f"/api/providers/{provider.id}/deny",
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        assert resp.json()["status"] == "ok"

        # Verify the provider is no longer in connected or pending
        list_resp = client.get("/api/providers", headers=auth_headers)
        body = list_resp.json()
        all_ids = [p["id"] for p in body["connected"]] + [p["id"] for p in body["pending"]]
        assert provider.id not in all_ids, (
            "Denied (revoked) provider should not appear in connected or pending"
        )


class TestProviderNotFound:
    """Edge case: nonexistent provider ID."""

    def test_provider_not_found(self, client: TestClient, auth_headers: dict):
        """Approving a nonexistent provider ID returns 404."""
        resp = client.post("/api/providers/999999/approve", headers=auth_headers)
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}: {resp.text}"
        assert "not found" in resp.json()["detail"].lower()
