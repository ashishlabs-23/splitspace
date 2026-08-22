import uuid
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.member import Member
from app.models.invite import PasswordReset
from app.schemas.auth import (
    LoginIn, RegisterIn, ForgotPasswordIn, ResetPasswordIn,
    UserOut, AuthOut, MessageOut
)
from app.core.security import (
    hash_password, verify_password, create_access_token,
    get_current_user, revoke_token, oauth2_scheme
)
from app.core.rate_limiter import auth_rate_limiter, reset_rate_limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])

def to_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

@router.post("/register", response_model=AuthOut, dependencies=[Depends(auth_rate_limiter)])
def register(data: RegisterIn, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists"
        )
    
    user = User(
        id=str(uuid.uuid4()),
        name=data.name.strip(),
        email=email,
        password_hash=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserOut(id=user.id, name=user.name, email=user.email, role="member")
    }

@router.post("/login", response_model=AuthOut, dependencies=[Depends(auth_rate_limiter)])
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email.lower().strip()))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect"
        )
    
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserOut(id=user.id, name=user.name, email=user.email, role="member")
    }

@router.post("/logout", response_model=MessageOut)
def logout(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    revoke_token(token, db)
    return {"message": "Successfully logged out", "ok": True}

@router.post("/forgot-password", dependencies=[Depends(reset_rate_limiter)])
def forgot_password(data: ForgotPasswordIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email.lower().strip()))
    if not user:
        return {
            "message": "If that email exists in our system, a password reset link has been prepared.",
            "ok": True
        }
    
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    reset_entry = PasswordReset(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token=token,
        expires_at=expires_at,
        used=False
    )
    db.add(reset_entry)
    db.commit()

    return {
        "message": "Password reset token generated successfully",
        "reset_token": token,
        "expires_in_minutes": 60,
        "ok": True
    }

@router.post("/reset-password", response_model=MessageOut, dependencies=[Depends(reset_rate_limiter)])
def reset_password(data: ResetPasswordIn, db: Session = Depends(get_db)):
    reset_entry = db.scalar(
        select(PasswordReset).where(
            PasswordReset.token == data.token,
            PasswordReset.used == False
        )
    )
    if not reset_entry or to_utc(reset_entry.expires_at) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or has expired"
        )
    
    user = db.get(User, reset_entry.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    user.password_hash = hash_password(data.new_password)
    reset_entry.used = True
    db.commit()

    return {"message": "Your password has been successfully reset. You can now sign in.", "ok": True}

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = db.scalar(select(Member).where(Member.user_id == user.id, Member.role == "owner"))
    role = m.role if m else "member"
    return UserOut(id=user.id, name=user.name, email=user.email, role=role, avatar=None)
