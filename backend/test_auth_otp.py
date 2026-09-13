"""
Test suite for KrishiConnect Demo OTP Authentication
"""
import asyncio
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from fastapi import HTTPException
from sqlalchemy import select, delete
from app.database import AsyncSessionLocal, init_db
from app.models import User, UserRole
from app.api.auth import send_otp, verify_otp, login
from app.schemas import SendOtpRequest, VerifyOtpRequest, LoginRequest


async def test_auth_otp_flow():
    print("=" * 60)
    print("📱 TESTING KRISHICONNECT DEMO OTP AUTHENTICATION FLOW")
    print("=" * 60)

    await init_db()

    async with AsyncSessionLocal() as db:
        # 1. Test standard password login still works
        print("\n1️⃣  Testing standard password login...")
        # Query an existing farmer from db
        f_res = await db.execute(select(User).where(User.role == UserRole.FARMER))
        farmer_obj = f_res.scalars().first()
        assert farmer_obj is not None, "No farmer in DB"
        login_res = await login(LoginRequest(mobile=farmer_obj.mobile, password="farmer123"), db=db)
        assert login_res.role == UserRole.FARMER
        assert login_res.access_token is not None
        print(f"   ✓ Standard login successful for {login_res.full_name} ({login_res.role})")

        # 2. Test send-otp endpoint
        print("\n2️⃣  Testing /auth/send-otp endpoint...")
        send_res = await send_otp(SendOtpRequest(mobile=farmer_obj.mobile))
        assert send_res.mobile == farmer_obj.mobile
        assert send_res.dev_mode is True
        print(f"   ✓ /auth/send-otp dispatched successfully for mobile {send_res.mobile}")

        # 3. Test verify-otp with master code 482913 for existing user
        print("\n3️⃣  Testing /auth/verify-otp with existing farmer...")
        verify_res = await verify_otp(VerifyOtpRequest(mobile=farmer_obj.mobile, otp="482913"), db=db)
        assert verify_res.role == UserRole.FARMER
        assert verify_res.full_name == farmer_obj.full_name
        assert verify_res.access_token is not None
        print(f"   ✓ Verified OTP successfully for {verify_res.full_name}, Token issued.")

        # 4. Test verify-otp with auto-provisioning for new mobile
        print("\n4️⃣  Testing /auth/verify-otp with new mobile (auto-provisioning)...")
        new_mobile = "9998887776"
        # Cleanup first if exists
        await db.execute(delete(User).where(User.mobile == new_mobile))
        await db.commit()

        await send_otp(SendOtpRequest(mobile=new_mobile))
        new_user_res = await verify_otp(VerifyOtpRequest(mobile=new_mobile, otp="482913"), db=db)
        assert new_user_res.user_id is not None
        assert new_user_res.role == UserRole.FARMER
        assert new_user_res.access_token is not None
        print(f"   ✓ Auto-provisioned new farmer: {new_user_res.full_name} (ID: {new_user_res.user_id})")

        # 5. Test invalid OTP rejection
        print("\n5️⃣  Testing invalid OTP rejection...")
        invalid_caught = False
        try:
            await verify_otp(VerifyOtpRequest(mobile="9876543210", otp="000000"), db=db)
        except HTTPException as e:
            if e.status_code == 400:
                invalid_caught = True
                print(f"   ✓ Invalid OTP rejected correctly: HTTP {e.status_code} - {e.detail}")
        assert invalid_caught, "Failed to reject invalid OTP code"

        # Cleanup test user
        await db.execute(delete(User).where(User.mobile == new_mobile))
        await db.commit()
        print("   ✓ Cleaned up test fixtures.")

    print("\n" + "=" * 60)
    print("🎉 ALL OTP AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_auth_otp_flow())
