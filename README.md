# MedBridge

Unified patient health records across portals, providers, and wearables.

## What is this?

Healthcare portals don't talk to each other. Your lab results at one doctor's office (Epic) are invisible to your specialist (Cerner). MedBridge sits in between — aggregating, normalizing, and giving patients control of their own data.

## Architecture

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS (deployed on Vercel)
- **Backend**: FastAPI + SQLModel + PostgreSQL (deployed on Render/Railway)
- **Standards**: FHIR R4, LOINC codes for lab normalization

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system diagram.

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Docker (full stack)

```bash
docker compose up
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. See the file for all available options.

## Deploy

- **Frontend**: Connect this repo to Vercel. Set root directory to `frontend/`.
- **Backend**: Deploy via Docker on Render, Railway, or Fly.io.
