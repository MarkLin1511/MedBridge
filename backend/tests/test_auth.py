"""Tests for authentication endpoints: signup, login, me, change-password."""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session


# ---------------------------------------------------------------------------
# Signup
# ---------------------------------------------------------------------------

class TestSignup:
    """POST /api/auth/signup"""

    def test_signup_success(self, client: TestClient):
        """Valid signup returns 200 with an access token and user payload."""
        resp = client.post(
            "/api/auth/signup",
            json={
                "email": "new@example.com",
                "password": "StrongPass1",
                "first_name": "New",
                "last_name": "User",
            },
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        body = resp.json()
        assert "access_token" in body, "Response must include an access_token"
        assert body["token_type"] == "bearer"
        assert body["user"]["email"] == "new@example.com"
        assert body["user"]["first_name"] == "New"
        assert body["user"]["last_name"] == "User"
        assert body["user"]["patient_id"].startswith("MBR-"), "patient_id should start with MBR-"

    def test_signup_weak_password(self, client: TestClient):
        """Weak password ('123') is rejected with 422 and validation errors."""
        resp = client.post(
            "/api/auth/signup",
            json={
                "email": "weak@example.com",
                "password": "123",
                "first_name": "Weak",
                "last_name": "Pass",
            },
        )
        assert resp.status_code == 422, f"Expected 422, got {resp.status_code}: {resp.text}"
        detail = resp.json()["detail"]
        assert isinstance(detail, list), "Validation errors should be a list"
        assert len(detail) > 0, "There should be at least one password validation error"

    def test_signup_duplicate_email(self, client: TestClient, demo_user):
        """Signing up with an already-registered email returns 400."""
        resp = client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",  # same as demo_user
                "password": "StrongPass1",
                "first_name": "Dup",
                "last_name": "User",
            },
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"
        assert "already registered" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class TestLogin:
    """POST /api/auth/login"""

    def test_login_success(self, client: TestClient, demo_user):
        """Login with correct credentials returns 200 and an access token."""
        resp = client.post(
            "/api/auth/login",
            data={"username": "test@example.com", "password": "TestPass1"},
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        body = resp.json()
        assert "access_token" in body, "Response must include an access_token"
        assert body["token_type"] == "bearer"
        assert body["user"]["email"] == "test@example.com"

    def test_login_wrong_password(self, client: TestClient, demo_user):
        """Login with the wrong password returns 401."""
        resp = client.post(
            "/api/auth/login",
            data={"username": "test@example.com", "password": "WrongPassword1"},
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}: {resp.text}"

    def test_login_nonexistent_user(self, client: TestClient):
        """Login with an email that does not exist returns 401."""
        resp = client.post(
            "/api/auth/login",
            data={"username": "nobody@example.com", "password": "Whatever1"},
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}: {resp.text}"


# ---------------------------------------------------------------------------
# Me
# ---------------------------------------------------------------------------

class TestMe:
    """GET /api/auth/me"""

    def test_me_authenticated(self, client: TestClient, auth_headers: dict):
        """Authenticated request to /me returns 200 with user info."""
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        body = resp.json()
        assert body["email"] == "test@example.com"
        assert body["first_name"] == "Test"
        assert body["last_name"] == "User"
        assert body["role"] == "patient"
        assert body["patient_id"] == "MBR-99990001"

    def test_me_no_token(self, client: TestClient):
        """Request to /me without a token returns 401."""
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}: {resp.text}"


# ---------------------------------------------------------------------------
# Change Password
# ---------------------------------------------------------------------------

class TestChangePassword:
    """POST /api/auth/change-password"""

    def test_change_password_success(self, client: TestClient, auth_headers: dict):
        """Changing password with the correct old password succeeds."""
        resp = client.post(
            "/api/auth/change-password",
            json={"old_password": "TestPass1", "new_password": "NewStrong1"},
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        assert resp.json()["status"] == "ok"

        # Verify the new password works for login
        login_resp = client.post(
            "/api/auth/login",
            data={"username": "test@example.com", "password": "NewStrong1"},
        )
        assert login_resp.status_code == 200, "Should be able to login with the new password"

    def test_change_password_wrong_old(self, client: TestClient, auth_headers: dict):
        """Changing password with an incorrect old password returns 400."""
        resp = client.post(
            "/api/auth/change-password",
            json={"old_password": "WrongOldPass1", "new_password": "NewStrong1"},
            headers=auth_headers,
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"
        assert "incorrect" in resp.json()["detail"].lower()
