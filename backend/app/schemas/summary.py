from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.schemas.space import MemberOut
from app.schemas.settlement import SettlementOut

class SettlementInstruction(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    from_member: MemberOut
    to_member: MemberOut
    amount: Decimal

class MemberBalance(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    member: MemberOut
    net_balance: Decimal
    total_paid: Decimal
    total_owed: Decimal

class SummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    total_spent: Decimal
    your_balance: Decimal
    people_count: int
    expense_count: int
    settlements: list[SettlementInstruction] = []
    recorded_settlements: list[SettlementOut] = []
    member_balances: list[MemberBalance] = []
