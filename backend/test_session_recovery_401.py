"""
Verification script for Session Recovery, /auth/me, 401 Rejections, and JWT Validation
"""
import asyncio
import sys
from pathlib import Path
from datetime import timedelta
from jose import jwt
from fastapi import HTTPException

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.auth import create_access_token, SECRET_KEY, ALGORITHM
from app.database import AsyncSessionLocal, init_db
from app.seed import seed
from app.models import User, UserRole
from app.api.auth import login, get_me, get_current_user
from app.api.queue import my_active_queue
from app.schemas import LoginRequest

async def test_session_recovery():
    print("=" * 60)
    print("🔒 TESTING AUTH SESSION RECOVERY & 401 RESPONSES")
    print("=" * 60)

    await init_db()
    await seed()

    async with AsyncSessionLocal() as db:
        # 1. Login to get valid token
        print("\n1️⃣  Obtaining fresh access token via login...")
        login_res = await login(LoginRequest(mobile="9000000000", password="admin123"), db=db)
        token = login_res.access_token
        user_id = login_res.user_id
        print(f"   ✓ Obtained token for user ID {user_id} ({login_res.full_name})")

        # 2. Test get_current_user and /auth/me with valid token
        print("\n2️⃣  Testing /auth/me with valid token...")
        current_user = await get_current_user(authorization=f"Bearer {token}", db=db)
        assert current_user.id == user_id
        assert current_user.mobile == "9000000000"
        me_out = await get_me(current_user=current_user)
        assert me_out.id == user_id
        print(f"   ✓ /auth/me returned valid profile for {me_out.full_name}")

        # 3. Test get_current_user without token -> 401
        print("\n3️⃣  Testing get_current_user without token...")
        try:
            await get_current_user(authorization=None, db=db)
            assert False, "Should have raised 401"
        except HTTPException as e:
            assert e.status_code == 401
            print(f"   ✓ Correctly rejected with 401: {e.detail}")

        # 4. Test with expired token
        print("\n4️⃣  Testing with expired token...")
        expired_token = create_access_token({"sub": str(user_id), "role": "farmer"}, expires_delta=timedelta(seconds=-10))
        try:
            await get_current_user(authorization=f"Bearer {expired_token}", db=db)
            assert False, "Should have raised 401"
        except HTTPException as e:
            assert e.status_code == 401
            assert "expired" in e.detail.lower() or "invalid" in e.detail.lower()
            print(f"   ✓ Expired token correctly rejected with 401: {e.detail}")

        # 5. Test with token signed by different secret
        print("\n5️⃣  Testing token signed with mismatched secret key...")
        bad_token = jwt.encode({"sub": str(user_id), "role": "farmer"}, "wrong-secret-key-12345", algorithm=ALGORITHM)
        try:
            await get_current_user(authorization=f"Bearer {bad_token}", db=db)
            assert False, "Should have raised 401"
        except HTTPException as e:
            assert e.status_code == 401
            print(f"   ✓ Mismatched secret token correctly rejected with 401: {e.detail}")

        # 6. Test invalid login credentials
        print("\n6️⃣  Testing invalid login credentials...")
        try:
            await login(LoginRequest(mobile="9000000000", password="wrongpassword"), db=db)
            assert False, "Should have raised 401"
        except HTTPException as e:
            assert e.status_code == 401
            print(f"   ✓ Invalid credentials returned 401: {e.detail}")

    print("\n" + "=" * 60)
    print("🎉 ALL SESSION RECOVERY & 401 TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_session_recovery())
