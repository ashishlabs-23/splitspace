from decimal import Decimal, ROUND_HALF_UP
from typing import Sequence
from app.models.member import Member
from app.models.expense import Expense
from app.models.split import Split
from app.models.settlement import Settlement
from app.schemas.expense import SplitMode, SplitIn
from app.schemas.space import MemberOut

CENT = Decimal("0.01")

def quantize_money(val: Decimal | float | int | str) -> Decimal:
    if isinstance(val, float):
        val = str(val)
    return Decimal(str(val)).quantize(CENT, rounding=ROUND_HALF_UP)

def compute_splits(
    total_amount: Decimal,
    split_mode: SplitMode,
    splits: list[SplitIn],
    member_ids: list[str]
) -> list[tuple[str, Decimal, Decimal | None]]:
    """
    Computes deterministic exact cent allocations for splits based on the mode.
    Returns list of (member_id, exact_amount, split_value).
    """
    total = quantize_money(total_amount)
    total_cents = int(total * 100)
    
    if not splits:
        raise ValueError("At least one member must be selected for splits.")
        
    for s in splits:
        if s.user_id not in member_ids:
            raise ValueError(f"Member {s.user_id} is not in this space.")

    if split_mode == SplitMode.EQUAL:
        count = len(splits)
        base_cents = total_cents // count
        rem_cents = total_cents % count
        
        results = []
        for i, s in enumerate(splits):
            cents = base_cents + (1 if i < rem_cents else 0)
            amt = Decimal(cents) / Decimal(100)
            results.append((s.user_id, amt, None))
        return results

    elif split_mode == SplitMode.EXACT:
        allocated = Decimal("0.0")
        results = []
        for s in splits:
            amt = quantize_money(s.amount)
            allocated += amt
            results.append((s.user_id, amt, None))
        
        if allocated != total:
            diff = total - allocated
            raise ValueError(f"Exact splits sum to {allocated}, which does not match the expense total of {total} (difference: {diff}).")
        return results

    elif split_mode == SplitMode.PERCENTAGE:
        total_pct = sum(Decimal(str(s.split_value or 0)) for s in splits)
        if abs(total_pct - Decimal("100.0")) > Decimal("0.01"):
            raise ValueError(f"Split percentages must sum to 100% (currently {total_pct}%).")
        
        allocated_cents = 0
        raw_splits = []
        for s in splits:
            pct = Decimal(str(s.split_value or 0))
            share_cents = int((total * (pct / Decimal(100)) * 100).to_integral_value(rounding=ROUND_HALF_UP))
            allocated_cents += share_cents
            raw_splits.append((s.user_id, share_cents, pct))
            
        rem = total_cents - allocated_cents
        results = []
        for i, (uid, cents, pct) in enumerate(raw_splits):
            if i == 0 and rem != 0:
                cents += rem
            amt = Decimal(cents) / Decimal(100)
            results.append((uid, amt, pct))
        return results

    elif split_mode == SplitMode.SHARES:
        total_shares = sum(Decimal(str(s.split_value or 1)) for s in splits)
        if total_shares <= 0:
            raise ValueError("Total shares must be greater than zero.")
            
        allocated_cents = 0
        raw_splits = []
        for s in splits:
            shares = Decimal(str(s.split_value or 1))
            share_cents = int((total * (shares / total_shares) * 100).to_integral_value(rounding=ROUND_HALF_UP))
            allocated_cents += share_cents
            raw_splits.append((s.user_id, share_cents, shares))
            
        rem = total_cents - allocated_cents
        results = []
        for i, (uid, cents, shares) in enumerate(raw_splits):
            if i == 0 and rem != 0:
                cents += rem
            amt = Decimal(cents) / Decimal(100)
            results.append((uid, amt, shares))
        return results

    raise ValueError(f"Unsupported split mode: {split_mode}")


def calculate_settlements(
    members: Sequence[Member],
    expenses: Sequence[Expense],
    splits: Sequence[Split],
    settlements: Sequence[Settlement]
) -> tuple[dict[str, Decimal], dict[str, Decimal], dict[str, Decimal], list[dict]]:
    """
    Calculates exact balances taking recorded direct settlements into account,
    and returns (paid_map, owed_map, net_balances, simplified_settlements).
    """
    member_map = {m.id: m for m in members}
    paid = {m.id: Decimal("0.00") for m in members}
    owed = {m.id: Decimal("0.00") for m in members}

    # 1. Expense totals
    for e in expenses:
        if e.paid_by in paid:
            paid[e.paid_by] += quantize_money(e.amount)

    # 2. Split totals
    for s in splits:
        if s.member_id in owed:
            owed[s.member_id] += quantize_money(s.amount)

    # 3. Adjust for direct recorded settlements
    for st in settlements:
        # from_member paid to_member, which reduces from_member's debt (or increases credit)
        if st.from_member_id in paid:
            paid[st.from_member_id] += quantize_money(st.amount)
        if st.to_member_id in owed:
            owed[st.to_member_id] += quantize_money(st.amount)

    # 4. Net balances
    balances = {mid: quantize_money(paid[mid] - owed[mid]) for mid in paid}

    # 5. Greedy debt simplification
    credit = [[mid, balances[mid]] for mid in balances if balances[mid] > Decimal("0.00")]
    debt = [[mid, balances[mid]] for mid in balances if balances[mid] < Decimal("0.00")]

    credit.sort(key=lambda x: -x[1])
    debt.sort(key=lambda x: x[1])

    settlement_instructions = []
    i = 0
    j = 0
    while i < len(debt) and j < len(credit):
        debtor_id, debtor_bal = debt[i]
        creditor_id, creditor_bal = credit[j]

        transfer_amt = min(-debtor_bal, creditor_bal)
        transfer_amt = quantize_money(transfer_amt)

        if transfer_amt > Decimal("0.00"):
            from_m = member_map[debtor_id]
            to_m = member_map[creditor_id]
            settlement_instructions.append({
                "from_member": MemberOut(id=from_m.id, name=from_m.name, email=from_m.email, role=from_m.role),
                "to_member": MemberOut(id=to_m.id, name=to_m.name, email=to_m.email, role=to_m.role),
                "amount": transfer_amt
            })

        debt[i][1] += transfer_amt
        credit[j][1] -= transfer_amt

        if abs(debt[i][1]) < Decimal("0.009"):
            i += 1
        if abs(credit[j][1]) < Decimal("0.009"):
            j += 1

    return paid, owed, balances, settlement_instructions
