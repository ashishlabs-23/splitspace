from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.space import MemberOut

class SettlementIn(BaseModel):
    from_member_id: str
    to_member_id: str
    amount: Decimal = Field(gt=0)
    currency: str | None = None
    note: str = "Settlement payment"

class SettlementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    space_id: str
    from_member: MemberOut
    to_member: MemberOut
    amount: Decimal
    currency: str
    note: str | None = None
    created_at: str
