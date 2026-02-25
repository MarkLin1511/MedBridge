"""Tests for the health check endpoint."""
from fastapi.testclient import TestClient


class TestHealth:
    """GET /api/health"""

    def test_health(self, client: TestClient):
        """Health endpoint returns 200 with status ok and current version."""
        resp = client.get("/api/health")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        body = resp.json()
        assert body == {"status": "ok", "version": "0.2.0"}, (
            f"Unexpected health response: {body}"
        )
