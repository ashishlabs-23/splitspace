import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.space import Space
from app.models.member import Member
from app.models.expense import Expense
from app.models.split import Split
from app.models.settlement import Settlement
from app.models.invite import Invite, Activity
from app.schemas.space import SpaceIn, SpaceOut, MemberIn, MemberOut
from app.schemas.summary import SummaryOut, MemberBalance
from app.core.security import get_current_user
from app.services.accounting import calculate_settlements

router = APIRouter(prefix="/api/spaces", tags=["spaces"])

def get_space_member(db: Session, space_id: str, user: User) -> Member:
    member = db.scalar(
        select(Member).where(
            Member.space_id == space_id,
            ((Member.user_id == user.id) | (Member.email == user.email))
        )
    )
    if not member:
        raise HTTPException(status_code=404, detail="Space not found or access denied")
    return member

def serialize_space(db: Session, space: Space) -> dict:
    members = db.scalars(select(Member).where(Member.space_id == space.id)).all()
    expenses = db.scalars(
        select(Expense).where(Expense.space_id == space.id).order_by(Expense.created_at.desc())
    ).all()
    
    m_by = {m.id: m for m in members}
    exp_out = []
    for e in expenses:
        payer = m_by.get(e.paid_by, Member(id=e.paid_by, name="Unknown", email=""))
        splits = db.scalars(select(Split).where(Split.expense_id == e.id)).all()
        first_mode = splits[0].split_mode if splits else "equal"
        exp_out.append({
            "id": e.id,
            "title": e.title,
            "amount": float(e.amount),
            "currency": e.currency,
            "original_amount": float(e.original_amount) if e.original_amount else None,
            "original_currency": e.original_currency,
            "exchange_rate": float(e.exchange_rate) if e.exchange_rate else 1.0,
            "paid_by": {"id": payer.id, "name": payer.name, "email": payer.email, "role": payer.role, "avatar": None},
            "category": e.category,
            "note": e.note,
            "created_at": e.created_at.isoformat(),
            "split_mode": first_mode,
            "splits": [{"user_id": x.member_id, "amount": float(x.amount), "split_mode": x.split_mode, "split_value": float(x.split_value) if x.split_value else None} for x in splits]
        })

    return {
        "id": space.id,
        "title": space.title,
        "emoji": space.emoji,
        "period": space.period,
        "currency": space.currency,
        "members": [{"id": m.id, "name": m.name, "email": m.email, "role": m.role, "avatar": None} for m in members],
        "expenses": exp_out,
        "created_at": space.created_at.isoformat()
    }

