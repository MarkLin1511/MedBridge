import os
from sqlmodel import create_engine, Session

# Vercel serverless: writable path is /tmp
_default_db = "sqlite:////tmp/medbridge.db" if os.environ.get("VERCEL") else "sqlite:///./medbridge.db"
DATABASE_URL = os.environ.get("DATABASE_URL", _default_db)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def get_session():
    with Session(engine) as session:
        yield session
