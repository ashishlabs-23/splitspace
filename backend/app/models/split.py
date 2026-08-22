import uuid
from decimal import Decimal
from sqlalchemy import String, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class Split(Base):
    __tablename__ = "expense_splits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    expense_id: Mapped[str] = mapped_column(ForeignKey("expenses.id", ondelete="CASCADE"), index=True, nullable=False)
    member_id: Mapped[str] = mapped_column(ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    split_mode: Mapped[str] = mapped_column(String(20), default="equal", nullable=False)
    split_value: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True) # stores percentage or shares if applicable
