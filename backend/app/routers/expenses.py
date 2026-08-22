import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.space import Space
from app.models.member import Member
from app.models.expense import Expense
from app.models.split import Split
from app.models.invite import Activity
from app.schemas.expense import ExpenseIn, ExpenseOut, SplitOut
from app.schemas.space import MemberOut
from app.core.security import get_current_user
from app.routers.spaces import get_space_member
from app.services.accounting import compute_splits, quantize_money

router = APIRouter(prefix="/api/spaces/{space_id}/expenses", tags=["expenses"])

def serialize_expense(db: Session, expense: Expense) -> dict:
    payer = db.get(Member, expense.paid_by)
    payer_out = MemberOut(
        id=payer.id if payer else expense.paid_by,
        name=payer.name if payer else "Unknown",
        email=payer.email if payer else "",
        role=payer.role if payer else "member",
        avatar=None
    )
    splits = db.scalars(select(Split).where(Split.expense_id == expense.id)).all()
    first_mode = splits[0].split_mode if splits else "equal"

    return {
        "id": expense.id,
        "title": expense.title,
        "amount": float(expense.amount),
        "currency": expense.currency,
        "original_amount": float(expense.original_amount) if expense.original_amount else None,
        "original_currency": expense.original_currency,
        "exchange_rate": float(expense.exchange_rate) if expense.exchange_rate else 1.0,
        "paid_by": payer_out.model_dump(),
        "category": expense.category,
        "note": expense.note,
        "created_at": expense.created_at.isoformat(),
        "split_mode": first_mode,
        "splits": [
            {
                "user_id": x.member_id,
                "amount": float(x.amount),
                "split_mode": x.split_mode,
                "split_value": float(x.split_value) if x.split_value else None
            }
            for x in splits
        ]
    }

@router.post("", response_model=dict)
def add_expense(
    space_id: str,
    data: ExpenseIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_space_member(db, space_id, user)
    space = db.get(Space, space_id)
    if not space:
        raise HTTPException(404, "Space not found")

    members = {m.id: m for m in db.scalars(select(Member).where(Member.space_id == space_id)).all()}
    if data.paid_by not in members:
        raise HTTPException(400, "Selected payer is not a member of this space")

    # Multi-currency calculation: if expense was in another currency, calculate amount in space currency
    target_amount = quantize_money(data.amount)
    original_amount = quantize_money(data.original_amount) if data.original_amount else target_amount
    original_currency = (data.original_currency or data.currency or space.currency).upper()
    rate = Decimal(str(data.exchange_rate or 1.0))

    if original_currency != space.currency and data.original_amount:
        # target amount = original_amount * rate
        target_amount = quantize_money(original_amount * rate)

    try:
        calculated_splits = compute_splits(
            total_amount=target_amount,
            split_mode=data.split_mode,
            splits=data.splits,
            member_ids=list(members.keys())
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    expense = Expense(
        id=str(uuid.uuid4()),
        space_id=space_id,
        title=data.title.strip(),
        amount=target_amount,
        currency=space.currency,
        original_amount=original_amount,
        original_currency=original_currency,
        exchange_rate=rate,
        paid_by=data.paid_by,
        category=data.category or "general",
        note=data.note.strip() if data.note else None
    )
    db.add(expense)
    db.flush()

    for mid, amt, val in calculated_splits:
        db.add(Split(
            id=str(uuid.uuid4()),
            expense_id=expense.id,
            member_id=mid,
            amount=amt,
            split_mode=data.split_mode.value,
            split_value=val
        ))

    db.add(Activity(
        id=str(uuid.uuid4()),
        space_id=space_id,
        message=f"{user.name} added {expense.title} · {expense.currency} {target_amount:.2f}"
    ))
    db.commit()
    db.refresh(expense)

    return serialize_expense(db, expense)

@router.put("/{expense_id}", response_model=dict)
def update_expense(
    space_id: str,
    expense_id: str,
    data: ExpenseIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_space_member(db, space_id, user)
    space = db.get(Space, space_id)
    expense = db.scalar(select(Expense).where(Expense.id == expense_id, Expense.space_id == space_id))
    if not expense:
        raise HTTPException(404, "Expense not found")

    members = {m.id: m for m in db.scalars(select(Member).where(Member.space_id == space_id)).all()}
    if data.paid_by not in members:
        raise HTTPException(400, "Selected payer is not a member of this space")

    target_amount = quantize_money(data.amount)
    original_amount = quantize_money(data.original_amount) if data.original_amount else target_amount
    original_currency = (data.original_currency or data.currency or space.currency).upper()
    rate = Decimal(str(data.exchange_rate or 1.0))

    if original_currency != space.currency and data.original_amount:
        target_amount = quantize_money(original_amount * rate)

    try:
        calculated_splits = compute_splits(
            total_amount=target_amount,
            split_mode=data.split_mode,
            splits=data.splits,
            member_ids=list(members.keys())
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    expense.title = data.title.strip()
    expense.amount = target_amount
    expense.original_amount = original_amount
    expense.original_currency = original_currency
    expense.exchange_rate = rate
    expense.paid_by = data.paid_by
    expense.category = data.category or "general"
    expense.note = data.note.strip() if data.note else None

    # Delete existing splits and replace
    old_splits = db.scalars(select(Split).where(Split.expense_id == expense.id)).all()
    for os_split in old_splits:
        db.delete(os_split)
    db.flush()

    for mid, amt, val in calculated_splits:
        db.add(Split(
            id=str(uuid.uuid4()),
            expense_id=expense.id,
            member_id=mid,
            amount=amt,
            split_mode=data.split_mode.value,
            split_value=val
        ))

    db.add(Activity(
        id=str(uuid.uuid4()),
        space_id=space_id,
        message=f"{user.name} updated {expense.title} · {expense.currency} {target_amount:.2f}"
    ))
    db.commit()
    db.refresh(expense)

    return serialize_expense(db, expense)

@router.delete("/{expense_id}")
def delete_expense(
    space_id: str,
    expense_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_space_member(db, space_id, user)
    expense = db.scalar(select(Expense).where(Expense.id == expense_id, Expense.space_id == space_id))
    if not expense:
        raise HTTPException(404, "Expense not found")

    title = expense.title
    db.delete(expense)
    db.add(Activity(
        id=str(uuid.uuid4()),
        space_id=space_id,
        message=f"{user.name} deleted {title}"
    ))
    db.commit()
    return {"ok": True}
