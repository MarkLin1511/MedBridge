from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from typing import List
from sqlmodel import select
from datetime import datetime

from .models import LabObservation
from .db import engine, get_session

app = FastAPI(title="Intermediary Health Hub - PoC")


@app.on_event("startup")
def on_startup():
    # create tables (for PoC). For production, run alembic migrations.
    from sqlmodel import SQLModel

    SQLModel.metadata.create_all(engine)


@app.post("/api/labs", status_code=201)
def ingest_lab(obs: LabObservation, session=Depends(get_session)):
    session.add(obs)
    session.commit()
    session.refresh(obs)
    return {"status": "ok", "id": obs.id}


@app.get("/api/patients/{patient_id}/labs", response_model=List[LabObservation])
def get_labs(patient_id: str, session=Depends(get_session)):
    statement = select(LabObservation).where(LabObservation.patient_id == patient_id)
    results = session.exec(statement).all()
    return results


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve frontend static files (container path)
app.mount("/", StaticFiles(directory="/app/frontend", html=True), name="frontend")
