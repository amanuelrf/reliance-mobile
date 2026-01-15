"""
Dashboard Routes - Home screen data
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.db.database import get_db
from app.db.models import User, CreditScore, Balance, Transaction
from app.schemas.user import UserResponse
from app.schemas.balance import TransactionResponse
from app.core.security import get_current_user_id
from pydantic import BaseModel


class DashboardData(BaseModel):
    """Dashboard response schema"""
    user: UserResponse
    credit_score: int
    balance: float
    fuel_savings: float
    recent_transactions: List[TransactionResponse]


router = APIRouter()


@router.get("", response_model=DashboardData)
async def get_dashboard_data(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get all dashboard data for home screen"""
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Get latest credit score
    credit_score = (
        db.query(CreditScore)
        .filter(CreditScore.user_id == user_id)
        .order_by(desc(CreditScore.checked_at))
        .first()
    )

    # Get balance
    balance = db.query(Balance).filter(Balance.user_id == user_id).first()

    # Get recent transactions
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(desc(Transaction.date))
        .limit(5)
        .all()
    )

    # Calculate fuel savings (mock calculation)
    fuel_savings = 1250.50  # This would be calculated from actual fuel purchases

    return DashboardData(
        user=UserResponse.model_validate(user),
        credit_score=credit_score.score if credit_score else 0,
        balance=balance.current_balance if balance else 0.0,
        fuel_savings=fuel_savings,
        recent_transactions=[TransactionResponse.model_validate(t) for t in transactions],
    )
