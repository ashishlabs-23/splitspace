import csv
import io
from datetime import datetime, timezone
from decimal import Decimal
from typing import Sequence
from app.models.space import Space
from app.models.member import Member
from app.models.expense import Expense
from app.models.split import Split
from app.models.settlement import Settlement
from app.services.accounting import calculate_settlements

def generate_space_csv(
    space: Space,
    members: Sequence[Member],
    expenses: Sequence[Expense],
    splits: Sequence[Split],
    settlements: Sequence[Settlement]
) -> str:
    output = io.StringIO()
    # Write UTF-8 BOM for Excel compatibility
    output.write('\ufeff')
    writer = csv.writer(output)

    # Space Header
    writer.writerow(["SPACE OVERVIEW", "", "", "", "", ""])
    writer.writerow(["Title", space.title, "", "Currency", space.currency, ""])
    writer.writerow(["Period", space.period or "N/A", "", "Export Date", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"), ""])
    writer.writerow([])

    # Balances Section
    paid, owed, balances, simplified_settlements = calculate_settlements(members, expenses, splits, settlements)
    writer.writerow(["MEMBER BALANCES SUMMARY", "", "", "", "", ""])
    writer.writerow(["Member Name", "Email", "Role", "Total Paid", "Total Owed", "Net Balance"])
    for m in members:
        writer.writerow([
            m.name,
            m.email,
            m.role,
            f"{paid.get(m.id, Decimal('0.00')):.2f}",
            f"{owed.get(m.id, Decimal('0.00')):.2f}",
            f"{balances.get(m.id, Decimal('0.00')):.2f}",
        ])
    writer.writerow([])

    # Suggested Settlements
    writer.writerow(["SUGGESTED SETTLEMENT TRANSFERS", "", "", "", "", ""])
    writer.writerow(["From (Payer)", "To (Recipient)", "Amount", "Currency", "", ""])
    if simplified_settlements:
        for s in simplified_settlements:
            writer.writerow([s["from_member"].name, s["to_member"].name, f"{s['amount']:.2f}", space.currency, "", ""])
    else:
        writer.writerow(["All settled up!", "", "", "", "", ""])
    writer.writerow([])

    # Recorded Direct Settlements
    writer.writerow(["RECORDED DIRECT PAYMENTS / SETTLEMENTS", "", "", "", "", ""])
    writer.writerow(["Date", "Payer", "Recipient", "Amount", "Currency", "Note"])
    member_map = {m.id: m for m in members}
    if settlements:
        for st in settlements:
            from_name = member_map.get(st.from_member_id, Member(name="Unknown")).name
            to_name = member_map.get(st.to_member_id, Member(name="Unknown")).name
            writer.writerow([
                st.created_at.strftime("%Y-%m-%d %H:%M"),
                from_name,
                to_name,
                f"{st.amount:.2f}",
                st.currency,
                st.note or "",
            ])
    else:
        writer.writerow(["No direct settlements recorded", "", "", "", "", ""])
    writer.writerow([])

    # Expenses Ledger
    writer.writerow(["EXPENSES LEDGER", "", "", "", "", ""])
    writer.writerow(["Date", "Title", "Category", "Paid By", "Amount", "Currency", "Original Currency", "Original Amount", "Split Mode", "Note"])
    splits_by_exp: dict[str, list[Split]] = {}
    for sp in splits:
        splits_by_exp.setdefault(sp.expense_id, []).append(sp)

    for e in expenses:
        payer = member_map.get(e.paid_by, Member(name="Unknown")).name
        first_split = splits_by_exp.get(e.id, [Split(split_mode="equal")])[0]
        writer.writerow([
            e.created_at.strftime("%Y-%m-%d %H:%M"),
            e.title,
            e.category,
            payer,
            f"{e.amount:.2f}",
            e.currency,
            e.original_currency or e.currency,
            f"{e.original_amount:.2f}" if e.original_amount else f"{e.amount:.2f}",
            first_split.split_mode,
            e.note or "",
        ])

    return output.getvalue()
