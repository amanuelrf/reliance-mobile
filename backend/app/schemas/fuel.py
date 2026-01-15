"""
Fuel Purchase Schemas
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FuelPurchaseBase(BaseModel):
    """Base fuel purchase schema"""
    station: str
    gallons: float
    price_per_gallon: float


class FuelPurchaseCreate(FuelPurchaseBase):
    """Schema for creating a fuel purchase"""
    date: Optional[datetime] = None


class FuelPurchaseResponse(FuelPurchaseBase):
    """Fuel purchase response schema"""
    id: int
    user_id: int
    total: float
    date: datetime

    class Config:
        from_attributes = True


class FuelSummary(BaseModel):
    """Fuel summary statistics schema"""
    total_spent: float
    total_gallons: float
    avg_price_per_gallon: float
    savings: float
    last_fill_up: Optional[FuelPurchaseResponse] = None
