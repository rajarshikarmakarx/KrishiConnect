"""
KrishiConnect Produce Quality Assaying & Intake Verification Suite
Tests the unified produce quality inspection, safety guards, Agmark grading,
sun-drying deferrals, lot rejection, and atomic procurement-payment linkage.
"""
import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi import HTTPException
from sqlalchemy import select, delete
from app.database import AsyncSessionLocal, init_db
from app.models import (
    User, UserRole, ProcurementCentre, TimeSlot, CentreCounter,
    QueueEntry, QueueStatus, AssayRecord, Procurement, Payment, PaymentStatus
)
from app.api.queue import (
    book_slot, call_next, complete_procurement,
    record_quality_action, get_procurement, compute_quality_grade
)
from app.api.ai import quality_standards
from app.api.analytics import mark_payment_paid
from app.schemas import BookSlotRequest, CompleteQueueRequest, QualityActionRequest


async def run_assayer_verification():
    print("=" * 70)
    print("🔬 KRISHICONNECT PRODUCE QUALITY ASSAYING & INTAKE VERIFICATION")
    print("=" * 70)

    await init_db()

    async with AsyncSessionLocal() as db:
        # 1. Verify Grading Logic Function
        print("\n1️⃣  Testing Agmark Quality Grading Logic (`compute_quality_grade`)...")

        # Test Grade A (FAQ Standard)
        g_a, dec_a, r_a, rej_a = compute_quality_grade("Paddy", moisture=13.5, chaff=0.5, damaged=0.0)
        assert g_a == "Grade A"
        assert dec_a == "APPROVED"
        assert r_a == 1.0
        assert rej_a is None
        print("   ✓ Grade A FAQ Standard verified (Moisture 13.5% -> 100% MSP Rate)")

        # Test Grade B (Permissible Standard)
        g_b, dec_b, r_b, rej_b = compute_quality_grade("Paddy", moisture=15.5, chaff=1.0, damaged=1.0)
        assert g_b == "Grade B"
        assert dec_b == "APPROVED"
        assert r_b == 0.98
        print("   ✓ Grade B Standard verified (Moisture 15.5% -> Permissible Standard)")

        # Test Grade C / Sun-Drying Deferral
        g_c, dec_c, r_c, rej_c = compute_quality_grade("Paddy", moisture=18.5, chaff=1.0, damaged=1.0)
        assert g_c == "Grade C"
        assert dec_c == "DEFERRED_SUN_DRYING"
        assert rej_c is not None
        print("   ✓ Grade C Sun-Drying Deferral verified (Moisture 18.5% -> Mandi Sun-Drying Grace)")

        # Test Rejection (Moisture >= 20.0%)
        g_rej, dec_rej, r_rej, rej_msg = compute_quality_grade("Paddy", moisture=22.5, chaff=1.0, damaged=1.0)
        assert g_rej == "Rejected"
        assert dec_rej == "REJECTED"
        assert "aflatoxin" in rej_msg.lower() or "fungal" in rej_msg.lower()
        print("   ✓ Spoilage Rejection verified (Moisture 22.5% -> Aflatoxin rot hazard)")

        # Test Statutory Quality Standards API Schema & Payload
        standards_data = await quality_standards()
        assert "grading_tiers" in standards_data
        assert len(standards_data["grading_tiers"]) == 4
        assert "crop_standards" in standards_data
        assert any(c["crop"] == "Paddy" for c in standards_data["crop_standards"])
        assert any(c["crop"] == "Wheat" for c in standards_data["crop_standards"])
        assert "statutory_rules" in standards_data
        print(f"   ✓ Quality Standards API verified: {len(standards_data['grading_tiers'])} tiers, {len(standards_data['crop_standards'])} crops, {len(standards_data['statutory_rules'])} safety rules")

        # 2. Fetch or create test operator & farmer
        print("\n2️⃣  Setting up Test Operator & Farmer...")
        farmer_res = await db.execute(select(User).where(User.role == UserRole.FARMER))
        farmer = farmer_res.scalars().first()
        assert farmer is not None, "No farmer found in DB"

        operator_res = await db.execute(select(User).where(User.role == UserRole.OPERATOR))
        operator = operator_res.scalars().first()
        assert operator is not None, "No operator found in DB"
        print(f"   ✓ Farmer: {farmer.full_name} (ID: {farmer.id})")
        print(f"   ✓ Operator: {operator.full_name} (ID: {operator.id})")

        centre_res = await db.execute(select(ProcurementCentre))
        centre = centre_res.scalars().first()
        assert centre is not None, "No ProcurementCentre found in DB"

        slot_res = await db.execute(select(TimeSlot).where(TimeSlot.centre_id == centre.id))
        slot = slot_res.scalars().first()
        assert slot is not None, f"TimeSlot not found for centre {centre.id}"

        # 3. Test Moisture Safety Guard on complete_procurement
        print("\n3️⃣  Testing Moisture Safety Guard (Moisture >= 20.0% MUST be blocked)...")
        # Create test queue entry 1
        q1 = QueueEntry(
            token="Q-TST1",
            farmer_id=farmer.id,
            centre_id=centre.id,
            slot_id=slot.id,
            status=QueueStatus.WAITING,
            crop="Paddy",
            expected_quantity_kg=500.0,
            booked_at=datetime.now(timezone.utc)
        )
        db.add(q1)
        await db.commit()
        await db.refresh(q1)

        # Call the farmer
        await call_next(queue_id=q1.id, db=db, current_user=operator)

        # Attempt to complete with hazardous 22.5% moisture
        safety_blocked = False
        try:
            await complete_procurement(
                queue_id=q1.id,
                data=CompleteQueueRequest(
                    accepted_quantity_kg=500.0,
                    rate_per_kg=23.0,
                    moisture_percentage=22.5,
                    chaff_percentage=1.0,
                    damaged_grains_percentage=0.5
                ),
                db=db,
                current_user=operator
            )
        except HTTPException as e:
            if e.status_code == 400 and ("Safety Hazard" in e.detail or "20.0%" in e.detail):
                safety_blocked = True
                print(f"   ✓ Safety Guard Triggered as expected: HTTP {e.status_code} - {e.detail}")

        assert safety_blocked, "Safety guard failed to block hazardous moisture intake!"

        # 4. Test Sun-Drying Deferral Quality Action
        print("\n4️⃣  Testing Sun-Drying Deferral Quality Action (`record_quality_action`)...")
        defer_res = await record_quality_action(
            queue_id=q1.id,
            data=QualityActionRequest(
                action="SUN_DRYING_DEFERRAL",
                moisture_percentage=18.5,
                chaff_percentage=1.0,
                damaged_grains_percentage=0.5,
                reason="High moisture lot",
                notes="Granted 2.5 hours mandi courtyard drying grace"
            ),
            db=db,
            current_user=operator
        )
        assert defer_res["status"] == QueueStatus.DEFERRED_SUN_DRYING.value
        assert defer_res["decision"] == "DEFERRED_SUN_DRYING"

        # Verify AssayRecord in DB
        assay_db = (await db.execute(select(AssayRecord).where(AssayRecord.queue_entry_id == q1.id))).scalar_one_or_none()
        assert assay_db is not None
        assert assay_db.decision == "DEFERRED_SUN_DRYING"
        assert assay_db.sun_drying_grace_hours == 2.5
        assert assay_db.moisture_percentage == 18.5
        print("   ✓ Sun-Drying Deferral recorded with 2.5h grace period and AssayRecord linkage")

        # 5. Test Lot Rejection Quality Action
        print("\n5️⃣  Testing Formal Lot Rejection Quality Action...")
        q2 = QueueEntry(
            token="Q-TST2",
            farmer_id=farmer.id,
            centre_id=centre.id,
            slot_id=slot.id,
            status=QueueStatus.CALLED,
            crop="Paddy",
            expected_quantity_kg=400.0,
            booked_at=datetime.now(timezone.utc)
        )
        db.add(q2)
        await db.commit()
        await db.refresh(q2)

        reject_res = await record_quality_action(
            queue_id=q2.id,
            data=QualityActionRequest(
                action="REJECT",
                moisture_percentage=23.5,
                chaff_percentage=4.0,
                damaged_grains_percentage=6.0,
                reason="Fungal spoilage and excessive chaff",
                notes="Lot rejected per Mandi Safety Code"
            ),
            db=db,
            current_user=operator
        )
        assert reject_res["status"] == QueueStatus.REJECTED.value
        assert reject_res["decision"] == "REJECTED"

        # Verify AssayRecord in DB
        assay2_db = (await db.execute(select(AssayRecord).where(AssayRecord.queue_entry_id == q2.id))).scalar_one_or_none()
        assert assay2_db is not None
        assert assay2_db.decision == "REJECTED"
        assert "Fungal spoilage" in assay2_db.rejection_reason
        print("   ✓ Lot rejection recorded with formal reason, defect metrics, and AssayRecord linkage")

        # 6. Test Approved Grade A Quality Intake Flow (Atomic AssayRecord + Procurement + Payment)
        print("\n6️⃣  Testing Approved Grade A Intake Flow & Payment Disbursal...")
        q3 = QueueEntry(
            token="Q-TST3",
            farmer_id=farmer.id,
            centre_id=centre.id,
            slot_id=slot.id,
            status=QueueStatus.CALLED,
            crop="Paddy",
            expected_quantity_kg=750.0,
            booked_at=datetime.now(timezone.utc)
        )
        db.add(q3)
        await db.commit()
        await db.refresh(q3)

        complete_res = await complete_procurement(
            queue_id=q3.id,
            data=CompleteQueueRequest(
                accepted_quantity_kg=750.0,
                rate_per_kg=23.0,
                moisture_percentage=13.2,
                chaff_percentage=0.6,
                damaged_grains_percentage=0.0,
                notes="Grade A FAQ Paddy Intake Verified"
            ),
            db=db,
            current_user=operator
        )
        assert complete_res["grade"] == "Grade A"
        assert complete_res["moisture_percentage"] == 13.2
        assert complete_res["total_amount"] == 17250.0
        print("   ✓ Intake completed: AssayRecord created atomically with Grade A status")
        print("   ✓ Intake completed: AssayRecord created atomically with Grade A status")

        # Fetch procurement record and verify full linkage
        proc_res = await get_procurement(queue_id=q3.id, db=db, current_user=operator)
        assert proc_res.crop == "Paddy"
        assert proc_res.accepted_quantity_kg == 750.0
        assert proc_res.rate_per_kg == 23.0
        assert proc_res.total_amount == 17250.0
        assert proc_res.grade == "Grade A"
        assert proc_res.assay_record is not None
        assert proc_res.assay_record.grade == "Grade A"
        assert proc_res.payment is not None
        assert proc_res.payment.status == PaymentStatus.PROCESSING
        assert proc_res.payment.amount == 17250.0
        print(f"   ✓ Procurement Invoice verified: Amount=₹{proc_res.total_amount:,.2f}, Grade={proc_res.grade}")

        # Disburse DBT Payment
        paid_res = await mark_payment_paid(payment_id=proc_res.payment.id, db=db, current_user=operator)
        assert paid_res["message"] == "Payment marked as paid"
        assert paid_res["amount"] == 17250.0

        # Verify Payment record in DB
        pay_db = (await db.execute(select(Payment).where(Payment.id == proc_res.payment.id))).scalar_one_or_none()
        assert pay_db is not None
        assert pay_db.status == PaymentStatus.PAID
        assert pay_db.paid_at is not None
        print("   ✓ DBT Disbursal confirmed: Payment status transitioned to PAID")

        # 6b. Test Approved Grade B Quality Intake Flow (Automatic 2% Value Cut Price Reduction)
        print("\n6️⃣b Testing Approved Grade B Intake Flow & Automatic Price Reduction...")
        q4 = QueueEntry(
            token="Q-TST4",
            farmer_id=farmer.id,
            centre_id=centre.id,
            slot_id=slot.id,
            status=QueueStatus.CALLED,
            crop="Paddy",
            expected_quantity_kg=500.0,
            booked_at=datetime.now(timezone.utc)
        )
        db.add(q4)
        await db.commit()
        await db.refresh(q4)

        complete_res_b = await complete_procurement(
            queue_id=q4.id,
            data=CompleteQueueRequest(
                accepted_quantity_kg=500.0,
                rate_per_kg=23.0,  # Base rate passed, should be automatically discounted
                moisture_percentage=15.5,
                chaff_percentage=1.8,
                damaged_grains_percentage=1.0,
                notes="Grade B Permissible Standard Paddy Intake Verified"
            ),
            db=db,
            current_user=operator
        )
        assert complete_res_b["grade"] == "Grade B"
        assert complete_res_b["moisture_percentage"] == 15.5
        assert complete_res_b["effective_rate_per_kg"] == 22.54
        assert complete_res_b["discount_percentage"] == 2.0
        assert complete_res_b["total_amount"] == 11270.0  # 500.0 * 22.54 = 11270.0
        print("   ✓ Grade B automatic price cut verified: Base ₹23.00 -> Effective ₹22.54/kg (-2%)")

        proc_res_b = await get_procurement(queue_id=q4.id, db=db, current_user=operator)
        assert proc_res_b.grade == "Grade B"
        assert proc_res_b.rate_per_kg == 22.54
        assert proc_res_b.total_amount == 11270.0
        assert proc_res_b.discount_percentage == 2.0
        assert proc_res_b.payment.amount == 11270.0
        print(f"   ✓ Grade B Procurement Invoice verified: Amount=₹{proc_res_b.total_amount:,.2f}, Rate=₹{proc_res_b.rate_per_kg}/kg")

        # 7. Cleanup test records
        print("\n7️⃣  Cleaning up test fixtures...")
        for q_entry_id in [q1.id, q2.id, q3.id, q4.id]:
            p_res = await db.execute(select(Procurement).where(Procurement.queue_entry_id == q_entry_id))
            proc_obj = p_res.scalar_one_or_none()
            if proc_obj:
                await db.execute(delete(Payment).where(Payment.procurement_id == proc_obj.id))
                await db.execute(delete(Procurement).where(Procurement.id == proc_obj.id))
            await db.execute(delete(AssayRecord).where(AssayRecord.queue_entry_id == q_entry_id))
            await db.execute(delete(QueueEntry).where(QueueEntry.id == q_entry_id))
        await db.commit()
        print("   ✓ Test database fixtures deleted cleanly")

    print("\n" + "=" * 70)
    print("🎉 ALL ASSAYER QUALITY & INTAKE TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_assayer_verification())
