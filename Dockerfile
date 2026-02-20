# Simple Dockerfile for the PoC FastAPI app
FROM python:3.11-slim
WORKDIR /app

# system deps
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# copy backend and frontend
COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend

RUN python -m pip install --upgrade pip
RUN pip install -r requirements.txt

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]
