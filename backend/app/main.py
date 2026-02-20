import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from sqlmodel import select, SQLModel

from .models import LabObservation
from .db import engine, get_session


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(
    title="MedBridge API",
    description="Unified patient health record API",
    version="0.1.0",
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


@app.post("/api/labs", status_code=201)
def ingest_lab(obs: LabObservation, session=Depends(get_session)):
    if obs.value is None:
        raise HTTPException(status_code=422, detail="Lab value is required")
    session.add(obs)
    session.commit()
    session.refresh(obs)
    return {"status": "ok", "id": obs.id}


@app.get("/api/patients/{patient_id}/labs", response_model=List[LabObservation])
def get_labs(
    patient_id: str,
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    source: Optional[str] = Query(default=None),
    session=Depends(get_session),
):
    statement = select(LabObservation).where(
        LabObservation.patient_id == patient_id
    )
    if source:
        statement = statement.where(LabObservation.source == source)
    statement = statement.order_by(LabObservation.timestamp.desc()).offset(offset).limit(limit)
    results = session.exec(statement).all()
    return results


@app.get("/api/health")
def health(session=Depends(get_session)):
    try:
        session.exec(select(1)).first()
        return {"status": "ok", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")
