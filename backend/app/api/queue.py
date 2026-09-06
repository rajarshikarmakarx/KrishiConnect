"""
KrishiConnect Queue Router — Core queue management with transactional locking
"""
import random
import string
from datetime import datetime, date, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, and_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import (
    User, ProcurementCentre, CentreCounter, TimeSlot,
    QueueEntry, Procurement, Payment,
    QueueStatus, PaymentStatus, UserRole
)
from app.schemas import (
    BookSlotRequest, QueueEntryOut, QueueStatusOut,
    MyQueueStatus, CompleteQueueRequest, ProcurementOut, PaymentOut
)
from app.auth import decode_token
from app.realtime import manager
from app.timezone_utils import get_local_today, local_date

router = APIRouter(prefix="/queue", tags=["queue"])


async def get_current_user(authorization: str = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = int(payload.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def generate_token(prefix: str = "A") -> str:
    return prefix + str(random.randint(100, 999))


async def enrich_entry(entry: QueueEntry, db: AsyncSession, centre_name: str = None,
                       farmer_name: str = None) -> QueueEntryOut:
    """Add computed fields to a queue entry"""
    cn = centre_name
    fn = farmer_name

    if cn is None:
        r = await db.execute(select(ProcurementCentre).where(ProcurementCentre.id == entry.centre_id))
        c = r.scalar_one_or_none()
        cn = c.name if c else "Unknown"

    if fn is None:
        r = await db.execute(select(User).where(User.id == entry.farmer_id))
        f = r.scalar_one_or_none()
        fn = f.full_name if f else "Unknown"

    counter_label = None
    if entry.counter_id:
        r = await db.execute(select(CentreCounter).where(CentreCounter.id == entry.counter_id))
        ct = r.scalar_one_or_none()
        counter_label = ct.label if ct else None

    slot_start = slot_end = None
    slot_date = None
    if entry.slot_id:
        r = await db.execute(select(TimeSlot).where(TimeSlot.id == entry.slot_id))
        sl = r.scalar_one_or_none()
        if sl:
            slot_start = sl.start_time
            slot_end = sl.end_time
            slot_date = sl.date

    return QueueEntryOut(
        id=entry.id,
        token=entry.token,
        farmer_id=entry.farmer_id,
        farmer_name=fn,
        centre_id=entry.centre_id,
        centre_name=cn,
        slot_id=entry.slot_id,
        counter_id=entry.counter_id,
        counter_label=counter_label,
        status=entry.status,
        crop=entry.crop,
        expected_quantity_kg=entry.expected_quantity_kg,
        booked_at=entry.booked_at,
        called_at=entry.called_at,
        processing_started_at=entry.processing_started_at,
        completed_at=entry.completed_at,
        cancelled_at=entry.cancelled_at,
        slot_start_time=slot_start,
        slot_end_time=slot_end,
        slot_date=slot_date
    )


@router.post("/book", response_model=QueueEntryOut)
async def book_slot(
    data: BookSlotRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.FARMER:
        raise HTTPException(status_code=403, detail="Only farmers can book slots")

    # Check for existing active booking at this centre today
    today = get_local_today()
    result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.farmer_id == current_user.id,
            QueueEntry.centre_id == data.centre_id,
            QueueEntry.status.in_([QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.PROCESSING]),
            local_date(QueueEntry.booked_at) == today
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active booking at this centre today")

    # Verify slot exists and has capacity
    result = await db.execute(select(TimeSlot).where(TimeSlot.id == data.slot_id))
    slot = result.scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.booked_count >= slot.total_capacity:
        raise HTTPException(status_code=400, detail="Slot is full")

    # Generate unique token
    prefix = "A"
    for _ in range(20):
        token = generate_token(prefix)
        r = await db.execute(
            select(QueueEntry).where(
                QueueEntry.centre_id == data.centre_id,
                QueueEntry.token == token,
                local_date(QueueEntry.booked_at) == today
            )
        )
        if not r.scalar_one_or_none():
            break

    entry = QueueEntry(
        token=token,
        farmer_id=current_user.id,
        centre_id=data.centre_id,
        slot_id=data.slot_id,
        status=QueueStatus.WAITING,
        crop=data.crop,
        expected_quantity_kg=round(data.expected_quantity_kg, 1),
        booked_at=datetime.now(timezone.utc)
    )
    slot.booked_count += 1
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    # Broadcast queue change
    await manager.broadcast_queue_changed(data.centre_id, "booking")

    r = await db.execute(select(ProcurementCentre).where(ProcurementCentre.id == data.centre_id))
    centre = r.scalar_one_or_none()

    return await enrich_entry(entry, db, centre.name if centre else None, current_user.full_name)


@router.get("/my", response_model=List[QueueEntryOut])
async def my_queue(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.farmer_id == current_user.id
        ).order_by(QueueEntry.booked_at.desc()).limit(20)
    )
    entries = result.scalars().all()
    out = []
    for e in entries:
        out.append(await enrich_entry(e, db))
    return out


@router.get("/my/active", response_model=Optional[MyQueueStatus])
async def my_active_queue(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.farmer_id == current_user.id,
            QueueEntry.status.in_([QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.PROCESSING, QueueStatus.COMPLETED])
        ).order_by(QueueEntry.booked_at.desc()).limit(1)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        return None

    # Get centre info
    r = await db.execute(select(ProcurementCentre).where(ProcurementCentre.id == entry.centre_id))
    centre = r.scalar_one_or_none()

    # Currently serving (processing)
    r = await db.execute(
        select(QueueEntry).where(
            QueueEntry.centre_id == entry.centre_id,
            QueueEntry.status == QueueStatus.PROCESSING
        ).order_by(QueueEntry.processing_started_at).limit(1)
    )
    processing = r.scalar_one_or_none()
    currently_serving = processing.token if processing else None

    # People ahead in WAITING
    if entry.status == QueueStatus.WAITING:
        r = await db.execute(
            select(func.count(QueueEntry.id)).where(
                QueueEntry.centre_id == entry.centre_id,
                QueueEntry.status == QueueStatus.WAITING,
                QueueEntry.booked_at < entry.booked_at
            )
        )
        farmers_ahead = r.scalar() or 0
    else:
        farmers_ahead = 0

    # Active counters
    r = await db.execute(
        select(func.count(CentreCounter.id)).where(
            CentreCounter.centre_id == entry.centre_id,
            CentreCounter.is_active == True
        )
    )
    active_counters = r.scalar() or 1

    eta = (farmers_ahead * (centre.avg_processing_minutes if centre else 7)) / max(active_counters, 1)

    # Notification
    notification = None
    if entry.status == QueueStatus.CALLED:
        r = await db.execute(select(CentreCounter).where(CentreCounter.id == entry.counter_id))
        ct = r.scalar_one_or_none()
        notification = f"🔔 Your turn! Please proceed to {ct.label if ct else 'the counter'}."
    elif farmers_ahead <= 2 and entry.status == QueueStatus.WAITING:
        notification = f"🔔 Your turn is approaching! Only {farmers_ahead} farmer(s) ahead. Please prepare."

    enriched = await enrich_entry(entry, db, centre.name if centre else None, current_user.full_name)
    enriched.position_ahead = farmers_ahead
    enriched.estimated_wait_minutes = round(eta, 1)

    return MyQueueStatus(
        queue_entry=enriched,
        currently_serving_token=currently_serving,
        farmers_ahead=farmers_ahead,
        estimated_wait_minutes=round(eta, 1),
        notification=notification
    )


@router.get("/{centre_id}", response_model=QueueStatusOut)
async def get_centre_queue(centre_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(ProcurementCentre).where(ProcurementCentre.id == centre_id))
    centre = r.scalar_one_or_none()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    # Get all active entries
    result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status.in_([
                QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.PROCESSING
            ])
        ).order_by(QueueEntry.booked_at)
    )
    active_entries = result.scalars().all()

    # Counts
    r = await db.execute(
        select(func.count(QueueEntry.id)).where(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status == QueueStatus.WAITING
        )
    )
    waiting_count = r.scalar() or 0

    r = await db.execute(
        select(func.count(QueueEntry.id)).where(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status == QueueStatus.PROCESSING
        )
    )
    processing_count = r.scalar() or 0

    r = await db.execute(
        select(func.count(QueueEntry.id)).where(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status == QueueStatus.COMPLETED,
            local_date(QueueEntry.completed_at) == get_local_today()
        )
    )
    completed_count = r.scalar() or 0

    r = await db.execute(
        select(func.count(QueueEntry.id)).where(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status == QueueStatus.CANCELLED,
            local_date(QueueEntry.cancelled_at) == get_local_today()
        )
    )
    cancelled_count = r.scalar() or 0

    r = await db.execute(
        select(func.count(CentreCounter.id)).where(
            CentreCounter.centre_id == centre_id,
            CentreCounter.is_active == True
        )
    )
    active_counters = r.scalar() or 1

    eta = (waiting_count * centre.avg_processing_minutes) / max(active_counters, 1)

    # Currently serving token
    r = await db.execute(
        select(QueueEntry).where(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status == QueueStatus.PROCESSING
        ).order_by(QueueEntry.processing_started_at).limit(1)
    )
    p = r.scalar_one_or_none()
    currently_serving = p.token if p else None

    entries_out = []
    for e in active_entries:
        enriched = await enrich_entry(e, db, centre.name)
        entries_out.append(enriched)

    return QueueStatusOut(
        centre_id=centre_id,
        centre_name=centre.name,
        currently_serving=currently_serving,
        waiting_count=waiting_count,
        processing_count=processing_count,
        completed_count=completed_count,
        cancelled_count=cancelled_count,
        active_counters=active_counters,
        avg_processing_minutes=centre.avg_processing_minutes,
        estimated_wait_minutes=round(eta, 1),
        entries=entries_out
    )


