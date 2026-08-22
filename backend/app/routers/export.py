from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.space import Space
from app.models.member import Member
from app.models.expense import Expense
from app.models.split import Split
from app.models.settlement import Settlement
from app.core.security import get_current_user
from app.routers.spaces import get_space_member
from app.services.export import generate_space_csv

router = APIRouter(prefix="/api/spaces/{space_id}/export", tags=["export"])

@router.get("/csv")
def export_space_csv(
    space_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_space_member(db, space_id, user)
    space = db.get(Space, space_id)
    if not space:
        raise HTTPException(404, "Space not found")

    members = db.scalars(select(Member).where(Member.space_id == space_id)).all()
    expenses = db.scalars(
        select(Expense).where(Expense.space_id == space_id).order_by(Expense.created_at.desc())
    ).all()
    exp_ids = [e.id for e in expenses]
    splits = db.scalars(select(Split).where(Split.expense_id.in_(exp_ids))).all() if exp_ids else []
    settlements = db.scalars(
        select(Settlement).where(Settlement.space_id == space_id).order_by(Settlement.created_at.desc())
    ).all()

    csv_data = generate_space_csv(
        space=space,
        members=members,
        expenses=expenses,
        splits=splits,
        settlements=settlements
    )

    safe_title = "".join(c for c in space.title if c.isalnum() or c in ("-", "_", " ")).strip().replace(" ", "_")
    filename = f"SplitSpace_{safe_title}_Ledger.csv"

    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
