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
    QueueEntry, Procurement, Payment, AssayRecord,
    QueueStatus, PaymentStatus, UserRole
)
from app.schemas import (
    BookSlotRequest, QueueEntryOut, QueueStatusOut,
    MyQueueStatus, CompleteQueueRequest, QualityActionRequest,
    ProcurementOut, PaymentOut, AssayRecordOut
)
from app.auth import decode_token
from app.realtime import manager
from app.timezone_utils import get_local_today, local_date
from app.pricing import (
    STATUTORY_BASE_MSP, GRADE_PRICE_CONFIG, calculate_gradewise_price, get_base_msp
)

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


def compute_quality_grade(crop: str, moisture: float, chaff: float = 0.0, damaged: float = 0.0) -> tuple:
    """
    Computes (grade, decision, suggested_multiplier, reason) based on Govt Mandi & FAQ Quality Norms:
    - Grade A (FAQ Standard): Moisture <= 14.0%, Chaff <= 1.5%, Damaged <= 2.0% -> 100% MSP rate (multiplier 1.0)
    - Grade B (Permissible Standard): Moisture <= 17.0%, Chaff <= 3.0%, Damaged <= 4.0% -> Automatic 2% value cut (multiplier 0.98)
    - Grade C (Marginal / Sun-Drying Needed): Moisture 17.1% - 19.9% -> Mandi sun-drying deferral / 10% value cut (multiplier 0.90)
    - Rejected: Moisture >= 20.0% -> Fungal aflatoxin & spoilage hazard (multiplier 0.0)
    """
    if moisture >= 20.0:
        return (
            "Rejected",
            "REJECTED",
            GRADE_PRICE_CONFIG["Rejected"]["multiplier"],
            f"Excessive moisture ({moisture:.1f}% >= 20.0%) presents high risk of fungal aflatoxin and silo rot. Produce must be rejected or sun-dried."
        )
    elif moisture > 17.0:
        return (
            "Grade C",
            "DEFERRED_SUN_DRYING",
            GRADE_PRICE_CONFIG["Grade C"]["multiplier"],
            f"Moisture ({moisture:.1f}%) exceeds FAQ gate standard (17.0%). Mandi yard sun-drying grace recommended."
        )
    elif moisture > 14.0 or chaff > 1.5 or damaged > 2.0:
        return (
            "Grade B",
            "APPROVED",
            GRADE_PRICE_CONFIG["Grade B"]["multiplier"],
            None
        )
    else:
        return (
            "Grade A",
            "APPROVED",
            GRADE_PRICE_CONFIG["Grade A"]["multiplier"],
            None
        )


