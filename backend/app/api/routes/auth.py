"""
Authentication Routes
"""

from datetime import datetime, timedelta
from sqlalchemy import desc
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Balance, EmailLoginCode
from app.schemas.user import (
    UserCreate,
    UserResponse,
    Token,
    EmailCodeRequest,
    EmailCodeVerifyRequest,
    EmailCodeResponse,
)
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user_id,
    generate_email_login_code,
)
from app.core.config import settings

router = APIRouter()


def _ensure_balance_for_user(db: Session, user_id: int) -> Balance:
    """Create a placeholder balance record when missing."""
    balance = db.query(Balance).filter(Balance.user_id == user_id).first()
    if balance:
        return balance

    balance = Balance(
        user_id=user_id,
        # Fields use defaults from model: total_account_receivable=0.0, reserve=10000.0, etc.
    )
    db.add(balance)
    db.commit()
    db.refresh(balance)
    return balance


def _get_or_create_user_by_email(db: Session, email: str) -> User:
    """Ensure a user exists for the provided email."""
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user

    name_part = email.split("@")[0]
    user = User(email=email, name=name_part or email, hashed_password="")
    db.add(user)
    db.commit()
    db.refresh(user)
    _ensure_balance_for_user(db, user.id)
    return user


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        is_verified=True,
        last_login=datetime.utcnow(),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    _ensure_balance_for_user(db, db_user.id)
    return db_user


@router.post("/send-code", response_model=EmailCodeResponse)
async def send_email_code(payload: EmailCodeRequest, db: Session = Depends(get_db)):
    """Send a one-time login code to the provided email"""
    db.query(EmailLoginCode).filter(
        EmailLoginCode.email == payload.email,
        EmailLoginCode.is_used == False,
    ).update({"is_used": True}, synchronize_session=False)

    expiration = datetime.utcnow() + timedelta(minutes=settings.EMAIL_LOGIN_CODE_EXPIRE_MINUTES)
    code = generate_email_login_code()
    user = db.query(User).filter(User.email == payload.email).first()

    login_code = EmailLoginCode(
        email=payload.email,
        code=code,
        expires_at=expiration,
        user_id=user.id if user else None,
    )
    db.add(login_code)
    db.commit()

    # TODO: replace with real email delivery
    print(f"Generated login code for {payload.email}: {code}")

    return EmailCodeResponse(message="Login code sent. Enter the code to access your account.")


@router.post("/verify-code", response_model=Token)
async def verify_email_code(payload: EmailCodeVerifyRequest, db: Session = Depends(get_db)):
    """Verify a previously sent login code and return a token"""
    now = datetime.utcnow()
    login_code = (
        db.query(EmailLoginCode)
        .filter(
            EmailLoginCode.email == payload.email,
            EmailLoginCode.code == payload.code,
            EmailLoginCode.is_used == False,
            EmailLoginCode.expires_at >= now,
        )
        .order_by(desc(EmailLoginCode.created_at))
        .first()
    )

    if not login_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired login code.",
        )

    login_code.is_used = True
    user = _get_or_create_user_by_email(db, payload.email)
    user.is_verified = True
    user.last_login = now
    _ensure_balance_for_user(db, user.id)
    db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login and get access token"""
    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )

    user.is_verified = True
    user.last_login = datetime.utcnow()
    _ensure_balance_for_user(db, user.id)
    db.commit()

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/profile", response_model=UserResponse)
async def get_profile(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get current user profile"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
