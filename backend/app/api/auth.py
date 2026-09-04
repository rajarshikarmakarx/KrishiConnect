"""
KrishiFlow Auth Router
"""
import os
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, UserRole
from app.schemas import FarmerRegister, OperatorRegister, LoginRequest, TokenResponse, UserOut
from app.auth import verify_password, get_password_hash, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])

# Secret required to call the operator-registration endpoint.
OPERATOR_REG_SECRET = os.getenv("OPERATOR_REG_SECRET")


async def get_current_user(authorization: str = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    """Shared auth dependency — also used by /auth/me."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    result = await db.execute(select(User).where(User.id == int(user_id_str)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/register", response_model=TokenResponse)
async def register_farmer(data: FarmerRegister, db: AsyncSession = Depends(get_db)):
    # Check mobile uniqueness
    result = await db.execute(select(User).where(User.mobile == data.mobile))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    user = User(
        full_name=data.full_name,
        mobile=data.mobile,
        village=data.village,
        district=data.district,
        farmer_id=data.farmer_id,
        hashed_password=get_password_hash(data.password),
        role=UserRole.FARMER
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token, user_id=user.id, role=user.role,
        full_name=user.full_name, village=user.village, district=user.district
    )


@router.post("/register-operator", response_model=TokenResponse)
async def register_operator(
    data: OperatorRegister,
    x_admin_secret: str = Header(None, alias="X-Admin-Secret"),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new Operator or Admin account.

    Requires the X-Admin-Secret header to match the OPERATOR_REG_SECRET env var.
    This prevents public self-registration with elevated roles.
    """
    if not OPERATOR_REG_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Operator registration is disabled: OPERATOR_REG_SECRET is not configured on the server."
        )
    if x_admin_secret != OPERATOR_REG_SECRET:
        raise HTTPException(status_code=403, detail="Invalid or missing admin secret")

    result = await db.execute(select(User).where(User.mobile == data.mobile))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    user = User(
        full_name=data.full_name,
        mobile=data.mobile,
        hashed_password=get_password_hash(data.password),
        role=UserRole.OPERATOR,
        assigned_centre_id=data.assigned_centre_id
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token, user_id=user.id, role=user.role,
        full_name=user.full_name, assigned_centre_id=user.assigned_centre_id
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.mobile == data.mobile))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid mobile number or password")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token, user_id=user.id, role=user.role,
        full_name=user.full_name,
        assigned_centre_id=user.assigned_centre_id,
        village=user.village, district=user.district
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user
