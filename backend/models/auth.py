from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    uid: str
    email: str
    name: str
    role: str
    department: str
    assigned_subjects: list[str]
    special_tags: list[str]
    status: str


class LoginResponse(BaseModel):
    token: str
    user: UserOut
    expires_at: str  # ISO timestamp


class ReauthRequest(BaseModel):
    password: str


class ReauthResponse(BaseModel):
    success: bool
    reauthed_at: str  # ISO timestamp


class LogoutTabRequest(BaseModel):
    token: Optional[str] = None
