import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from .db import engine
from .routers import auth, dashboard, records, providers, portals, notifications, settings, export_fhir, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(
    title="MedBridge API",
    description="Unified patient health record API",
    version="0.2.0",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = os.environ.get(
    "CORS_ORIGINS", "http://localhost:3000,http://localhost:8000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
