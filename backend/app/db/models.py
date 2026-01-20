"""
SQLAlchemy Database Models
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum, Text, SmallInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    credit_check_history = relationship("CreditCheckHistory", back_populates="user", cascade="all, delete-orphan")
    balance = relationship("Balance", back_populates="user", uselist=False)
    credit_checks = relationship("CreditCheck", back_populates="user", cascade="all, delete-orphan")
    email_login_codes = relationship("EmailLoginCode", back_populates="user", cascade="all, delete-orphan")
    companies = relationship("Company", back_populates="user", cascade="all, delete-orphan")


class CreditCheckHistory(Base):
    """Credit check history model"""
    __tablename__ = "credit_check_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mc_number = Column(Integer, nullable=False)
    status = Column(Enum("APPROVED", "REVIEW_REQUIRED", "DENIED", "INSUFFICIENT_DATA", name="status"), nullable=False)
    approved_amount = Column(Integer, nullable=False)
    credit_check_uuid = Column(String(255), nullable=False)
    source = Column(Enum("FactorsNetwork", "TransCredit", "Ansonia", name="credit_check_source"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="credit_check_history")


class CreditCheck(Base):
    """Stored broker credit check details"""
    __tablename__ = "credit_checks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mc_number = Column(Integer, nullable=False)
    status = Column(Enum("APPROVED", "REVIEW_REQUIRED", "DENIED", "INSUFFICIENT_DATA", name="status"), nullable=False)
    approved_amount = Column(Integer, nullable=False)
    factor_cloud_uuid = Column(String(255), nullable=True)
    credit_check_uuid = Column(String(255), nullable=True, unique=True)
    source = Column(Enum("FactorsNetwork", "TransCredit", "Ansonia", name="credit_check_source"), nullable=False)
    expiration_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="credit_checks")


class EmailLoginCode(Base):
    """One-time email login codes"""
    __tablename__ = "email_login_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(10), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="email_login_codes")


class Balance(Base):
    """User balance model"""
    __tablename__ = "balances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    total_account_receivable = Column(Float, default=0.0)
    reserve = Column(Float, default=10000.0)
    age_0_30 = Column(Float, default=0.0)
    age_31_60 = Column(Float, default=0.0)
    age_61_90 = Column(Float, default=5000.0)
    age_90_plus = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="balance")


class Company(Base):
    """Company record linked to a user"""
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    legal_name = Column(String(255), nullable=True)
    search_text = Column(Text, nullable=True)
    mc_number = Column(Integer, nullable=True)
    dot_number = Column(Integer, nullable=True)
    safer_name = Column(String(255), nullable=True)
    safer_dba_name = Column(String(255), nullable=True)
    safer_address = Column(String(255), nullable=True)
    safer_city = Column(String(100), nullable=True)
    safer_zip = Column(String(20), nullable=True)
    safer_state = Column(String(20), nullable=True)
    safer_active = Column(SmallInteger, nullable=True)
    safer_is_broker = Column(SmallInteger, nullable=True)
    factor_network_uuid = Column(String(255), nullable=True)
    status = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="companies")
