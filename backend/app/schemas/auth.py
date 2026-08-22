from pydantic import BaseModel, Field, ConfigDict

class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6)

class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)

class ForgotPasswordIn(BaseModel):
    email: str = Field(min_length=3, max_length=255)

class ResetPasswordIn(BaseModel):
    token: str = Field(min_length=10)
    new_password: str = Field(min_length=6, max_length=128)

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    role: str = "member"
    avatar: str | None = None

class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class MessageOut(BaseModel):
    message: str
    ok: bool = True
