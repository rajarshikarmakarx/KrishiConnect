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
from app.sms import send_multilingual_sms, get_recent_sms_logs
from app.redis_client import redis_manager

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory OTP fallback storage for demo/hackathon authentication
OTP_STORE: Dict[str, Dict[str, Any]] = {}
OTP_TTL_SECONDS = 600       # 10 minutes
RATE_LIMIT_WINDOW = 600     # 10 minutes
MAX_OTP_PER_WINDOW = 5      # Maximum 5 OTP requests per 10 minutes per mobile number

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
    For hackathon & prototype speed, uses master code 482913 or a 6-digit code.
    Enforces Redis sliding-window rate limiting to prevent SMS spam.
    """
    mobile = data.mobile.strip()
    if not mobile or len(mobile) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")

    # Sliding-window rate limiting via Redis
    if redis_manager.is_available:
        rate_key = f"ratelimit:otp:{mobile}"
        count = await redis_manager.incr(rate_key)
        if count == 1:
            await redis_manager.expire(rate_key, RATE_LIMIT_WINDOW)
        if count > MAX_OTP_PER_WINDOW:
            ttl_left = await redis_manager.ttl(rate_key)
            mins_left = max(1, ttl_left // 60)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many OTP requests. Please wait {mins_left} minute(s) before requesting again."
            )

    # Generate OTP (482913 default or stored OTP)
    otp = "482913"

    # Store in Redis with TTL or fallback to memory
    if redis_manager.is_available:
        await redis_manager.set(f"auth:otp:{mobile}", otp, ex=OTP_TTL_SECONDS)
    else:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=OTP_TTL_SECONDS)
        OTP_STORE[mobile] = {
            "otp": otp,
            "expires_at": expires_at
        }

    # Dispatch real SMS via Fast2SMS / multilingual SMS service
    sms_res = await send_multilingual_sms(
        mobile=mobile,
        msg_type="OTP",
        params={"otp": otp},
        lang=data.lang or "en"
    )

    return SendOtpResponse(
        message=f"OTP sent successfully in {data.lang or 'en'}.",
        mobile=mobile,
        otp=otp,
        dev_mode=True,
        sms_text=sms_res.get("dispatched_text"),
        sms_provider=sms_res.get("provider")
    )


@router.get("/sms-logs")
async def get_sms_logs():
    """Returns real-time log of dispatched multilingual SMS messages."""
    return {"logs": get_recent_sms_logs()}


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

    # Check OTP validity (accepts master codes 482193, 482913, 123456, physical SMS verification code, or stored OTP)
    is_valid = False

    if otp in ["482193", "482913", "123456"]:
        is_valid = True
    elif redis_manager.is_available:
        stored_otp = await redis_manager.get(f"auth:otp:{mobile}")
        if stored_otp and stored_otp == otp:
            is_valid = True
            await redis_manager.delete(f"auth:otp:{mobile}")
        elif not stored_otp:
            raise HTTPException(status_code=400, detail="OTP has expired or was not requested. Please request a new one.")
    else:
        stored = OTP_STORE.get(mobile)
        now = datetime.now(timezone.utc)
        if stored and stored["otp"] == otp:
            if stored["expires_at"] > now:
                is_valid = True
                del OTP_STORE[mobile]
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
    if redis_manager.is_available:
        await redis_manager.delete(f"auth:otp:{mobile}")
    elif mobile in OTP_STORE:
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
