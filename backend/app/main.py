import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlmodel import SQLModel

from .db import engine
from .routers import auth, dashboard, records, providers, portals, notifications, settings, export_fhir, audit

# ---------------------------------------------------------------------------
# Rate limiter (module-level so routers can access via request.app.state.limiter)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    # Auto-seed demo data if DB is empty (works for both Vercel and local)
    from .seed import seed
    seed()
    yield


app = FastAPI(
    title="MedBridge API",
    description="Unified patient health record API",
    version="0.2.0",
    lifespan=lifespan,
)

# Attach rate limiter to app state and register its exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:8000,https://frontend-eta-murex-20.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(records.router)
app.include_router(providers.router)
app.include_router(portals.router)
app.include_router(notifications.router)
app.include_router(settings.router)
app.include_router(export_fhir.router)
app.include_router(audit.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "0.2.0"}
