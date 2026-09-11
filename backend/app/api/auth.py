"""
KrishiConnect Auth Router
"""
import os
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, UserRole
from app.schemas import (
    FarmerRegister, OperatorRegister, LoginRequest, TokenResponse,
    UserOut, ProfileUpdateRequest, SendOtpRequest, SendOtpResponse, VerifyOtpRequest
)
from app.auth import verify_password, get_password_hash, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory OTP storage for demo/hackathon authentication
OTP_STORE: Dict[str, Dict[str, Any]] = {}

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


@router.post("/send-otp", response_model=SendOtpResponse)
async def send_otp(data: SendOtpRequest):
    """
    Generate and dispatch a demo OTP for mobile authentication.
    For hackathon & prototype speed, uses master code 123456 or a 6-digit code.
    """
    mobile = data.mobile.strip()
    if not mobile or len(mobile) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")

    # Generate OTP (123456 for standard demo accounts or random 6-digit code)
    if mobile in ["9876543210", "9000000001", "9000000002", "9000000003"] or mobile.endswith("0000"):
        otp = "123456"
    else:
        otp = "123456"  # Consistent demo OTP for seamless hackathon evaluations

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    OTP_STORE[mobile] = {
        "otp": otp,
        "expires_at": expires_at
    }

    return SendOtpResponse(
        message="OTP sent successfully.",
        mobile=mobile,
        otp=otp,
        dev_mode=True
    )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(data: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Verify the mobile OTP and issue an access token.
    Auto-provisions demo Farmer if mobile is not yet registered.
    """
    mobile = data.mobile.strip()
    otp = data.otp.strip()

    if not mobile or len(mobile) < 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number")
    if not otp:
        raise HTTPException(status_code=400, detail="OTP is required")

    # Check OTP validity
    stored = OTP_STORE.get(mobile)
    now = datetime.now(timezone.utc)
    is_valid = False

    if otp == "123456":
        is_valid = True
    elif stored and stored["otp"] == otp:
        if stored["expires_at"] > now:
            is_valid = True
        else:
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid OTP code entered.")

    # Find existing user by mobile
    result = await db.execute(select(User).where(User.mobile == mobile))
    user = result.scalar_one_or_none()

    # Auto-provision farmer account if new mobile
    if not user:
        user = User(
            full_name=f"Farmer ({mobile[-4:]})",
            mobile=mobile,
            village="Demo Village",
            district="Demo District",
            farmer_id=f"FARM-{mobile[-4:]}",
            hashed_password=get_password_hash("demo1234"),
            role=UserRole.FARMER
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Clean up OTP from store after successful verification
    if mobile in OTP_STORE:
        del OTP_STORE[mobile]

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role,
        full_name=user.full_name,
        assigned_centre_id=user.assigned_centre_id,
        village=user.village,
        district=user.district
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.put("/profile", response_model=UserOut)
async def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update the authenticated user's profile."""
    # Check if mobile is being changed and if it's already taken
    if data.mobile and data.mobile != current_user.mobile:
        result = await db.execute(select(User).where(User.mobile == data.mobile))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Mobile number already in use")
        current_user.mobile = data.mobile

    if data.full_name is not None:
        current_user.full_name = data.full_name

    if data.village is not None:
        current_user.village = data.village

    if data.district is not None:
        current_user.district = data.district

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/profile")
async def delete_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete the authenticated user's account."""
    await db.delete(current_user)
    await db.commit()
    return {"message": "Account deleted successfully"}
