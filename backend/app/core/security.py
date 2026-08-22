import uuid
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.invite import TokenBlacklist

pwd = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def hash_password(password: str) -> str:
    return pwd.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd.verify(plain_password, hashed_password)

def create_access_token(user_id: str) -> str:
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "jti": jti,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired, please sign in again"
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or malformed authentication token"
        )

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    jti = payload.get("jti")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token claims")
        
    # Check if token was revoked
    if jti:
        revoked = db.scalar(select(TokenBlacklist).where(TokenBlacklist.jti == jti))
        if revoked:
            raise HTTPException(status_code=401, detail="Session has been logged out")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User account not found")
        
    return user

def revoke_token(token: str, db: Session):
    try:
        payload = decode_token(token)
        jti = payload.get("jti")
        user_id = payload.get("sub")
        exp_ts = payload.get("exp")
        expires_at = datetime.fromtimestamp(exp_ts, tz=timezone.utc) if exp_ts else datetime.now(timezone.utc) + timedelta(days=7)
        if jti and user_id:
            existing = db.scalar(select(TokenBlacklist).where(TokenBlacklist.jti == jti))
            if not existing:
                blacklist_entry = TokenBlacklist(
                    id=str(uuid.uuid4()),
                    jti=jti,
                    user_id=user_id,
                    expires_at=expires_at
                )
                db.add(blacklist_entry)
                db.commit()
    except Exception:
        pass
