"""
Fuel Purchase Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Literal
from datetime import datetime, timedelta

from app.db.database import get_db
from app.db.models import FuelPurchase
from app.schemas.fuel import FuelPurchaseCreate, FuelPurchaseResponse, FuelSummary
from app.core.security import get_current_user_id

router = APIRouter()


def get_date_range(period: Literal["week", "month", "year"]) -> datetime:
    """Get start date based on period"""
    now = datetime.utcnow()
    if period == "week":
        return now - timedelta(days=7)
    elif period == "month":
        return now - timedelta(days=30)
    else:  # year
        return now - timedelta(days=365)


@router.get("/summary", response_model=FuelSummary)
async def get_fuel_summary(
    period: Literal["week", "month", "year"] = "month",
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get fuel spending summary for a period"""
    start_date = get_date_range(period)

    # Get aggregated data
    stats = (
        db.query(
            func.sum(FuelPurchase.total).label("total_spent"),
            func.sum(FuelPurchase.gallons).label("total_gallons"),
            func.avg(FuelPurchase.price_per_gallon).label("avg_price"),
        )
        .filter(
            FuelPurchase.user_id == user_id,
            FuelPurchase.date >= start_date,
        )
        .first()
    )

    # Get last fill-up
    last_fill_up = (
        db.query(FuelPurchase)
        .filter(FuelPurchase.user_id == user_id)
        .order_by(desc(FuelPurchase.date))
        .first()
    )

    total_spent = float(stats.total_spent or 0)
    total_gallons = float(stats.total_gallons or 0)
    avg_price = float(stats.avg_price or 0)

    # Calculate savings (assuming 5% rewards/savings on fuel)
    savings = total_spent * 0.05

    return FuelSummary(
        total_spent=round(total_spent, 2),
        total_gallons=round(total_gallons, 2),
        avg_price_per_gallon=round(avg_price, 2),
        savings=round(savings, 2),
        last_fill_up=FuelPurchaseResponse.model_validate(last_fill_up) if last_fill_up else None,
    )


@router.get("/history", response_model=List[FuelPurchaseResponse])
async def get_fuel_history(
    limit: int = 10,
    offset: int = 0,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get fuel purchase history"""
    purchases = (
        db.query(FuelPurchase)
        .filter(FuelPurchase.user_id == user_id)
        .order_by(desc(FuelPurchase.date))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [FuelPurchaseResponse.model_validate(p) for p in purchases]


@router.post("/purchase", response_model=FuelPurchaseResponse)
async def add_fuel_purchase(
    purchase_data: FuelPurchaseCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add a new fuel purchase"""
    total = round(purchase_data.gallons * purchase_data.price_per_gallon, 2)

    purchase = FuelPurchase(
        user_id=user_id,
        station=purchase_data.station,
        gallons=purchase_data.gallons,
        price_per_gallon=purchase_data.price_per_gallon,
        total=total,
        date=purchase_data.date or datetime.utcnow(),
    )

    db.add(purchase)
    db.commit()
    db.refresh(purchase)

    return FuelPurchaseResponse.model_validate(purchase)


@router.delete("/purchase/{purchase_id}")
async def delete_fuel_purchase(
    purchase_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a fuel purchase"""
    purchase = (
        db.query(FuelPurchase)
        .filter(FuelPurchase.id == purchase_id, FuelPurchase.user_id == user_id)
        .first()
    )

    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fuel purchase not found",
        )

    db.delete(purchase)
    db.commit()

    return {"message": "Fuel purchase deleted successfully"}
