Intermediary Health Hub — PoC

This repository contains a minimal proof-of-concept web app that demonstrates an intermediary to aggregate lab/bloodwork results from multiple patient portals into a single normalized view.

What's included
- Backend: FastAPI prototype that ingests lab data and stores it in memory.
- Frontend: Single static HTML page to send sample ingest requests and view stored labs.
- Architecture: ARCHITECTURE.md with a high-level diagram and notes.

Quickstart
1. Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --reload --port 8000
```

2. Frontend
- Open `frontend/index.html` in a browser (it talks to the backend at http://localhost:8000 by default).

Notes
- This PoC purposely uses in-memory storage and a simple LOINC mapping. Replace with a persistent DB (Postgres) and proper FHIR flows for production.
- Security, HIPAA compliance, and BAA considerations are not implemented in this PoC.

Next steps
- Implement persistent database and authentication (OAuth2 / SMART-on-FHIR flows).
- Implement robust FHIR mapping and a scraping adapter for portals that lack APIs.
- Add audit logging, encryption, and BAA documentation.

Deployment
- A `Dockerfile` and GitHub Actions workflow have been added to build and publish a container image to GitHub Container Registry. See `README_DEPLOY.md` for details.
