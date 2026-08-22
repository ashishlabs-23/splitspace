import uuid
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.space import Space
from app.models.member import Member
from app.models.invite import Invite, Activity
from app.core.security import get_current_user
from app.routers.spaces import get_space_member

router = APIRouter(tags=["invites"])

def to_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

@router.get("/api/invites/{token}")
def invite_info(token: str, db: Session = Depends(get_db)):
    inv = db.scalar(select(Invite).where(Invite.token == token))
    if not inv or to_utc(inv.expires_at) < datetime.now(timezone.utc):
        raise HTTPException(404, "Invite expired or not found")
    
    space = db.get(Space, inv.space_id)
    if not space:
        raise HTTPException(404, "Associated space no longer exists")

    return {
        "space_id": space.id,
        "title": space.title,
        "emoji": space.emoji,
        "expires_at": inv.expires_at.isoformat()
    }

@router.post("/api/invites/{token}/join")
def join_invite(token: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.scalar(select(Invite).where(Invite.token == token))
    if not inv or to_utc(inv.expires_at) < datetime.now(timezone.utc):
        raise HTTPException(404, "Invite expired or not found")
    
    space = db.get(Space, inv.space_id)
    if not space:
        raise HTTPException(404, "Associated space no longer exists")

    existing = db.scalar(
        select(Member).where(
            Member.space_id == space.id,
            ((Member.user_id == user.id) | (Member.email == user.email.lower()))
        )
    )
    if not existing:
        new_member = Member(
            id=str(uuid.uuid4()),
            space_id=space.id,
            user_id=user.id,
            name=user.name,
            email=user.email.lower(),
            role="member"
        )
        db.add(new_member)
        db.add(Activity(
            id=str(uuid.uuid4()),
            space_id=space.id,
            message=f"{user.name} joined the space"
        ))
        db.commit()
    elif not existing.user_id:
        existing.user_id = user.id
        db.commit()

    return {"space_id": space.id}

@router.post("/api/spaces/{space_id}/invite")
def create_invite(space_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_space_member(db, space_id, user)
    
    inv = Invite(
        id=str(uuid.uuid4()),
        space_id=space_id,
        token=secrets.token_urlsafe(24),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(inv)
    db.commit()

    return {"url": f"{settings.FRONTEND_URL}/join/{inv.token}"}
