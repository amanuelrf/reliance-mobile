"""
Credit Score Schemas
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Union, Literal


class CreditScoreBase(BaseModel):
    """Base credit score schema"""
    status: Literal["APPROVED", "REVIEW_REQUIRED", "DENIED", "INSUFFICIENT_DATA"]


class CreditScoreResponse(CreditScoreBase):
    """Credit score response schema"""
    id: int
    user_id: int
    mc_number: int
    approved_amount: int
    credit_check_uuid: str
    source: Literal["FactorsNetwork", "TransCredit", "Ansonia"]
    created_at: datetime

    class Config:
        from_attributes = True


class CreditHistory(BaseModel):
    """Credit history item schema"""
    month: str
    result: Literal["APPROVED", "REVIEW_REQUIRED", "DENIED", "INSUFFICIENT_DATA"]


class CreditCheckResponse(BaseModel):
    """Response after checking credit score"""
    score: CreditScoreResponse
    change: int
    message: str
    factor_cloud_uuid: Optional[str] = None


class CreditCheckRequest(BaseModel):
    """Request payload for credit check"""
    load_amount: float
    mc_number: Union[str, int]
    factor_cloud_uuid: Optional[str] = None
    credit_check_uuid: Optional[str] = None
    source: Optional[Literal["FactorsNetwork", "TransCredit", "Ansonia"]] = None


class CreditCheckRecordBase(BaseModel):
    """Common fields for stored credit checks"""
    mc_number: int
    status: Literal["APPROVED", "REVIEW_REQUIRED", "DENIED", "INSUFFICIENT_DATA"]
    approved_amount: int
    factor_cloud_uuid: Optional[str]
    credit_check_uuid: Optional[str]
    source: Literal["FactorsNetwork", "TransCredit", "Ansonia"]
    expiration_date: datetime


class CreditCheckRecordResponse(CreditCheckRecordBase):
    """Stored credit check response"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
