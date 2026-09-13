"""
KrishiConnect Farmer Priority Bump Verification Suite
Tests:
1. Role-based access control: Gate Assayer / Operator CAN bump. District Admin CANNOT bump (403 Forbidden).
2. Immutability audit lock: Once bumped, cannot re-bump or overwrite bump reason (400 Bad Request).
3. Queue re-ordering: Bumped farmers are served before older unbumped bookings.
"""
import asyncio
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from fastapi import HTTPException
from sqlalchemy import select, delete
from app.database import AsyncSessionLocal, init_db
from app.models import (
    User, UserRole, ProcurementCentre, TimeSlot, CentreCounter,
    QueueEntry, QueueStatus
)
from app.api.queue import bump_queue_entry, call_next_farmer, get_centre_queue
from app.schemas import BumpQueueRequest


async def run_bump_verification():
    print("=" * 70)
    print("⚡ KRISHICONNECT FARMER PRIORITY BUMP & AUDIT IMMUTABILITY TEST")
    print("=" * 70)

    await init_db()

    async with AsyncSessionLocal() as db:
        # 1. Setup Test Users
        print("\n1️⃣  Setting up Test Personas (Assayer, District Admin, Farmers)...")

        # Operator / Assayer
        r_op = await db.execute(select(User).where(User.mobile == "9999900001"))
        op_user = r_op.scalar_one_or_none()
        if not op_user:
            op_user = User(
                full_name="Test Gate Assayer",
                mobile="9999900001",
                hashed_password="pw",
                role=UserRole.OPERATOR
            )
            db.add(op_user)

        # District Admin
        r_admin = await db.execute(select(User).where(User.mobile == "9999900002"))
        admin_user = r_admin.scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                full_name="Test District Admin",
                mobile="9999900002",
                hashed_password="pw",
                role=UserRole.ADMIN
            )
            db.add(admin_user)

        # Farmer 1 & Farmer 2
        r_f1 = await db.execute(select(User).where(User.mobile == "9999900003"))
        farmer1 = r_f1.scalar_one_or_none()
        if not farmer1:
            farmer1 = User(
                full_name="Farmer Ramesh",
                mobile="9999900003",
                hashed_password="pw",
                role=UserRole.FARMER
            )
            db.add(farmer1)

        r_f2 = await db.execute(select(User).where(User.mobile == "9999900004"))
        farmer2 = r_f2.scalar_one_or_none()
        if not farmer2:
            farmer2 = User(
                full_name="Farmer Sunita",
                mobile="9999900004",
                hashed_password="pw",
                role=UserRole.FARMER
            )
            db.add(farmer2)

        # Centre
        r_c = await db.execute(select(ProcurementCentre).limit(1))
        centre = r_c.scalar_one_or_none()
        assert centre is not None, "No procurement centre found in database"

        await db.commit()
        await db.refresh(op_user)
        await db.refresh(admin_user)
        await db.refresh(farmer1)
        await db.refresh(farmer2)

        # Clean up any leftover test tokens from previous runs
        await db.execute(delete(QueueEntry).where(QueueEntry.token.in_(["T101", "T102"])))
        await db.commit()

        entry1 = None
        entry2 = None
        try:
            # 2. Create Two Queue Entries (Entry 1 booked 15 mins ago, Entry 2 booked 5 mins ago)
            print("\n2️⃣  Creating Sequential Waiting Queue Entries...")
            now = datetime.now(timezone.utc)

            entry1 = QueueEntry(
                token="T101",
                farmer_id=farmer1.id,
                centre_id=centre.id,
                status=QueueStatus.WAITING,
                crop="Paddy",
                expected_quantity_kg=1200.0,
                booked_at=now - timedelta(minutes=15)
            )
            entry2 = QueueEntry(
                token="T102",
                farmer_id=farmer2.id,
                centre_id=centre.id,
                status=QueueStatus.WAITING,
                crop="Paddy",
                expected_quantity_kg=800.0,
                booked_at=now - timedelta(minutes=5)
            )
            db.add_all([entry1, entry2])
            await db.commit()
            await db.refresh(entry1)
            await db.refresh(entry2)

            print(f"   ✓ Entry 1 (Token {entry1.token}) booked at {entry1.booked_at}")
            print(f"   ✓ Entry 2 (Token {entry2.token}) booked at {entry2.booked_at}")

            # 3. Verify District Admin CANNOT bump (HTTP 403)
            print("\n3️⃣  Testing Role-Based Security: District Admin Bump Rejection...")
            admin_rejected = False
            try:
                await bump_queue_entry(
                    queue_id=entry2.id,
                    body=BumpQueueRequest(reason="Admin priority directive"),
                    current_user=admin_user,
                    db=db
                )
            except HTTPException as e:
                if e.status_code == 403:
                    admin_rejected = True
                    print(f"   ✓ District Admin blocked with 403: '{e.detail}'")

            assert admin_rejected, "Security Failure: District Admin was incorrectly allowed to bump!"

            # 4. Authorize Bump by Gate Assayer / Operator
            print("\n4️⃣  Testing Assayer Priority Bump Authorization...")
            bump_reason = "Perishable produce at spoilage risk (rain threat outside mandi)"
            res = await bump_queue_entry(
                queue_id=entry2.id,
                body=BumpQueueRequest(reason=bump_reason, priority_level=1),
                current_user=op_user,
                db=db
            )
            assert res.is_bumped is True
            assert res.bump_reason == bump_reason
            assert res.bumped_by_name == op_user.full_name
            print(f"   ✓ Token {res.token} successfully bumped by Assayer '{res.bumped_by_name}'")
            print(f"   ✓ Reason permanently stored: '{res.bump_reason}'")

            # 5. Test Immutability Audit Lock (Cannot edit or re-bump)
            print("\n5️⃣  Testing Immutability Audit Lock (Attempting to re-bump/edit)...")
            immutability_locked = False
            try:
                await bump_queue_entry(
                    queue_id=entry2.id,
                    body=BumpQueueRequest(reason="Trying to modify previously sealed reason"),
                    current_user=op_user,
                    db=db
                )
            except HTTPException as e:
                if e.status_code == 400 and "Audit Lock" in e.detail:
                    immutability_locked = True
                    print(f"   ✓ Immutability Audit Lock verified: '{e.detail}'")

            assert immutability_locked, "Immutability Failure: Bump reason could be re-submitted or modified!"

            # 6. Verify Queue Ordering: Bumped Entry (T102) is Ordered Ahead of T101 and all unbumped entries
            print("\n6️⃣  Verifying Real-time Queue Ordering...")
            queue_out = await get_centre_queue(centre_id=centre.id, db=db)
            waiting_tokens = [e.token for e in queue_out.entries if e.status == "WAITING"]
            print(f"   Waiting Queue Order: {waiting_tokens}")

            assert waiting_tokens[0] == "T102", f"Ordering Failure: Expected T102 at position 0, got {waiting_tokens}"
            idx_t102 = waiting_tokens.index("T102")
            idx_t101 = waiting_tokens.index("T101")
            assert idx_t102 < idx_t101, f"Ordering Failure: T102 (idx {idx_t102}) should be ahead of T101 (idx {idx_t101})"
            print(f"   ✓ Token T102 (Bumped) jumped to Position #1 ahead of all unbumped farmers including T101 (index {idx_t101})!")
        finally:
            # 7. Cleanup
            print("\n7️⃣  Cleaning up test entries...")
            await db.execute(delete(QueueEntry).where(QueueEntry.token.in_(["T101", "T102"])))
            await db.commit()
            print("   ✓ Test entries cleaned up.")

    print("\n" + "=" * 70)
    print("🎉 ALL FARMER BUMP & AUDIT IMMUTABILITY TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_bump_verification())
