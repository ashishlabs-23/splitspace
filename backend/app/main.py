import uuid
from decimal import Decimal
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models import (
    User, Space, Member, Expense, Split, Settlement,
    Invite, Activity, PasswordReset, TokenBlacklist
)
from app.core.security import hash_password
from app.routers import (
    auth_router,
    spaces_router,
    expenses_router,
    settlements_router,
    invites_router,
    export_router,
)

def seed_demo_data():
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == "demo@splitspace.local")):
            return

        demo_user = User(
            id=str(uuid.uuid4()),
            name="Ashish",
            email="demo@splitspace.local",
            password_hash=hash_password("demo1234")
        )
        db.add(demo_user)
        db.flush()

        space = Space(
            id=str(uuid.uuid4()),
            title="Goa Weekend",
            emoji="🌴",
            period="18–20 Aug 2026",
            currency="INR",
            created_by=demo_user.id
        )
        db.add(space)
        db.flush()

        names = [
            ("Ashish", "demo@splitspace.local", "owner", demo_user.id),
            ("Yatin", "yatin@example.com", "member", None),
            ("Rohan", "rohan@example.com", "member", None),
            ("Neha", "neha@example.com", "member", None),
        ]
        members = []
        for name, email, role, uid in names:
            m = Member(
                id=str(uuid.uuid4()),
                space_id=space.id,
                user_id=uid,
                name=name,
                email=email,
                role=role
            )
            db.add(m)
            members.append(m)
        db.flush()

        # Seed sample expenses with exact decimal splits
        seed_expenses = [
            ("Villa booking", Decimal("8800.00"), "accommodation", 0, "2 nights booking"),
            ("Airport cabs", Decimal("1460.00"), "transport", 3, "Both ways"),
            ("Dinner — Day 1", Decimal("2240.00"), "food", 1, "Beach shack dinner"),
            ("Scooter rental", Decimal("2100.00"), "transport", 2, "2 scooters for 2 days"),
        ]

        for title, amount, cat, payer_idx, note in seed_expenses:
            exp = Expense(
                id=str(uuid.uuid4()),
                space_id=space.id,
                title=title,
                amount=amount,
                currency="INR",
                original_amount=amount,
                original_currency="INR",
                exchange_rate=Decimal("1.0"),
                paid_by=members[payer_idx].id,
                category=cat,
                note=note
            )
            db.add(exp)
            db.flush()

            # 4-way exact split
            share = amount / Decimal("4.0")
            for m in members:
                db.add(Split(
                    id=str(uuid.uuid4()),
                    expense_id=exp.id,
                    member_id=m.id,
                    amount=share,
                    split_mode="equal"
                ))

        # Seed a sample direct payment settlement
        settlement = Settlement(
            id=str(uuid.uuid4()),
            space_id=space.id,
            from_member_id=members[1].id, # Yatin
            to_member_id=members[0].id,   # Ashish
            amount=Decimal("500.00"),
            currency="INR",
            note="Partial advance payment via UPI"
        )
        db.add(settlement)

        db.add(Activity(
            id=str(uuid.uuid4()),
            space_id=space.id,
            message="Demo space initialized with Goa Weekend expenses and settlements"
        ))
        db.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    Base.metadata.create_all(bind=engine)
    seed_demo_data()
    yield

app = FastAPI(
    title="SplitSpace API",
    version="2.1.0",
    lifespan=lifespan
)

# CORS Middleware
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(spaces_router)
app.include_router(expenses_router)
app.include_router(settlements_router)
app.include_router(invites_router)
app.include_router(export_router)

@app.get("/api/health")
def health():
    return {"ok": True, "version": "2.1.0"}
