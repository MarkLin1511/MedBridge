import os
from sqlmodel import create_engine, Session

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@db:5432/medical"
)

engine = create_engine(DATABASE_URL, echo=False)


def get_session():
    with Session(engine) as session:
        yield session