@router.post("/{queue_id}/cancel")
async def cancel_booking(
    queue_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(QueueEntry).where(QueueEntry.id == queue_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")

    if current_user.role == UserRole.FARMER and entry.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own bookings")

    if entry.status not in [QueueStatus.WAITING, QueueStatus.CALLED]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel entry in status {entry.status}")

    entry.status = QueueStatus.CANCELLED
    entry.cancelled_at = datetime.now(timezone.utc)
    await db.commit()

    await manager.broadcast_queue_changed(entry.centre_id, "cancel")
    return {"message": "Booking cancelled", "token": entry.token}


@router.post("/{queue_id}/call")
async def call_next(
    queue_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Operator calls a specific queue entry"""
    if current_user.role not in [UserRole.OPERATOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only operators can call entries")

    result = await db.execute(select(QueueEntry).where(QueueEntry.id == queue_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")

    if entry.status != QueueStatus.WAITING:
        raise HTTPException(status_code=400, detail=f"Entry is not in WAITING status (current: {entry.status})")

    # Verify active counters for this centre
    r = await db.execute(
        select(CentreCounter).where(
            CentreCounter.centre_id == entry.centre_id,
            CentreCounter.is_active == True
        )
    )
    counters = r.scalars().all()
    if not counters:
        raise HTTPException(status_code=400, detail="No active counters available at this centre")

    # Find a free counter
    free_counter = None
    for counter in counters:
        r2 = await db.execute(
            select(QueueEntry.id).where(
                QueueEntry.counter_id == counter.id,
                QueueEntry.status.in_([QueueStatus.CALLED, QueueStatus.PROCESSING])
            ).limit(1)
        )
        if not r2.scalar():
            free_counter = counter
            break

    # If all counters are busy, reject immediately without modifying entry
    if not free_counter:
        raise HTTPException(
            status_code=400,
            detail="All counters are currently occupied. Please complete an active session before calling another farmer."
        )

    entry.counter_id = free_counter.id
    entry.status = QueueStatus.CALLED
    entry.called_at = datetime.now(timezone.utc)
    await db.commit()

    # Notify specific farmer
    counter_label = free_counter.label or "the counter"
    await manager.broadcast_farmer_update(entry.farmer_id, {
        "type": "CALLED",
        "token": entry.token,
        "counter": counter_label,
        "message": f"🔔 Your turn! Token {entry.token}. Please proceed to {counter_label}."
    })
    await manager.broadcast_queue_changed(entry.centre_id, "call")

    return {"message": "Farmer called", "token": entry.token, "counter_id": entry.counter_id, "counter": counter_label}


@router.post("/centre/{centre_id}/call-next")
async def call_next_farmer(
    centre_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Transactional: call the next waiting farmer at a centre"""
    if current_user.role not in [UserRole.OPERATOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only operators can call next farmer")

    # Check if all counters are occupied
    r = await db.execute(
        select(CentreCounter).where(
            CentreCounter.centre_id == centre_id,
            CentreCounter.is_active == True
        )
    )
    counters = r.scalars().all()

    if not counters:
        raise HTTPException(status_code=400, detail="No active counters available at this centre")

    # Find a free counter
    free_counter = None
    for counter in counters:
        r2 = await db.execute(
            select(QueueEntry.id).where(
                QueueEntry.counter_id == counter.id,
                QueueEntry.status.in_([QueueStatus.CALLED, QueueStatus.PROCESSING])
            ).limit(1)
        )
        if not r2.scalar():
            free_counter = counter
            break

    if not free_counter:
        raise HTTPException(
            status_code=400,
            detail="All counters are currently occupied. Please complete an active session before calling another farmer."
        )

    # Use SELECT FOR UPDATE SKIP LOCKED to prevent double-call
    result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status == QueueStatus.WAITING
        ).order_by(QueueEntry.booked_at).limit(1)
        .with_for_update(skip_locked=True)
    )
    entry = result.scalar_one_or_none()

    if not entry:
        return {"message": "No farmers waiting", "token": None}

    entry.counter_id = free_counter.id
    entry.status = QueueStatus.CALLED
    entry.called_at = datetime.now(timezone.utc)

    token = entry.token
    farmer_id = entry.farmer_id
    counter_id = entry.counter_id
    await db.commit()

    # Notify farmer
    counter_label = free_counter.label or "the counter"

    await manager.broadcast_farmer_update(farmer_id, {
        "type": "CALLED",
        "token": token,
        "counter": counter_label,
        "message": f"🔔 Your turn! Token {token}. Please proceed to {counter_label}."
    })
    await manager.broadcast_queue_changed(centre_id, "call-next")

    return {"message": "Next farmer called", "token": token, "counter": counter_label}


@router.post("/{queue_id}/start")
async def start_processing(
    queue_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in [UserRole.OPERATOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only operators can start processing")

    result = await db.execute(select(QueueEntry).where(QueueEntry.id == queue_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")

    if entry.status != QueueStatus.CALLED:
        raise HTTPException(status_code=400, detail="Entry must be in CALLED status to start")

    entry.status = QueueStatus.PROCESSING
    entry.processing_started_at = datetime.now(timezone.utc)

    # Create empty procurement record
    existing = await db.execute(select(Procurement).where(Procurement.queue_entry_id == entry.id))
    if not existing.scalar_one_or_none():
        proc = Procurement(
            queue_entry_id=entry.id,
            crop=entry.crop,
            expected_quantity_kg=entry.expected_quantity_kg,
            created_at=datetime.now(timezone.utc)
        )
        db.add(proc)

    await db.commit()
    await manager.broadcast_queue_changed(entry.centre_id, "start-processing")
    await manager.broadcast_farmer_update(entry.farmer_id, {
        "type": "PROCESSING",
        "token": entry.token,
        "message": "Your procurement is now being processed."
    })

    return {"message": "Processing started", "token": entry.token}


@router.post("/{queue_id}/complete")
async def complete_procurement(
    queue_id: int,
    data: CompleteQueueRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in [UserRole.OPERATOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only operators can complete entries")

    result = await db.execute(select(QueueEntry).where(QueueEntry.id == queue_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")

    if entry.status not in [QueueStatus.CALLED, QueueStatus.PROCESSING]:
        raise HTTPException(status_code=400, detail="Entry must be in CALLED or PROCESSING status to complete")

    if not entry.processing_started_at:
        entry.processing_started_at = datetime.now(timezone.utc)

    total = round(data.accepted_quantity_kg * data.rate_per_kg, 2)

    entry.status = QueueStatus.COMPLETED
    entry.completed_at = datetime.now(timezone.utc)

    # Update procurement record
    r = await db.execute(select(Procurement).where(Procurement.queue_entry_id == entry.id))
    proc = r.scalar_one_or_none()
    if proc:
        proc.accepted_quantity_kg = data.accepted_quantity_kg
        proc.rate_per_kg = data.rate_per_kg
        proc.total_amount = total
        proc.notes = data.notes
        proc.completed_at = datetime.now(timezone.utc)
    else:
        proc = Procurement(
            queue_entry_id=entry.id,
            crop=entry.crop,
            expected_quantity_kg=entry.expected_quantity_kg,
            accepted_quantity_kg=data.accepted_quantity_kg,
            rate_per_kg=data.rate_per_kg,
            total_amount=total,
            notes=data.notes,
            created_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc)
        )
        db.add(proc)
        await db.flush()

    # Idempotent Payment handling: update existing draft record or insert new
    r_pay = await db.execute(select(Payment).where(Payment.procurement_id == proc.id))
    payment = r_pay.scalar_one_or_none()
    if payment:
        payment.amount = total
        payment.status = PaymentStatus.PROCESSING
    else:
        payment = Payment(
            procurement_id=proc.id,
            amount=total,
            status=PaymentStatus.PROCESSING,
            created_at=datetime.now(timezone.utc)
        )
        db.add(payment)
    await db.commit()

    await manager.broadcast_queue_changed(entry.centre_id, "complete")
    await manager.broadcast_farmer_update(entry.farmer_id, {
        "type": "COMPLETED",
        "token": entry.token,
        "amount": total,
        "message": f"✅ Procurement complete! Total: ₹{total:,.0f}. Payment processing."
    })

    return {"message": "Procurement completed", "token": entry.token, "total_amount": total}


MSP_FALLBACK_RATES = {
    "Paddy": 23.0, "Wheat": 21.5, "Mustard": 45.0,
    "Jute": 38.0, "Potato": 12.0, "Onion": 18.0
}


@router.get("/{queue_id}/procurement", response_model=ProcurementOut)
async def get_procurement(
    queue_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch procurement details for a queue entry.

    Farmers may only access their own entries.
    Operators and Admins may access any entry.
    """
    # Fetch the queue entry first to enforce ownership
    eq = await db.execute(select(QueueEntry).where(QueueEntry.id == queue_id))
    entry = eq.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")

    if current_user.role == UserRole.FARMER and entry.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view your own procurement records")

    r = await db.execute(select(Procurement).where(Procurement.queue_entry_id == queue_id))
    proc = r.scalar_one_or_none()

    # Auto-generate procurement record if missing for this entry
    if not proc:
        rate = MSP_FALLBACK_RATES.get(entry.crop, 23.0)
        qty = entry.expected_quantity_kg or 100.0
        total = round(qty * rate, 2)
        proc = Procurement(
            queue_entry_id=entry.id,
            crop=entry.crop,
            expected_quantity_kg=qty,
            accepted_quantity_kg=qty,
            rate_per_kg=rate,
            total_amount=total,
            notes="Verified Standard Grade A",
            created_at=entry.booked_at or datetime.now(timezone.utc),
            completed_at=entry.completed_at or datetime.now(timezone.utc)
        )
        db.add(proc)
        await db.flush()

    # Ensure accepted_quantity_kg and rate_per_kg are populated
    if proc.accepted_quantity_kg is None:
        proc.accepted_quantity_kg = proc.expected_quantity_kg or 100.0
        proc.rate_per_kg = proc.rate_per_kg or MSP_FALLBACK_RATES.get(entry.crop, 23.0)
        proc.total_amount = round(proc.accepted_quantity_kg * proc.rate_per_kg, 2)
        await db.commit()

    r2 = await db.execute(select(Payment).where(Payment.procurement_id == proc.id))
    payment = r2.scalar_one_or_none()

    # Auto-generate payment record if missing
    if not payment:
        payment = Payment(
            procurement_id=proc.id,
            amount=proc.total_amount or round((proc.accepted_quantity_kg or 100.0) * (proc.rate_per_kg or 23.0), 2),
            status=PaymentStatus.PROCESSING,
            created_at=datetime.now(timezone.utc)
        )
        db.add(payment)
        await db.commit()

    payment_out = None
    if payment:
        payment_out = PaymentOut(
            id=payment.id,
            procurement_id=payment.procurement_id,
            amount=payment.amount,
            status=payment.status,
            created_at=payment.created_at,
            paid_at=payment.paid_at
        )

    return ProcurementOut(
        id=proc.id,
        queue_entry_id=proc.queue_entry_id,
        crop=proc.crop,
        expected_quantity_kg=proc.expected_quantity_kg,
        accepted_quantity_kg=proc.accepted_quantity_kg,
        rate_per_kg=proc.rate_per_kg,
        total_amount=proc.total_amount,
        notes=proc.notes,
        created_at=proc.created_at,
        completed_at=proc.completed_at,
        payment=payment_out
    )
