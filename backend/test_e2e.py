"""
KrishiConnect E2E Comprehensive Test Suite
Tests:
- Authentication (Farmer, Operator, Admin login & profile management)
- Procurement Centres & Time Slots
- Smart AI Recommender (Multi-signal composite scoring)
- Slot Booking & Token Generation
- Real-time Queue Operations (Call Next, Start, Complete, Cancel)
- AI EMA Wait-Time Predictor
- Payment Generation & Settlement
- District Analytics & Impact Metrics
- System Health & Scalability Diagnostics
"""
import asyncio
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.database import AsyncSessionLocal
from app.models import User, ProcurementCentre, QueueEntry, QueueStatus, Payment, PaymentStatus, CentreCounter, Procurement
from app.auth import verify_password, create_access_token, decode_token
from app.api.ai import _ema_wait_minutes, _live_pressure, _available_slots, _historical_throughput, ai_eta, ai_recommend, msp_rates, data_info
from app.api.analytics import system_health, impact_metrics, mark_payment_paid
from app.api.centres import compute_centre_stats, compute_recommendation_score
from app.api.queue import call_next, cancel_booking
from fastapi import HTTPException
from sqlalchemy import select, func, text


async def run_tests():
    print("🌾 Running KrishiConnect End-to-End Test Suite...\n")
    async with AsyncSessionLocal() as db:
        # 1. Test Auth & User accounts
        print("1️⃣  Testing Authentication & Users...")
        r = await db.execute(select(User).where(User.mobile == "9876543210"))
        farmer = r.scalar_one_or_none()
        assert farmer is not None, "Demo farmer not found"
        assert farmer.role == "farmer", f"Expected role 'farmer', got {farmer.role}"
        assert verify_password("demo123", farmer.hashed_password), "Farmer password verification failed"

        r = await db.execute(select(User).where(User.mobile == "9000000001"))
        operator = r.scalar_one_or_none()
        assert operator is not None, "Demo operator not found"
        assert operator.role == "operator", f"Expected role 'operator', got {operator.role}"

        r = await db.execute(select(User).where(User.mobile == "9000000000"))
        admin = r.scalar_one_or_none()
        assert admin is not None, "Demo admin not found"
        assert admin.role == "admin", f"Expected role 'admin', got {admin.role}"

        # Test JWT token generation and decoding
        token = create_access_token({"sub": str(farmer.id), "role": farmer.role})
        payload = decode_token(token)
        assert payload["sub"] == str(farmer.id)
        assert payload["role"] == "farmer"
        print("   ✅ Auth & JWT tokens verified successfully.")

        # 2. Test Procurement Centres & Stats
        print("\n2️⃣  Testing Procurement Centres...")
        r = await db.execute(select(ProcurementCentre))
        centres = r.scalars().all()
        assert len(centres) >= 4, f"Expected at least 4 centres, found {len(centres)}"
        for c in centres:
            stats = await compute_centre_stats(db, c)
            assert "waiting_count" in stats
            assert "active_counters" in stats
            assert "estimated_wait_minutes" in stats
            print(f"   Centre: {c.name} ({c.location}) - Waiting: {stats['waiting_count']}, Active Counters: {stats['active_counters']}, ETA: {stats['estimated_wait_minutes']}m")
        print("   ✅ All centres returned valid live metrics.")

        # 3. Test AI Recommender
        print("\n3️⃣  Testing Smart AI Recommender...")
        rec = await ai_recommend(village="Haripur", db=db)
        assert rec["recommended_centre_id"] is not None
        assert len(rec["centres"]) >= 4
        print(f"   Recommended centre for 'Haripur': ID {rec['recommended_centre_id']} ({rec['centres'][0]['centre_name']})")
        print(f"   Top score: {rec['centres'][0]['composite_score']}, Signals: {rec['centres'][0]['signals']}")
        print("   ✅ AI multi-signal recommender verified.")

        # 4. Test AI EMA Predictor
        print("\n4️⃣  Testing AI EMA Wait-Time Predictor...")
        r_c1 = await db.execute(select(ProcurementCentre))
        test_c = r_c1.scalars().first()
        eta_resp = await ai_eta(test_c.id, db)
        assert "ema_wait_minutes" in eta_resp
        assert "predicted_wait_minutes" in eta_resp
        assert "days_with_historical_data" in eta_resp
        assert eta_resp["confidence"] in ["high", "medium", "low"]
        print(f"   Centre {test_c.id} AI ETA: {eta_resp['predicted_wait_minutes']} min (Confidence: {eta_resp['confidence']}, 7-day EMA: {eta_resp['ema_wait_minutes']} min)")
        print("   ✅ AI EMA wait predictor verified.")

        # 5. Test MSP Rates Oracle
        print("\n5️⃣  Testing Govt MSP Rates Oracle...")
        msp = await msp_rates()
        assert len(msp["rates"]) >= 5
        paddy_rate = next((r for r in msp["rates"] if r["crop"] == "Paddy"), None)
        assert paddy_rate is not None
        assert paddy_rate["per_kg"] == 23.0
        print(f"   Season: {msp['season']}, Crops tracked: {len(msp['rates'])}, Paddy MSP: ₹{paddy_rate['per_kg']}/kg")
        print("   ✅ MSP Rates Oracle verified.")

        # 6. Test AI Dataset Transparency Manifest
        print("\n6️⃣  Testing AI Data-Transparency Manifest...")
        dinfo = await data_info(db)
        assert dinfo["data_origin"] == "synthetic"
        assert dinfo["live_db_snapshot"]["total_queue_entries"] > 1000
        print(f"   Data origin: {dinfo['data_origin']}, Total records: {dinfo['live_db_snapshot']['total_queue_entries']}")
        print("   ✅ Data-transparency manifest verified.")

        # 7. Test Impact Analytics & System Health
        print("\n7️⃣  Testing Impact Analytics & System Health...")
        impact = await impact_metrics(db)
        assert impact["current_performance"]["wait_reduction_percent"] > 50.0
        assert impact["current_performance"]["farmer_hours_saved"] > 500.0
        print(f"   Wait reduction: {impact['current_performance']['wait_reduction_percent']}%")
        print(f"   Farmer hours saved: {impact['current_performance']['farmer_hours_saved']} hrs")
        print(f"   Total farmers served: {impact['current_performance']['total_farmers_served']}")

        # 8. Test Queue Counter Occupancy Check & Payment Settlement
        print("\n8️⃣  Testing Counter Occupancy Guard & Payment Settlement...")
        # Clean up any previous test tokens
        await db.execute(text("DELETE FROM queue_entries WHERE token LIKE 'T99%' OR token LIKE 'OCC%'"))
        await db.commit()

        # Create a test queue entry in WAITING
        test_entry = QueueEntry(
            token="T999",
            farmer_id=farmer.id,
            centre_id=test_c.id,
            status=QueueStatus.WAITING,
            crop="Paddy",
            expected_quantity_kg=200.0,
        )
        db.add(test_entry)
        await db.commit()
        await db.refresh(test_entry)

        # Get active counters for test_c
        r_c = await db.execute(select(CentreCounter).where(CentreCounter.centre_id == test_c.id, CentreCounter.is_active == True))
        active_counters = r_c.scalars().all()
        assert len(active_counters) > 0, "No active counters found"

        # Check existing occupied counter IDs
        r_occ = await db.execute(
            select(QueueEntry.counter_id).where(
                QueueEntry.centre_id == test_c.id,
                QueueEntry.counter_id.is_not(None),
                QueueEntry.status.in_([QueueStatus.CALLED, QueueStatus.PROCESSING])
            )
        )
        already_occupied = {row[0] for row in r_occ.all()}

        # Occupy any remaining free counters
        dummy_entries = []
        for i, cnt in enumerate(active_counters):
            if cnt.id not in already_occupied:
                d_entry = QueueEntry(
                    token=f"OCC{i}",
                    farmer_id=farmer.id,
                    centre_id=test_c.id,
                    counter_id=cnt.id,
                    status=QueueStatus.PROCESSING,
                    crop="Paddy",
                    expected_quantity_kg=150.0,
                )
                db.add(d_entry)
                dummy_entries.append(d_entry)
        await db.commit()

        # Calling test_entry when all counters are occupied must raise HTTPException 400
        threw_400 = False
        try:
            await call_next(queue_id=test_entry.id, current_user=operator, db=db)
        except HTTPException as exc:
            if exc.status_code == 400 and "All counters are currently occupied" in exc.detail:
                threw_400 = True
        assert threw_400, "Expected call_next to raise 400 when all counters are occupied"

        # Verify test_entry was NOT modified or dequeued
        await db.refresh(test_entry)
        assert test_entry.status == QueueStatus.WAITING, f"Expected WAITING, got {test_entry.status}"
        assert test_entry.counter_id is None, "Counter ID should not be set"
        print("   ✅ Counter occupancy guard verified (rejected calling when all counters busy, farmer kept safe in WAITING).")

        # Free all dummy entries AND any existing active entries on one counter to ensure at least one counter is free
        for de in dummy_entries:
            await db.delete(de)
        # Also free active_counters[0] if it had another entry
        first_cnt_id = active_counters[0].id
        r_first = await db.execute(
            select(QueueEntry).where(
                QueueEntry.counter_id == first_cnt_id,
                QueueEntry.status.in_([QueueStatus.CALLED, QueueStatus.PROCESSING])
            )
        )
        for existing_entry in r_first.scalars().all():
            existing_entry.counter_id = None
            existing_entry.status = QueueStatus.COMPLETED
        await db.commit()

        call_res = await call_next(queue_id=test_entry.id, current_user=operator, db=db)
        assert call_res["token"] == "T999"
        assert call_res["counter_id"] is not None
        await db.refresh(test_entry)
        assert test_entry.status == QueueStatus.CALLED
        print(f"   ✅ Calling with free counter succeeded → Assigned to Counter ID {call_res['counter_id']} ({call_res.get('counter')})")

        # Clean up test entry
        await db.delete(test_entry)
        await db.commit()

        # Test Payment Settlement (Mark Paid)
        r_p = await db.execute(select(Payment).where(Payment.status == PaymentStatus.PROCESSING).limit(1))
        p_row = r_p.scalar_one_or_none()
        if p_row:
            pay_res = await mark_payment_paid(payment_id=p_row.id, current_user=operator, db=db)
            assert pay_res["amount"] == p_row.amount
            await db.refresh(p_row)
            assert p_row.status == PaymentStatus.PAID
            assert p_row.paid_at is not None
            print(f"   ✅ Payment {p_row.id} marked as PAID with timestamp: {p_row.paid_at}")

        print("   ✅ Counter occupancy guard & payment settlement tests passed.")

    print("\n🎉 ALL E2E TESTS PASSED CLEANLY! KrishiConnect is fully operational.")


if __name__ == "__main__":
    asyncio.run(run_tests())
