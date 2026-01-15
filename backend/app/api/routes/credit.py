"""
Credit Score Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime
import random

from app.db.database import get_db
from app.db.models import CreditScore
from app.schemas.credit import CreditScoreResponse, CreditFactor, CreditHistory, CreditCheckResponse
from app.core.security import get_current_user_id

router = APIRouter()


def get_rating(score: int) -> str:
    """Get rating based on score"""
    if score >= 750:
        return "Excellent"
    elif score >= 700:
        return "Good"
    elif score >= 650:
        return "Fair"
    else:
        return "Poor"


def get_factor_status(score: int) -> str:
    """Get factor status based on score"""
    if score >= 90:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 50:
        return "Fair"
    else:
        return "Poor"


def build_factors(credit_score: CreditScore) -> List[CreditFactor]:
    """Build credit factors list from credit score model"""
    return [
        CreditFactor(
            name="Payment History",
            score=credit_score.payment_history_score,
            status=get_factor_status(credit_score.payment_history_score),
        ),
        CreditFactor(
            name="Credit Utilization",
            score=credit_score.credit_utilization_score,
            status=get_factor_status(credit_score.credit_utilization_score),
        ),
        CreditFactor(
            name="Credit Age",
            score=credit_score.credit_age_score,
            status=get_factor_status(credit_score.credit_age_score),
        ),
        CreditFactor(
            name="Credit Mix",
            score=credit_score.credit_mix_score,
            status=get_factor_status(credit_score.credit_mix_score),
        ),
        CreditFactor(
            name="New Credit",
            score=credit_score.new_credit_score,
            status=get_factor_status(credit_score.new_credit_score),
        ),
    ]


@router.get("/score", response_model=CreditScoreResponse)
async def get_current_score(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get user's current credit score"""
    credit_score = (
        db.query(CreditScore)
        .filter(CreditScore.user_id == user_id)
        .order_by(desc(CreditScore.checked_at))
        .first()
    )

    if not credit_score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No credit score found. Please run a credit check.",
        )

    response = CreditScoreResponse.model_validate(credit_score)
    response.factors = build_factors(credit_score)
    return response


@router.post("/check", response_model=CreditCheckResponse)
async def check_credit_score(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Perform a new credit check"""
    # Get previous score for comparison
    previous_score = (
        db.query(CreditScore)
        .filter(CreditScore.user_id == user_id)
        .order_by(desc(CreditScore.checked_at))
        .first()
    )
    prev_score_value = previous_score.score if previous_score else 700

    # Simulate credit check (in production, this would call a credit bureau API)
    new_score_value = min(850, max(300, prev_score_value + random.randint(-10, 15)))

    # Generate factor scores
    new_credit_score = CreditScore(
        user_id=user_id,
        score=new_score_value,
        rating=get_rating(new_score_value),
        payment_history_score=random.randint(75, 100),
        credit_utilization_score=random.randint(60, 90),
        credit_age_score=random.randint(50, 80),
        credit_mix_score=random.randint(65, 90),
        new_credit_score=random.randint(70, 95),
    )

    db.add(new_credit_score)
    db.commit()
    db.refresh(new_credit_score)

    response = CreditScoreResponse.model_validate(new_credit_score)
    response.factors = build_factors(new_credit_score)

    change = new_score_value - prev_score_value
    message = (
        f"Your score {'increased' if change > 0 else 'decreased' if change < 0 else 'stayed the same'}"
        f" by {abs(change)} points."
    )

    return CreditCheckResponse(score=response, change=change, message=message)


@router.get("/history", response_model=List[CreditHistory])
async def get_credit_history(
    months: int = 6,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get credit score history"""
    scores = (
        db.query(CreditScore)
        .filter(CreditScore.user_id == user_id)
        .order_by(desc(CreditScore.checked_at))
        .limit(months)
        .all()
    )

    return [
        CreditHistory(
            month=score.checked_at.strftime("%b"),
            score=score.score,
        )
        for score in reversed(scores)
    ]


@router.get("/factors", response_model=List[CreditFactor])
async def get_credit_factors(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get detailed credit factors"""
    credit_score = (
        db.query(CreditScore)
        .filter(CreditScore.user_id == user_id)
        .order_by(desc(CreditScore.checked_at))
        .first()
    )

    if not credit_score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No credit score found.",
        )

    return build_factors(credit_score)