@router.get("", response_model=list[dict])
def list_spaces(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    members = db.scalars(
        select(Member).where((Member.user_id == user.id) | (Member.email == user.email))
    ).all()
    space_ids = {m.space_id for m in members}
    if not space_ids:
        return []
    
    spaces = db.scalars(
        select(Space).where(Space.id.in_(space_ids)).order_by(Space.created_at.desc())
    ).all()
    return [serialize_space(db, sp) for sp in spaces]

@router.post("", response_model=dict)
def create_space(data: SpaceIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    space = Space(
        id=str(uuid.uuid4()),
        title=data.title.strip(),
        emoji=data.emoji or "✦",
        period=data.period.strip() if data.period else None,
        currency=data.currency.upper(),
        created_by=user.id
    )
    db.add(space)
    db.flush()

    member = Member(
        id=str(uuid.uuid4()),
        space_id=space.id,
        user_id=user.id,
        name=user.name,
        email=user.email,
        role="owner"
    )
    db.add(member)
    db.add(Activity(id=str(uuid.uuid4()), space_id=space.id, message=f"{user.name} created the space"))
    db.commit()
    db.refresh(space)

    return serialize_space(db, space)

@router.get("/{space_id}", response_model=dict)
def get_space(space_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_space_member(db, space_id, user)
    space = db.get(Space, space_id)
    if not space:
        raise HTTPException(404, "Space not found")
    return serialize_space(db, space)

@router.delete("/{space_id}")
def delete_space(space_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_space_member(db, space_id, user)
    space = db.get(Space, space_id)
    if not space:
        raise HTTPException(404, "Space not found")
        
    members_count = db.scalar(select(func.count()).select_from(Member).where(Member.space_id == space_id)) or 0
    if me.role not in {"owner", "admin"} and space.created_by != user.id and members_count > 1:
        raise HTTPException(403, "Only the space owner or creator can delete this space")

    # Clean cascading deletions
    expenses = db.scalars(select(Expense).where(Expense.space_id == space_id)).all()
    exp_ids = [e.id for e in expenses]
    if exp_ids:
        for split in db.scalars(select(Split).where(Split.expense_id.in_(exp_ids))).all():
            db.delete(split)
    for e in expenses:
        db.delete(e)
    for st in db.scalars(select(Settlement).where(Settlement.space_id == space_id)).all():
        db.delete(st)
    for inv in db.scalars(select(Invite).where(Invite.space_id == space_id)).all():
        db.delete(inv)
    for act in db.scalars(select(Activity).where(Activity.space_id == space_id)).all():
        db.delete(act)
    for m in db.scalars(select(Member).where(Member.space_id == space_id)).all():
        db.delete(m)
        
    db.delete(space)
    db.commit()
    return {"ok": True}

@router.post("/{space_id}/leave")
def leave_space(space_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_space_member(db, space_id, user)
    space = db.get(Space, space_id)
    if not space:
        raise HTTPException(404, "Space not found")
        
    all_members = db.scalars(select(Member).where(Member.space_id == space_id)).all()
    if len(all_members) <= 1 or me.role == "owner" or space.created_by == user.id:
        return delete_space(space_id, user, db)

    db.delete(me)
    db.add(Activity(id=str(uuid.uuid4()), space_id=space_id, message=f"{user.name} left the space"))
    db.commit()
    return {"ok": True}

@router.post("/{space_id}/members", response_model=MemberOut)
def add_member(space_id: str, data: MemberIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_space_member(db, space_id, user)
    if me.role not in {"owner", "admin"}:
        raise HTTPException(403, "Only space admins can add people")
        
    email_clean = data.email.lower().strip()
    existing = db.scalar(select(Member).where(Member.space_id == space_id, Member.email == email_clean))
    if existing:
        raise HTTPException(409, "That person is already in the space")

    # Link existing user account if registered
    linked_user = db.scalar(select(User).where(User.email == email_clean))

    member = Member(
        id=str(uuid.uuid4()),
        space_id=space_id,
        user_id=linked_user.id if linked_user else None,
        name=data.name.strip(),
        email=email_clean,
        role="member"
    )
    db.add(member)
    db.add(Activity(id=str(uuid.uuid4()), space_id=space_id, message=f"{user.name} added {member.name}"))
    db.commit()
    db.refresh(member)

    return MemberOut(id=member.id, name=member.name, email=member.email, role=member.role, avatar=None)

@router.get("/{space_id}/summary", response_model=SummaryOut)
def space_summary(space_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    me = get_space_member(db, space_id, user)
    members = db.scalars(select(Member).where(Member.space_id == space_id)).all()
    expenses = db.scalars(select(Expense).where(Expense.space_id == space_id)).all()
    exp_ids = [e.id for e in expenses]
    splits = db.scalars(select(Split).where(Split.expense_id.in_(exp_ids))).all() if exp_ids else []
    settlements = db.scalars(select(Settlement).where(Settlement.space_id == space_id).order_by(Settlement.created_at.desc())).all()

    paid, owed, balances, simplified_settlements = calculate_settlements(members, expenses, splits, settlements)
    total_spent = sum((e.amount for e in expenses), Decimal("0.00"))

    member_map = {m.id: m for m in members}
    recorded_settlements_out = [
        {
            "id": st.id,
            "space_id": st.space_id,
            "from_member": MemberOut(id=member_map[st.from_member_id].id, name=member_map[st.from_member_id].name, email=member_map[st.from_member_id].email, role=member_map[st.from_member_id].role),
            "to_member": MemberOut(id=member_map[st.to_member_id].id, name=member_map[st.to_member_id].name, email=member_map[st.to_member_id].email, role=member_map[st.to_member_id].role),
            "amount": st.amount,
            "currency": st.currency,
            "note": st.note,
            "created_at": st.created_at.isoformat()
        }
        for st in settlements if st.from_member_id in member_map and st.to_member_id in member_map
    ]

    member_balances_out = [
        MemberBalance(
            member=MemberOut(id=m.id, name=m.name, email=m.email, role=m.role),
            net_balance=balances.get(m.id, Decimal("0.00")),
            total_paid=paid.get(m.id, Decimal("0.00")),
            total_owed=owed.get(m.id, Decimal("0.00"))
        )
        for m in members
    ]

    return SummaryOut(
        total_spent=total_spent,
        your_balance=balances.get(me.id, Decimal("0.00")),
        people_count=len(members),
        expense_count=len(expenses),
        settlements=simplified_settlements,
        recorded_settlements=recorded_settlements_out,
        member_balances=member_balances_out
    )
