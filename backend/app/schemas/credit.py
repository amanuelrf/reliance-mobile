"""
Credit Score Schemas
"""

from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class CreditFactor(BaseModel):
    """Credit score factor schema"""
    name: str
    score: int
    status: str


class CreditScoreBase(BaseModel):
    """Base credit score schema"""
    score: int
    rating: str


class CreditScoreResponse(CreditScoreBase):
    """Credit score response schema"""
    id: int
    user_id: int
    checked_at: datetime
    factors: List[CreditFactor] = []

    class Config:
        from_attributes = True


class CreditHistory(BaseModel):
    """Credit history item schema"""
    month: str
    score: int


class CreditCheckResponse(BaseModel):
    """Response after checking credit score"""
    score: CreditScoreResponse
    change: int
    message: str
