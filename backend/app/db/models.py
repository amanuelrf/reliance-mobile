"""
SQLAlchemy Database Models
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.database import Base


class TransactionType(enum.Enum):
    """Transaction type enum"""
    credit = "credit"
    debit = "debit"


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    credit_scores = relationship("CreditScore", back_populates="user")
    fuel_purchases = relationship("FuelPurchase", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    balance = relationship("Balance", back_populates="user", uselist=False)


class CreditScore(Base):
    """Credit score history model"""
    __tablename__ = "credit_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)
    rating = Column(String(50), nullable=False)  # Excellent, Good, Fair, Poor
    payment_history_score = Column(Integer, default=0)
    credit_utilization_score = Column(Integer, default=0)
    credit_age_score = Column(Integer, default=0)
    credit_mix_score = Column(Integer, default=0)
    new_credit_score = Column(Integer, default=0)
    checked_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="credit_scores")


class FuelPurchase(Base):
    """Fuel purchase record model"""
    __tablename__ = "fuel_purchases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    station = Column(String(255), nullable=False)
    gallons = Column(Float, nullable=False)
    price_per_gallon = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="fuel_purchases")


class Transaction(Base):
    """Financial transaction model"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=False)  # fuel, shopping, deposit, etc.
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="transactions")


class Balance(Base):
    """User balance model"""
    __tablename__ = "balances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    current_balance = Column(Float, default=0.0)
    available_credit = Column(Float, default=10000.0)
    pending_transactions = Column(Float, default=0.0)
    monthly_spent = Column(Float, default=0.0)
    monthly_limit = Column(Float, default=5000.0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="balance")
