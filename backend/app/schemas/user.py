"""
User and Authentication Schemas
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    name: str


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class EmailCodeRequest(BaseModel):
    """Request an email login code"""
    email: EmailStr


class EmailCodeVerifyRequest(BaseModel):
    """Verify an email login code to authenticate"""
    email: EmailStr
    code: str


class EmailCodeResponse(BaseModel):
    """Acknowledges email code creation"""
    message: str


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    is_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT Token response schema"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    """JWT Token payload schema"""
    sub: Optional[int] = None
    exp: Optional[datetime] = None
