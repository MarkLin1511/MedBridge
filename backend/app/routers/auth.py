from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import Session, select
from starlette.requests import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.db import get_session
from app.models import User, AuditLog
from app.auth import (
    hash_password,
    verify_password,
    validate_password,
    create_access_token,
    get_current_user,
    generate_patient_id,
)

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str = "patient"
    dob: str | None = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    patient_id: str
    dob: str | None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest, session: Session = Depends(get_session)):
    # Validate password strength before creating user
    password_errors = validate_password(req.password)
    if password_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=password_errors,
        )

    existing = session.exec(select(User).where(User.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=req.email,
        first_name=req.first_name,
        last_name=req.last_name,
        role=req.role,
        dob=req.dob,
        hashed_password=hash_password(req.password),
        patient_id=generate_patient_id(),
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token({"sub": user.email})
    return AuthResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            patient_id=user.patient_id,
            dob=user.dob,
        ),
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == form.username)).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Capture client IP for audit log
    client_ip = request.client.host if request.client else None
    session.add(AuditLog(
        patient_id=user.patient_id,
        action="User logged in",
        performed_by="You",
        icon="eye",
        ip_address=client_ip,
    ))
    session.commit()

    token = create_access_token({"sub": user.email})
    return AuthResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            patient_id=user.patient_id,
            dob=user.dob,
        ),
    )


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Verify old password
    if not verify_password(body.old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    # Validate new password strength
    password_errors = validate_password(body.new_password)
    if password_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=password_errors,
        )

    user.hashed_password = hash_password(body.new_password)
    session.add(user)
    session.add(AuditLog(
        patient_id=user.patient_id,
        action="Password changed",
        performed_by="You",
        icon="eye",
    ))
    session.commit()
    session.refresh(user)
    return {"status": "ok", "message": "Password changed successfully"}


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        patient_id=user.patient_id,
        dob=user.dob,
    )
