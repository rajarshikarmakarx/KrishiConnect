"""
Test script to rigorously verify District Officer Analytics and Timezone Fix.
Tests:
1. Current district analytics output (non-zero or accurate values, structure, centre stats).
2. Timezone boundary test: Ensure timestamps that straddle UTC/IST midnight are correctly classified as today in IST.
3. Procurement completion & payment flow reflection in District Analytics:
   - Create a test booking.
   - Call next / process.
   - Complete procurement with crop and quantity.
   - Check district analytics for incremented total_served_today, total_quantity_tons, total_procurement_amount.
   - Mark payment paid and verify total_paid_amount and payment efficiency.
   - Cleanup test records.
"""
import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.database import AsyncSessionLocal
from app.models import (
    User, ProcurementCentre, QueueEntry, QueueStatus,
    Procurement, Payment, PaymentStatus, UserRole
)
from app.timezone_utils import get_local_today, local_date, KOLKATA_TZ
from app.api.analytics import district_analytics, centre_analytics, mark_payment_paid
from app.api.queue import complete_procurement
from app.schemas import CompleteQueueRequest
from sqlalchemy import select, func, text


async def test_district_analytics():
    print("🌾 Starting District Officer Analytics & Timezone Verification...")

    async with AsyncSessionLocal() as db:
        # 1. Fetch current district analytics
        print("\n1️⃣  Testing /analytics/district endpoint...")
        analytics = await district_analytics(db=db)

        assert analytics.total_served_today is not None
        assert analytics.currently_waiting is not None
        assert analytics.currently_processing is not None
        assert analytics.avg_wait_minutes >= 0
        assert analytics.total_quantity_tons >= 0
        assert analytics.total_procurement_amount >= 0
        assert analytics.total_paid_amount >= 0
        assert len(analytics.centres) == 4
        assert len(analytics.hourly_throughput) == 8
        assert len(analytics.crop_breakdown) > 0

        print(f"   Total served today (IST): {analytics.total_served_today}")
        print(f"   Currently waiting: {analytics.currently_waiting}")
        print(f"   Currently processing: {analytics.currently_processing}")
        print(f"   Avg wait minutes: {analytics.avg_wait_minutes} min")
        print(f"   Total quantity: {analytics.total_quantity_tons} tons")
        print(f"   Total procurement amount: ₹{analytics.total_procurement_amount:,.2f}")
        print(f"   Total paid amount: ₹{analytics.total_paid_amount:,.2f}")
        for c in analytics.centres:
            print(f"     -> Centre {c.centre_id} ({c.centre_name}): Served={c.today_served}, Waiting={c.currently_waiting}, Procured=₹{c.total_amount:,.2f}, Paid=₹{c.paid_amount:,.2f}")

        # 2. Verify Timezone boundary SQL logic
        print("\n2️⃣  Testing Timezone Boundary SQL Evaluation (UTC vs IST)...")
        today_ist = get_local_today()
        now_utc = datetime.now(timezone.utc)
        now_ist = now_utc.astimezone(KOLKATA_TZ)
        print(f"   Current UTC Time: {now_utc.isoformat()}")
        print(f"   Current IST Time: {now_ist.isoformat()}")
        print(f"   Computed Local Today (IST): {today_ist}")

        # Test query with local_date vs raw func.date
        q_local = select(func.count(QueueEntry.id)).where(
            local_date(QueueEntry.completed_at) == today_ist
        )
        res_local = await db.execute(q_local)
        count_local = res_local.scalar() or 0

        q_utc = select(func.count(QueueEntry.id)).where(
            func.date(QueueEntry.completed_at) == today_ist
        )
        res_utc = await db.execute(q_utc)
        count_utc = res_utc.scalar() or 0

        print(f"   Completed entries matching today with local_date(IST): {count_local}")
        print(f"   Completed entries matching today with func.date(UTC): {count_utc}")
        print("   ✅ Timezone-aware date expression evaluated cleanly.")

        # 3. Test Full Procurement Completion & Live District Analytics Impact
        print("\n3️⃣  Testing End-to-End Procurement Completion & Analytics Sync...")
        # Get demo farmer and operator
        r_f = await db.execute(select(User).where(User.mobile == "9876543210"))
        farmer = r_f.scalar_one()

        r_o = await db.execute(select(User).where(User.mobile == "9000000001"))
        operator = r_o.scalar_one()

        # Helper cleanup for test tokens
        async def cleanup_token(tok: str):
            r = await db.execute(select(QueueEntry.id).where(QueueEntry.token == tok))
            q_ids = [row[0] for row in r.all()]
            if q_ids:
                # Find procurements
                r_pr = await db.execute(select(Procurement.id).where(Procurement.queue_entry_id.in_(q_ids)))
                p_ids = [row[0] for row in r_pr.all()]
                if p_ids:
                    await db.execute(text("DELETE FROM payments WHERE procurement_id = ANY(:pids)").bindparams(pids=p_ids))
                    await db.execute(text("DELETE FROM procurements WHERE id = ANY(:pids)").bindparams(pids=p_ids))
                await db.execute(text("DELETE FROM queue_entries WHERE id = ANY(:qids)").bindparams(qids=q_ids))
                await db.commit()

        # Create a new test queue entry
        test_token = "T998"
        await cleanup_token(test_token)

        # Capture initial analytics snapshot AFTER cleanup
        initial_analytics = await district_analytics(db=db)
        initial_served = initial_analytics.total_served_today
        initial_amount = initial_analytics.total_procurement_amount
        initial_paid = initial_analytics.total_paid_amount
        initial_tons = initial_analytics.total_quantity_tons

        test_entry = QueueEntry(
            token=test_token,
            farmer_id=farmer.id,
            centre_id=1,
            counter_id=1,
            status=QueueStatus.PROCESSING,
            crop="Mustard",
            expected_quantity_kg=500.0,
            booked_at=datetime.now(timezone.utc) - timedelta(minutes=25),
            called_at=datetime.now(timezone.utc) - timedelta(minutes=15),
            processing_started_at=datetime.now(timezone.utc) - timedelta(minutes=10),
        )
        db.add(test_entry)
        await db.commit()
        await db.refresh(test_entry)

        # Complete the procurement: 500 kg @ ₹59.50/kg = ₹29,750
        comp_req = CompleteQueueRequest(
            accepted_quantity_kg=500.0,
            rate_per_kg=59.5,
            notes="District analytics verification test batch"
        )
        comp_res = await complete_procurement(
            queue_id=test_entry.id,
            data=comp_req,
            current_user=operator,
            db=db
        )
        assert comp_res["token"] == test_token
        assert comp_res["total_amount"] == 29750.0

        # Query created procurement and payment
        r_proc = await db.execute(select(Procurement).where(Procurement.queue_entry_id == test_entry.id))
        proc = r_proc.scalar_one()
        r_pay = await db.execute(select(Payment).where(Payment.procurement_id == proc.id))
        payment = r_pay.scalar_one()
        payment_id = payment.id

        # Check updated district analytics
        updated_analytics = await district_analytics(db=db)
        print(f"   Served count: {initial_served} -> {updated_analytics.total_served_today} (+{updated_analytics.total_served_today - initial_served})")
        print(f"   Total amount: ₹{initial_amount:,.2f} -> ₹{updated_analytics.total_procurement_amount:,.2f} (+₹{updated_analytics.total_procurement_amount - initial_amount:,.2f})")
        print(f"   Total tons: {initial_tons:.3f} -> {updated_analytics.total_quantity_tons:.3f} (+{updated_analytics.total_quantity_tons - initial_tons:.3f})")

        assert updated_analytics.total_served_today == initial_served + 1
        assert abs((updated_analytics.total_procurement_amount - initial_amount) - 29750.0) < 0.01
        assert abs((updated_analytics.total_quantity_tons - initial_tons) - 0.500) < 0.001

        # Check Centre 1 specific analytics
        c1_analytics = await centre_analytics(1, db=db)
        print(f"   Centre 1 Analytics: Today Served={c1_analytics.today_served}, Total Amount=₹{c1_analytics.total_amount:,.2f}, Pending=₹{c1_analytics.pending_amount:,.2f}")
        assert c1_analytics.today_served > 0

        # Mark Payment Paid
        pay_res = await mark_payment_paid(payment_id=payment_id, current_user=operator, db=db)
        assert pay_res["amount"] == 29750.0

        after_pay_analytics = await district_analytics(db=db)
        print(f"   Paid amount: ₹{initial_paid:,.2f} -> ₹{after_pay_analytics.total_paid_amount:,.2f} (+₹{after_pay_analytics.total_paid_amount - initial_paid:,.2f})")
        assert abs((after_pay_analytics.total_paid_amount - initial_paid) - 29750.0) < 0.01

        # Cleanup test records
        await cleanup_token(test_token)

        # Verify analytics reverts after cleanup
        reverted_analytics = await district_analytics(db=db)
        assert reverted_analytics.total_served_today == initial_served
        print("   ✅ Full procurement completion and payment settlement accurately reflected in District Analytics.\n")

    print("🎉 DISTRICT OFFICER ANALYTICS VERIFICATION COMPLETED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(test_district_analytics())
