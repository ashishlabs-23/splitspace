import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.space import Space
from app.models.member import Member
from app.models.settlement import Settlement
from app.models.invite import Activity
from app.schemas.settlement import SettlementIn, SettlementOut
from app.schemas.space import MemberOut
from app.core.security import get_current_user
from app.routers.spaces import get_space_member
from app.services.accounting import quantize_money

router = APIRouter(prefix="/api/spaces/{space_id}/settlements", tags=["settlements"])

def serialize_settlement(db: Session, settlement: Settlement) -> dict:
    from_m = db.get(Member, settlement.from_member_id)
    to_m = db.get(Member, settlement.to_member_id)
    return {
        "id": settlement.id,
        "space_id": settlement.space_id,
        "from_member": {
            "id": from_m.id if from_m else settlement.from_member_id,
            "name": from_m.name if from_m else "Unknown",
            "email": from_m.email if from_m else "",
            "role": from_m.role if from_m else "member",
            "avatar": None
        },
        "to_member": {
            "id": to_m.id if to_m else settlement.to_member_id,
            "name": to_m.name if to_m else "Unknown",
            "email": to_m.email if to_m else "",
            "role": to_m.role if to_m else "member",
            "avatar": None
        },
        "amount": float(settlement.amount),
        "currency": settlement.currency,
        "note": settlement.note,
        "created_at": settlement.created_at.isoformat()
    }

@router.get("", response_model=list[dict])
def list_settlements(
    space_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_space_member(db, space_id, user)
    settlements = db.scalars(
        select(Settlement).where(Settlement.space_id == space_id).order_by(Settlement.created_at.desc())
    ).all()
    return [serialize_settlement(db, s) for s in settlements]

@router.post("", response_model=dict)
def record_settlement(
    space_id: str,
    data: SettlementIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_space_member(db, space_id, user)
    space = db.get(Space, space_id)
    if not space:
        raise HTTPException(404, "Space not found")

    members = {m.id: m for m in db.scalars(select(Member).where(Member.space_id == space_id)).all()}
    if data.from_member_id not in members or data.to_member_id not in members:
        raise HTTPException(400, "One or both members are not part of this space")

    if data.from_member_id == data.to_member_id:
        raise HTTPException(400, "A member cannot settle with themselves")

    amt = quantize_money(data.amount)
    if amt <= Decimal("0.00"):
        raise HTTPException(400, "Settlement amount must be greater than zero")

    settlement = Settlement(
        id=str(uuid.uuid4()),
        space_id=space_id,
        from_member_id=data.from_member_id,
        to_member_id=data.to_member_id,
        amount=amt,
        currency=data.currency or space.currency,
        note=data.note.strip() if data.note else "Direct settlement"
    )
    db.add(settlement)

    from_name = members[data.from_member_id].name
    to_name = members[data.to_member_id].name
    db.add(Activity(
        id=str(uuid.uuid4()),
        space_id=space_id,
        message=f"{user.name} recorded payment: {from_name} paid {to_name} {settlement.currency} {amt:.2f}"
    ))
    db.commit()
    db.refresh(settlement)

    return serialize_settlement(db, settlement)

@router.delete("/{settlement_id}")
def delete_settlement(
    space_id: str,
    settlement_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_space_member(db, space_id, user)
    settlement = db.scalar(select(Settlement).where(Settlement.id == settlement_id, Settlement.space_id == space_id))
    if not settlement:
        raise HTTPException(404, "Settlement not found")

    db.delete(settlement)
    db.add(Activity(
        id=str(uuid.uuid4()),
        space_id=space_id,
        message=f"{user.name} deleted a recorded settlement"
    ))
    db.commit()
    return {"ok": True}
