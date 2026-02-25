import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.db import get_session
from app.auth import hash_password, create_access_token
from app.models import User
from app.routers import auth as auth_router_module


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override

    # Disable rate limiting during tests so login calls are not throttled
    auth_router_module.limiter.enabled = False

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()
    auth_router_module.limiter.enabled = True


@pytest.fixture(name="demo_user")
def demo_user_fixture(session: Session):
    user = User(
        email="test@example.com",
        first_name="Test",
        last_name="User",
        role="patient",
        hashed_password=hash_password("TestPass1"),
        patient_id="MBR-99990001",
        dob="1990-01-01",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(client: TestClient, demo_user):
    resp = client.post(
        "/api/auth/login",
        data={"username": "test@example.com", "password": "TestPass1"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
