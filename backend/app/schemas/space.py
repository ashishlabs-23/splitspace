from pydantic import BaseModel, Field, ConfigDict

class MemberIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=3, max_length=255)

class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    role: str = "member"
    avatar: str | None = None

class SpaceIn(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    emoji: str = "✦"
    period: str = ""
    currency: str = Field(default="INR", max_length=5)

class SpaceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    emoji: str
    period: str | None = None
    currency: str
    members: list[MemberOut] = []
    expenses: list[dict] = []
    created_at: str