async def enrich_entry(entry: QueueEntry, db: AsyncSession, centre_name: str = None,
                       farmer_name: str = None) -> QueueEntryOut:
    """Add computed fields to a queue entry"""
    cn = centre_name
    fn = farmer_name
    c_loc = None
    c_dist = None
    c_lat = None
    c_lon = None

    r = await db.execute(select(ProcurementCentre).where(ProcurementCentre.id == entry.centre_id))
    c = r.scalar_one_or_none()
    if c:
        if cn is None:
            cn = c.name
        c_loc = c.location
        c_dist = c.district
        c_lat = c.latitude
        c_lon = c.longitude
    elif cn is None:
        cn = "Unknown"

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

    # Load AssayRecord if present
    r_assay = await db.execute(select(AssayRecord).where(AssayRecord.queue_entry_id == entry.id))
    assay = r_assay.scalar_one_or_none()
    assay_out = None
    if assay:
        assay_out = AssayRecordOut.model_validate(assay) if hasattr(AssayRecordOut, 'model_validate') else AssayRecordOut.from_orm(assay)

    return QueueEntryOut(
        id=entry.id,
        token=entry.token,
        farmer_id=entry.farmer_id,
        farmer_name=fn,
        centre_id=entry.centre_id,
        centre_name=cn,
        centre_location=c_loc,
        centre_district=c_dist,
        centre_latitude=c_lat,
        centre_longitude=c_lon,
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
        slot_date=slot_date,
        assay_record=assay_out
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
    if current_user.role not in [UserRole.OPERATOR, UserRole.ASSAYER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only operators or assayers can complete entries")

    result = await db.execute(select(QueueEntry).where(QueueEntry.id == queue_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")

    if entry.status not in [QueueStatus.CALLED, QueueStatus.PROCESSING]:
        raise HTTPException(status_code=400, detail="Entry must be in CALLED or PROCESSING status to complete")

    moisture = data.moisture_percentage if data.moisture_percentage is not None else 13.5
    chaff = data.chaff_percentage if data.chaff_percentage is not None else 0.5
    damaged = data.damaged_grains_percentage if data.damaged_grains_percentage is not None else 0.0

    # Moisture safety guard
    if moisture >= 20.0:
        raise HTTPException(
            status_code=400,
            detail=f"Safety Hazard: Moisture level ({moisture:.1f}%) exceeds safety threshold (20.0%). Cannot procure spoiled produce with fungal rot risk. Use 'Reject Lot' or grant sun-drying grace."
        )

    grade, decision, _, reason = compute_quality_grade(entry.crop, moisture, chaff, damaged)

    if not entry.processing_started_at:
        entry.processing_started_at = datetime.now(timezone.utc)

    # Automatic Gradewise Pricing Calculation
    price_info = calculate_gradewise_price(entry.crop, grade, base_rate=data.rate_per_kg)
    effective_rate = price_info["effective_rate_per_kg"]
    base_rate = price_info["base_rate_per_kg"]
    discount_pct = price_info["discount_percentage"]
    total = round(data.accepted_quantity_kg * effective_rate, 2)

    entry.status = QueueStatus.COMPLETED
    entry.completed_at = datetime.now(timezone.utc)

    # Upsert AssayRecord
    r_assay = await db.execute(select(AssayRecord).where(AssayRecord.queue_entry_id == entry.id))
    assay = r_assay.scalar_one_or_none()
    if not assay:
        assay = AssayRecord(
            queue_entry_id=entry.id,
            assayer_id=current_user.id,
            crop=entry.crop,
            moisture_percentage=moisture,
            chaff_percentage=chaff,
            damaged_grains_percentage=damaged,
            grade=grade,
            decision="APPROVED",
            suggested_rate_per_kg=effective_rate,
            notes=data.notes,
            created_at=datetime.now(timezone.utc)
        )
        db.add(assay)
        await db.flush()
    else:
        assay.assayer_id = current_user.id
        assay.moisture_percentage = moisture
        assay.chaff_percentage = chaff
        assay.damaged_grains_percentage = damaged
        assay.grade = grade
        assay.decision = "APPROVED"
        assay.suggested_rate_per_kg = effective_rate
        assay.notes = data.notes

    # Update procurement record
    r = await db.execute(select(Procurement).where(Procurement.queue_entry_id == entry.id))
    proc = r.scalar_one_or_none()
    if proc:
        proc.assay_record_id = assay.id
        proc.grade = grade
        proc.accepted_quantity_kg = data.accepted_quantity_kg
        proc.rate_per_kg = effective_rate
        proc.total_amount = total
        proc.notes = data.notes
        proc.completed_at = datetime.now(timezone.utc)
    else:
        proc = Procurement(
            queue_entry_id=entry.id,
            assay_record_id=assay.id,
            crop=entry.crop,
            grade=grade,
            expected_quantity_kg=entry.expected_quantity_kg,
            accepted_quantity_kg=data.accepted_quantity_kg,
            rate_per_kg=effective_rate,
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

    price_desc = f"Quality: {grade} ({moisture}% moisture). Rate: ₹{effective_rate:.2f}/kg"
    if discount_pct > 0:
        price_desc += f" (includes statutory {discount_pct:.0f}% {grade} value cut)"

    await manager.broadcast_queue_changed(entry.centre_id, "complete")
    await manager.broadcast_farmer_update(entry.farmer_id, {
        "type": "COMPLETED",
        "token": entry.token,
        "amount": total,
        "grade": grade,
        "base_rate": base_rate,
        "effective_rate": effective_rate,
        "discount_percentage": discount_pct,
        "moisture": moisture,
        "message": f"✅ Procurement complete! {price_desc}. Total: ₹{total:,.0f}. Payment processing."
    })

    return {
        "message": "Procurement completed",
        "token": entry.token,
        "total_amount": total,
        "grade": grade,
        "base_rate_per_kg": base_rate,
        "effective_rate_per_kg": effective_rate,
        "rate_per_kg": effective_rate,
        "discount_percentage": discount_pct,
        "moisture_percentage": moisture
    }


@router.post("/{queue_id}/quality-action")
async def record_quality_action(
    queue_id: int,
    data: QualityActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Records explicit produce quality decisions:
    - REJECT: Produce rejected (excessive moisture >= 20% or severe contamination).
    - SUN_DRYING_DEFERRAL: Grants 2.5 hr sun drying grace period for marginal moisture (17.1% - 19.9%).
    """
    if current_user.role not in [UserRole.OPERATOR, UserRole.ASSAYER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only operators or assayers can record quality decisions")

    result = await db.execute(select(QueueEntry).where(QueueEntry.id == queue_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")

    if entry.status not in [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.PROCESSING]:
        raise HTTPException(status_code=400, detail="Cannot update quality for completed or cancelled entries")

    now = datetime.now(timezone.utc)
    action = data.action.upper()

    if action == "REJECT":
        entry.status = QueueStatus.REJECTED
        decision = "REJECTED"
        grade = "Rejected"
        reason = data.reason or f"Moisture level ({data.moisture_percentage:.1f}%) exceeds safety threshold (20.0%). Fungal rot risk."
        grace = None
        farmer_msg = f"❌ Produce Rejected: {reason}"
    elif action in ["SUN_DRYING_DEFERRAL", "DEFER"]:
        entry.status = QueueStatus.DEFERRED_SUN_DRYING
        decision = "DEFERRED_SUN_DRYING"
        grade = "Grade C"
        reason = data.reason or f"Moisture level ({data.moisture_percentage:.1f}%) is marginal (17-20%). Granted 2.5 hr sun-drying grace."
        grace = 2.5
        farmer_msg = f"☀️ Sun-Drying Grace Granted (2.5 hrs). Please dry crop in mandi yard before re-testing."
    else:
        raise HTTPException(status_code=400, detail=f"Invalid action '{data.action}'. Must be 'REJECT' or 'SUN_DRYING_DEFERRAL'.")

    # Upsert AssayRecord
    r_assay = await db.execute(select(AssayRecord).where(AssayRecord.queue_entry_id == entry.id))
    assay = r_assay.scalar_one_or_none()
    if not assay:
        assay = AssayRecord(
            queue_entry_id=entry.id,
            assayer_id=current_user.id,
            crop=entry.crop,
            moisture_percentage=data.moisture_percentage,
            chaff_percentage=data.chaff_percentage or 0.0,
            damaged_grains_percentage=data.damaged_grains_percentage or 0.0,
            grade=grade,
            decision=decision,
            suggested_rate_per_kg=0.0,
            rejection_reason=reason if decision == "REJECTED" else None,
            sun_drying_grace_hours=grace,
            notes=data.notes,
            created_at=now
        )
        db.add(assay)
    else:
        assay.assayer_id = current_user.id
        assay.moisture_percentage = data.moisture_percentage
        assay.chaff_percentage = data.chaff_percentage or 0.0
        assay.damaged_grains_percentage = data.damaged_grains_percentage or 0.0
        assay.grade = grade
        assay.decision = decision
        assay.rejection_reason = reason if decision == "REJECTED" else None
        assay.sun_drying_grace_hours = grace
        assay.notes = data.notes

    await db.commit()

    await manager.broadcast_queue_changed(entry.centre_id, "quality-action")
    await manager.broadcast_farmer_update(entry.farmer_id, {
        "type": "QUALITY_DECISION",
        "token": entry.token,
        "status": entry.status.value if hasattr(entry.status, 'value') else str(entry.status),
        "decision": decision,
        "moisture": data.moisture_percentage,
        "message": farmer_msg
    })

    return {
        "message": f"Quality action '{decision}' recorded successfully",
        "token": entry.token,
        "status": entry.status.value if hasattr(entry.status, 'value') else str(entry.status),
        "decision": decision,
        "grade": grade,
        "moisture_percentage": data.moisture_percentage
    }


MSP_FALLBACK_RATES = STATUTORY_BASE_MSP


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

    # Load AssayRecord if attached to procurement or queue entry
    assay_out = None
    r_assay = await db.execute(select(AssayRecord).where(AssayRecord.queue_entry_id == entry.id))
    assay = r_assay.scalar_one_or_none()

    # Auto-generate procurement record if missing for this entry
    if not proc:
        grade_val = assay.grade if assay else "Grade A"
        price_calc = calculate_gradewise_price(entry.crop, grade_val)
        rate = price_calc["effective_rate_per_kg"]
        qty = entry.expected_quantity_kg or 100.0
        total = round(qty * rate, 2)
        proc = Procurement(
            queue_entry_id=entry.id,
            assay_record_id=assay.id if assay else None,
            crop=entry.crop,
            grade=grade_val,
            expected_quantity_kg=qty,
            accepted_quantity_kg=qty,
            rate_per_kg=rate,
            total_amount=total,
            notes=f"Verified Standard {grade_val}",
            created_at=entry.booked_at or datetime.now(timezone.utc),
            completed_at=entry.completed_at or datetime.now(timezone.utc)
        )
        db.add(proc)
        await db.flush()

    # Ensure accepted_quantity_kg and rate_per_kg are populated
    if proc.accepted_quantity_kg is None or proc.rate_per_kg is None:
        grade_val = proc.grade or (assay.grade if assay else "Grade A")
        price_calc = calculate_gradewise_price(entry.crop, grade_val)
        proc.accepted_quantity_kg = proc.accepted_quantity_kg or proc.expected_quantity_kg or 100.0
        proc.rate_per_kg = proc.rate_per_kg or price_calc["effective_rate_per_kg"]
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

    if proc.assay_record_id and not assay:
        r_assay_proc = await db.execute(select(AssayRecord).where(AssayRecord.id == proc.assay_record_id))
        assay = r_assay_proc.scalar_one_or_none()

    if assay:
        assay_out = AssayRecordOut.model_validate(assay) if hasattr(AssayRecordOut, 'model_validate') else AssayRecordOut.from_orm(assay)

    grade_calc = calculate_gradewise_price(proc.crop, proc.grade or "Grade A")

    return ProcurementOut(
        id=proc.id,
        queue_entry_id=proc.queue_entry_id,
        crop=proc.crop,
        grade=proc.grade,
        expected_quantity_kg=proc.expected_quantity_kg,
        accepted_quantity_kg=proc.accepted_quantity_kg,
        rate_per_kg=proc.rate_per_kg,
        base_rate_per_kg=grade_calc["base_rate_per_kg"],
        discount_percentage=grade_calc["discount_percentage"],
        total_amount=proc.total_amount,
        notes=proc.notes,
        created_at=proc.created_at,
        completed_at=proc.completed_at,
        payment=payment_out,
        assay_record=assay_out
    )
