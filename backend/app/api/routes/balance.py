"""
Balance and Transaction Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.db.models import Balance, Transaction, TransactionType
from app.schemas.balance import (
    BalanceResponse,
    TransactionResponse,
    AddFundsRequest,
    TransferRequest,
)
from app.core.security import get_current_user_id

router = APIRouter()


@router.get("", response_model=BalanceResponse)
async def get_balance(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get user's current balance"""
    balance = db.query(Balance).filter(Balance.user_id == user_id).first()

    if not balance:
        # Create initial balance if not exists
        balance = Balance(
            user_id=user_id,
            current_balance=0.0,
            available_credit=10000.0,
            monthly_limit=5000.0,
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)

    return BalanceResponse.model_validate(balance)


@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    limit: int = 10,
    offset: int = 0,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get user's transaction history"""
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(desc(Transaction.date))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [TransactionResponse.model_validate(t) for t in transactions]


@router.post("/add-funds", response_model=BalanceResponse)
async def add_funds(
    request: AddFundsRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add funds to user's balance"""
    if request.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be positive",
        )

    balance = db.query(Balance).filter(Balance.user_id == user_id).first()
    if not balance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Balance not found",
        )

    # Update balance
    balance.current_balance += request.amount
    balance.available_credit += request.amount

    # Create transaction record
    transaction = Transaction(
        user_id=user_id,
        type=TransactionType.credit,
        description="Account Deposit",
        amount=request.amount,
        category="deposit",
    )
    db.add(transaction)
    db.commit()
    db.refresh(balance)

    return BalanceResponse.model_validate(balance)


@router.post("/transfer", response_model=TransactionResponse)
async def transfer_funds(
    request: TransferRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Transfer funds to another account"""
    if request.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be positive",
        )

    balance = db.query(Balance).filter(Balance.user_id == user_id).first()
    if not balance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Balance not found",
        )

    if balance.current_balance < request.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient funds",
        )

    # Update balance
    balance.current_balance -= request.amount
    balance.monthly_spent += request.amount

    # Create transaction record
    description = request.description or f"Transfer to {request.to_account}"
    transaction = Transaction(
        user_id=user_id,
        type=TransactionType.debit,
        description=description,
        amount=-request.amount,
        category="transfer",
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return TransactionResponse.model_validate(transaction)
