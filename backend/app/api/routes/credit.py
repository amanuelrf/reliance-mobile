"""
Credit Score Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime, timedelta

from app.db.database import get_db
from app.db.models import CreditCheckHistory, CreditCheck
from app.schemas.credit import (
    CreditScoreResponse,
    CreditHistory,
    CreditCheckResponse,
    CreditCheckRequest,
    CreditCheckRecordResponse,
)
from app.core.security import get_current_user_id, generate_uuid
from app.core.factors_network import FactorsNetworkClient

router = APIRouter()


def calculate_approved_amount(status_value: str, load_amount: float) -> int:
    """Calculate approved amount based on credit status and load amount"""
    status_upper = status_value.upper()
    if status_upper == "APPROVED":
        return int(load_amount)
    elif status_upper == "REVIEW_REQUIRED":
        return int(load_amount * 0.5)
    elif status_upper == "DENIED":
        return 0
    else:
        return 0


def calculate_expiration_date(status_value: str) -> datetime:
    """Calculate expiration date based on credit status"""
    status_upper = status_value.upper()
    base_date = datetime.utcnow()
    if status_upper == "APPROVED":
        return base_date + timedelta(days=90)
    elif status_upper == "REVIEW_REQUIRED":
        return base_date + timedelta(days=30)
    elif status_upper == "DENIED":
        return base_date + timedelta(days=7)
    else:
        return base_date + timedelta(days=7)


@router.get("/score", response_model=CreditScoreResponse)
async def get_current_score(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get user's current credit score"""
    credit_history = (
        db.query(CreditCheckHistory)
        .filter(CreditCheckHistory.user_id == user_id)
        .order_by(desc(CreditCheckHistory.created_at))
        .first()
    )

    if not credit_history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No credit score found. Please run a credit check.",
        )

    return CreditScoreResponse.model_validate(credit_history)


@router.post("/check", response_model=CreditCheckResponse)
async def check_credit_score(
    credit_request: CreditCheckRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Perform a new credit check"""
    def normalize_status(value: str) -> str:
        normalized = value.strip().upper().replace(" ", "_").replace("-", "_")
        allowed = {"REVIEW_REQUIRED", "APPROVED", "DENIED", "INSUFFICIENT_DATA"}
        return normalized if normalized in allowed else "INSUFFICIENT_DATA"

    status_value = "INSUFFICIENT_DATA"
    factor_uuid = credit_request.factor_cloud_uuid
    mc_number_int = int(credit_request.mc_number)

    try:
        client = FactorsNetworkClient()
        debtor_uuid = credit_request.credit_check_uuid

        if not debtor_uuid:
            search_results = await client.search_debtors(
                mc_number=str(mc_number_int),
                dot_number=None,
                name=None,
            )
            debtor = search_results[0] if search_results else {}
            debtor_uuid = debtor.get("uuid")

        if debtor_uuid:
            credit_status_data = await client.get_credit_status(debtor_uuid)
            credit_response = credit_status_data.get("creditStatusResponse", credit_status_data)
            raw_status = credit_response.get("creditStatus") or credit_response.get("credit_status")
            if raw_status:
                status_value = normalize_status(str(raw_status))
            factor_uuid = credit_response.get("uuid") or debtor_uuid
    except Exception:
        status_value = "INSUFFICIENT_DATA"

    approved_amount = calculate_approved_amount(status_value, credit_request.load_amount)
    expiration_date = calculate_expiration_date(status_value)
    source_value = credit_request.source or "FactorsNetwork"

    credit_check_uuid = credit_request.credit_check_uuid or generate_uuid()
    
    credit_check_entry = CreditCheck(
        user_id=user_id,
        mc_number=mc_number_int,
        status=status_value,
        approved_amount=approved_amount,
        factor_cloud_uuid=factor_uuid,
        credit_check_uuid=credit_check_uuid,
        source=source_value,
        expiration_date=expiration_date,
    )
    db.add(credit_check_entry)
    db.commit()
    db.refresh(credit_check_entry)

    new_credit_history = CreditCheckHistory(
        user_id=user_id,
        mc_number=mc_number_int,
        status=status_value,
        approved_amount=approved_amount,
        credit_check_uuid=credit_check_uuid,
        source=source_value,
    )

    db.add(new_credit_history)
    db.commit()
    db.refresh(new_credit_history)

    response_data = CreditScoreResponse.model_validate(new_credit_history)

    message = f"Checked MC {mc_number_int} for ${credit_request.load_amount:,.0f}; status {status_value}."

    return CreditCheckResponse(
        score=response_data,
        change=0,
        message=message,
        factor_cloud_uuid=factor_uuid,
    )


@router.get("/checks", response_model=List[CreditCheckRecordResponse])
async def list_credit_checks(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    checks = (
        db.query(CreditCheck)
        .filter(CreditCheck.user_id == user_id)
        .order_by(desc(CreditCheck.created_at))
        .all()
    )

    return [CreditCheckRecordResponse.model_validate(check) for check in checks]


@router.get("/history", response_model=List[CreditHistory])
async def get_credit_history(
    months: int = 6,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get credit score history"""
    history_records = (
        db.query(CreditCheckHistory)
        .filter(CreditCheckHistory.user_id == user_id)
        .order_by(desc(CreditCheckHistory.created_at))
        .limit(months)
        .all()
    )

    return [
        CreditHistory(
            month=record.created_at.strftime("%b"),
            result=record.status,
        )
        for record in reversed(history_records)
    ]


