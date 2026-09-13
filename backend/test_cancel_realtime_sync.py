"""
Test Live Real-time Queue Sync when Admin/Operator Cancels a Booking
Verifies:
1. Multiple farmers book slots in the queue.
2. Farmer 2's position_ahead / farmers_ahead is accurately calculated.
3. Operator cancels Farmer 1.
4. WebSocket broadcasts QUEUE_CHANGED on /ws/centre/{centre_id} and /ws/admin.
5. Direct push notification CANCELLED sent to Farmer 1 on /ws/farmer/{farmer1_id}.
6. Farmer 2's farmers_ahead automatically drops from 1 to 0.
7. Mandi Centre waiting_count automatically decreases by 1.
8. Farmer 1's active queue becomes null.
"""
import asyncio
import json
import uvicorn
import websockets
from datetime import datetime, timezone
from sqlalchemy import select
from app.main import app
from app.database import AsyncSessionLocal, engine
from app.models import Base, User, ProcurementCentre, QueueEntry, QueueStatus, UserRole, TimeSlot
from app.api.queue import cancel_booking, my_active_queue, book_slot
from app.api.centres import list_centres
from app.schemas import BookSlotRequest
from app.auth import create_access_token


async def test_cancellation_realtime_flow():
    print("🌾 Starting Cancellation & Real-Time Queue Decrement Verification...")

    # Start Uvicorn test server in background
    config = uvicorn.Config(app=app, host="127.0.0.1", port=8766, log_level="warning")
    server = uvicorn.Server(config)
    server_task = asyncio.create_task(server.serve())

    # Wait for server startup
    for _ in range(50):
        if server.started:
            break
        await asyncio.sleep(0.1)

    ws_base = "ws://127.0.0.1:8766/ws"

    try:
        async with AsyncSessionLocal() as db:
            # Get operator (user id 2 or admin id 1) and test centre
            r = await db.execute(select(User).where(User.role == UserRole.OPERATOR))
            operator = r.scalars().first()
            if not operator:
                r = await db.execute(select(User).where(User.role == UserRole.ADMIN))
                operator = r.scalars().first()

            # Get 2 farmers
            r = await db.execute(select(User).where(User.role == UserRole.FARMER).limit(2))
            farmers = r.scalars().all()
            assert len(farmers) >= 2, "Need at least 2 farmers in DB"
            farmer1, farmer2 = farmers[0], farmers[1]

            r = await db.execute(select(ProcurementCentre).limit(1))
            centre = r.scalars().first()

            # Clean any old WAITING entries for these test farmers to start fresh
            r = await db.execute(
                select(QueueEntry).where(
                    QueueEntry.farmer_id.in_([farmer1.id, farmer2.id]),
                    QueueEntry.status.in_([QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.PROCESSING])
                )
            )
            for old_e in r.scalars().all():
                old_e.status = QueueStatus.CANCELLED
            await db.commit()

            # Get active time slot
            r = await db.execute(select(TimeSlot).where(TimeSlot.centre_id == centre.id, TimeSlot.is_active == True).limit(1))
            slot = r.scalars().first()
            slot_id = slot.id if slot else None

            # 1. Connect WebSocket clients for Centre, Admin, and Farmer 1
            f1_token = create_access_token({"sub": str(farmer1.id), "role": farmer1.role, "mobile": farmer1.mobile})

            async with websockets.connect(f"{ws_base}/centre/{centre.id}") as ws_centre, \
                       websockets.connect(f"{ws_base}/admin") as ws_admin, \
                       websockets.connect(f"{ws_base}/farmer/{farmer1.id}?token={f1_token}") as ws_farmer1:

                print("1️⃣  Connected WebSocket listeners (Centre, District Admin, Farmer 1)...")

                # 2. Book Slot for Farmer 1 (Token 1)
                b1_req = BookSlotRequest(centre_id=centre.id, slot_id=slot_id, crop="Paddy", expected_quantity_kg=500.0)
                entry1 = await book_slot(b1_req, farmer1, db)
                print(f"   ✓ Farmer 1 booked: Token {entry1.token} (ID: {entry1.id})")

                # Drain booking broadcast
                msg_c = await asyncio.wait_for(ws_centre.recv(), timeout=2.0)
                msg_a = await asyncio.wait_for(ws_admin.recv(), timeout=2.0)

                # Small delay to ensure booked_at timestamp ordering
                await asyncio.sleep(0.05)

                # 3. Book Slot for Farmer 2 (Token 2)
                b2_req = BookSlotRequest(centre_id=centre.id, slot_id=slot_id, crop="Paddy", expected_quantity_kg=400.0)
                entry2 = await book_slot(b2_req, farmer2, db)
                print(f"   ✓ Farmer 2 booked: Token {entry2.token} (ID: {entry2.id})")

                # Drain booking broadcast
                msg_c = await asyncio.wait_for(ws_centre.recv(), timeout=2.0)
                msg_a = await asyncio.wait_for(ws_admin.recv(), timeout=2.0)

                # 4. Check initial Farmer 2 status: farmers_ahead MUST be >= 1
                f2_status_before = await my_active_queue(farmer2, db)
                assert f2_status_before is not None
                print(f"   ✓ Farmer 2 view before cancellation: {f2_status_before.farmers_ahead} farmer(s) ahead")
                assert f2_status_before.farmers_ahead >= 1, f"Expected at least 1 farmer ahead, got {f2_status_before.farmers_ahead}"

                # Check centre waiting count before cancellation
                centres_before = await list_centres(current_user=None, db=db)
                c_before = next(c for c in centres_before if c.id == centre.id)
                waiting_before = c_before.waiting_count
                print(f"   ✓ Centre {centre.name} waiting count before cancellation: {waiting_before}")

                # 5. Admin / Operator Cancels Farmer 1
                print("\n2️⃣  Operator/Admin cancels Farmer 1's queue booking...")
                cancel_res = await cancel_booking(entry1.id, operator, db)
                print(f"   ✓ Cancel API response: {cancel_res}")

                # 6. Verify WebSocket broadcasts received
                raw_centre_event = await asyncio.wait_for(ws_centre.recv(), timeout=3.0)
                event_c = json.loads(raw_centre_event)
                assert event_c["type"] == "QUEUE_CHANGED"
                assert event_c["centre_id"] == centre.id
                assert event_c["triggered_by"] == "cancel"
                print("   ✅ Centre WebSocket received QUEUE_CHANGED (triggered_by=cancel)")

                raw_admin_event = await asyncio.wait_for(ws_admin.recv(), timeout=3.0)
                event_a = json.loads(raw_admin_event)
                assert event_a["type"] == "QUEUE_CHANGED"
                print("   ✅ Admin WebSocket received district QUEUE_CHANGED")

                raw_f1_event = await asyncio.wait_for(ws_farmer1.recv(), timeout=3.0)
                event_f1 = json.loads(raw_f1_event)
                assert event_f1["type"] == "CANCELLED"
                assert event_f1["queue_id"] == entry1.id
                print("   ✅ Farmer 1 received direct push notification CANCELLED")

                # 7. Check Farmer 2's status AFTER cancellation: farmers_ahead MUST drop by 1!
                f2_status_after = await my_active_queue(farmer2, db)
                assert f2_status_after is not None
                print(f"\n3️⃣  Checking Farmer 2 queue status after real-time update...")
                print(f"   ✓ Farmer 2 view after cancellation: {f2_status_after.farmers_ahead} farmer(s) ahead (dropped from {f2_status_before.farmers_ahead})")
                assert f2_status_after.farmers_ahead == f2_status_before.farmers_ahead - 1

                # 8. Check Mandi Centre waiting count AFTER cancellation: must drop by 1!
                centres_after = await list_centres(current_user=None, db=db)
                c_after = next(c for c in centres_after if c.id == centre.id)
                waiting_after = c_after.waiting_count
                print(f"   ✓ Mandi Centre waiting count after cancellation: {waiting_after} (dropped from {waiting_before})")
                assert waiting_after == waiting_before - 1

                # 9. Check Farmer 1's active queue is now None
                f1_status_after = await my_active_queue(farmer1, db)
                assert f1_status_after is None
                print("   ✓ Farmer 1 active queue is now None (cleared)")

                # Clean up Farmer 2 entry
                await cancel_booking(entry2.id, operator, db)
                print("   ✓ Cleaned up test entries cleanly.")

        print("\n🎉 ALL REAL-TIME CANCELLATION & QUEUE DECREMENT TESTS PASSED WITH 100% SUCCESS!")

    finally:
        server.should_exit = True
        await server_task


if __name__ == "__main__":
    asyncio.run(test_cancellation_realtime_flow())
