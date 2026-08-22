from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.space import MemberOut

class SplitMode(str, Enum):
    EQUAL = "equal"
    EXACT = "exact"
    PERCENTAGE = "percentage"
    SHARES = "shares"

class SplitIn(BaseModel):
    user_id: str
    amount: Decimal = Field(default=Decimal("0.0"), ge=0)
    split_value: Decimal | None = None

class SplitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: str
    amount: Decimal
    split_mode: str = "equal"
    split_value: Decimal | None = None

class ExpenseIn(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    amount: Decimal = Field(gt=0)
    currency: str | None = None
    original_amount: Decimal | None = None
    original_currency: str | None = None
    exchange_rate: Decimal | None = Field(default=Decimal("1.0"), gt=0)
    category: str = "general"
    note: str = ""
    paid_by: str
    split_mode: SplitMode = SplitMode.EQUAL
    splits: list[SplitIn]

class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    amount: Decimal
    currency: str
    original_amount: Decimal | None = None
    original_currency: str | None = None
    exchange_rate: Decimal | None = None
    paid_by: MemberOut
    category: str
    note: str | None = None
    created_at: str
    split_mode: str = "equal"
    splits: list[SplitOut]
