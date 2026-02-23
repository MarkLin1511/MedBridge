import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select
from .db import get_session
from .models import User

# --- JWT Secret enforcement ---
# In production (Vercel), JWT_SECRET must be explicitly set.
# Locally, fall back to a dev-only default.
_jwt_secret_env = os.environ.get("JWT_SECRET")
if _jwt_secret_env:
    SECRET_KEY = _jwt_secret_env
elif os.environ.get("VERCEL"):
    raise RuntimeError(
        "JWT_SECRET environment variable must be set in production (Vercel). "
        "Refusing to start with a default secret."
    )
else:
    SECRET_KEY = "medbridge-dev-secret-change-in-production"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 240  # 4 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def validate_password(password: str) -> list[str]:
    """Validate password strength. Returns a list of error strings (empty means valid)."""
    errors: list[str] = []
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        errors.append("Password must contain at least one digit.")
    return errors


def change_password(user: User, old_password: str, new_password: str, session: Session) -> User:
    """Verify the old password, validate and hash the new one, persist and return the user.

    Raises HTTPException on verification failure or weak new password.
    """
    if not verify_password(old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    errors = validate_password(new_password)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=errors,
        )

    user.hashed_password = hash_password(new_password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = session.exec(select(User).where(User.email == email)).first()
    if user is None:
        raise credentials_exception
    return user


def generate_patient_id() -> str:
    import random
    return f"MBR-{random.randint(10000000, 99999999)}"
