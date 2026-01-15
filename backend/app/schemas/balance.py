"""
Balance and Transaction Schemas
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Literal, Optional


class BalanceResponse(BaseModel):
    """Balance response schema"""
    current_balance: float
    available_credit: float
    pending_transactions: float
    monthly_spent: float
    monthly_limit: float

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    """Base transaction schema"""
    description: str
    amount: float
    category: str


class TransactionCreate(TransactionBase):
    """Schema for creating a transaction"""
    type: Literal["credit", "debit"]


class TransactionResponse(TransactionBase):
    """Transaction response schema"""
    id: int
    user_id: int
    type: str
    date: datetime

    class Config:
        from_attributes = True


class AddFundsRequest(BaseModel):
    """Request to add funds"""
    amount: float


class TransferRequest(BaseModel):
    """Request to transfer funds"""
    amount: float
    to_account: str
    description: Optional[str] = None
