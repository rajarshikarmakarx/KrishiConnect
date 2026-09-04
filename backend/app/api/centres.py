"""
KrishiFlow Centres Router
"""
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.database import get_db
from app.models import ProcurementCentre, CentreCounter, TimeSlot, QueueEntry, QueueStatus
from app.schemas import CentreOut, CentreDetailOut, SlotOut, CounterOut

router = APIRouter(prefix="/centres", tags=["centres"])


async def compute_centre_stats(db: AsyncSession, centre: ProcurementCentre) -> dict:
    """Compute live stats for a centre"""
    today = date.today()

    # Waiting count
    r = await db.execute(
        select(func.count(QueueEntry.id)).where(
            QueueEntry.centre_id == centre.id,
            QueueEntry.status == QueueStatus.WAITING
        )
    )
    waiting_count = r.scalar() or 0

    # Processing count
    r = await db.execute(
        select(func.count(QueueEntry.id)).where(
            QueueEntry.centre_id == centre.id,
            QueueEntry.status == QueueStatus.PROCESSING
        )
    )
    processing_count = r.scalar() or 0

    # Completed today
    r = await db.execute(
        select(func.count(QueueEntry.id)).where(
            QueueEntry.centre_id == centre.id,
            QueueEntry.status == QueueStatus.COMPLETED,
            func.date(QueueEntry.completed_at) == today
        )
    )
    completed_count = r.scalar() or 0

    # Active counters
    r = await db.execute(
        select(func.count(CentreCounter.id)).where(
            CentreCounter.centre_id == centre.id,
            CentreCounter.is_active == True
        )
    )
    active_counters = r.scalar() or 1

    # Available slots today
    r = await db.execute(
        select(func.sum(TimeSlot.total_capacity - TimeSlot.booked_count)).where(
            TimeSlot.centre_id == centre.id,
            TimeSlot.date == today,
            TimeSlot.is_active == True
        )
    )
    available_slots = max(0, r.scalar() or 0)

    # ETA calculation
    eta = (waiting_count * centre.avg_processing_minutes) / max(active_counters, 1)

    return {
        "waiting_count": waiting_count,
        "processing_count": processing_count,
        "completed_count": completed_count,
        "active_counters": active_counters,
        "available_slots_today": int(available_slots),
        "estimated_wait_minutes": round(eta, 1)
    }


def compute_recommendation_score(stats: dict, distance_km: float) -> tuple[float, list]:
    """
    Smart recommendation algorithm:
    Calculates total door-to-door farmer time (Roundtrip travel + Queue wait time)
    and distance cost penalties to recommend the optimal procurement centre.
    """
    score = 100.0
    reasons = []

    # Roundtrip travel time at loaded farm transport speeds (~20 km/h -> 3 mins per km each way = 6 mins/km roundtrip)
    roundtrip_travel_mins = distance_km * 2 * 3.0
    total_trip_mins = roundtrip_travel_mins + stats["estimated_wait_minutes"]

    # 1. Distance & Proximity Weight
    if distance_km <= 5.0:
        score += 55.0
        reasons.append(f"Closest to you ({distance_km:.1f} km)")
    elif distance_km <= 10.0:
        score += 25.0
        reasons.append(f"Nearby centre ({distance_km:.1f} km)")
    else:
        # Distance penalty for long travel (fuel + effort)
        score -= distance_km * 4.0

    # 2. Total Door-to-Door Time Weight (Travel + Wait)
    if total_trip_mins <= 45:
        score += 30.0
        reasons.append(f"Quickest overall trip (~{int(total_trip_mins)}m total)")
    elif total_trip_mins <= 75:
        score += 10.0
    else:
        score -= (total_trip_mins - 75) * 0.8

    # 3. Active Counters & Processing Speed
    counters = stats["active_counters"]
    if counters >= 3:
        score += 15.0
        reasons.append(f"{counters} active counters operating")
    elif counters >= 2:
        score += 8.0

    # 4. Queue Wait Time
    waiting = stats["waiting_count"]
    eta = stats["estimated_wait_minutes"]
    if eta <= 15:
        score += 15.0
        reasons.append("Short wait time")
    elif eta > 45:
        score -= (eta - 45) * 0.5

    # 5. Slot Availability
    available_slots = stats["available_slots_today"]
    if available_slots == 0:
        score -= 200.0
        reasons.append("No slots available today")
    elif available_slots > 30:
        reasons.append("High slot availability")

    return round(score, 1), reasons[:3]


@router.get("", response_model=List[CentreOut])
async def list_centres(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProcurementCentre))
    centres = result.scalars().all()

    out = []
    best_score = -9999
    best_idx = 0

    for i, centre in enumerate(centres):
        stats = await compute_centre_stats(db, centre)
        score, reasons = compute_recommendation_score(stats, centre.distance_km)
        if score > best_score:
            best_score = score
            best_idx = i

        out.append(CentreOut(
            id=centre.id,
            name=centre.name,
            location=centre.location,
            district=centre.district,
            latitude=centre.latitude,
            longitude=centre.longitude,
            distance_km=centre.distance_km,
            status=centre.status,
            avg_processing_minutes=centre.avg_processing_minutes,
            recommendation_score=score,
            recommendation_reasons=reasons,
            **stats
        ))

    # Mark best as recommended
    if out:
        out[best_idx].recommendation_reasons = (out[best_idx].recommendation_reasons or [])

    out.sort(key=lambda x: x.recommendation_score or 0, reverse=True)
    return out


@router.get("/{centre_id}", response_model=CentreDetailOut)
async def get_centre(centre_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProcurementCentre).where(ProcurementCentre.id == centre_id)
    )
    centre = result.scalar_one_or_none()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    stats = await compute_centre_stats(db, centre)
    score, reasons = compute_recommendation_score(stats, centre.distance_km)

    # Get counters with current assignments
    result = await db.execute(
        select(CentreCounter).where(CentreCounter.centre_id == centre_id)
    )
    counters = result.scalars().all()

    counters_out = []
    for counter in counters:
        # Find current processing entry
        r = await db.execute(
            select(QueueEntry).where(
                QueueEntry.counter_id == counter.id,
                QueueEntry.status.in_([QueueStatus.CALLED, QueueStatus.PROCESSING])
            ).limit(1)
        )
        current_entry = r.scalar_one_or_none()

        farmer_name = None
        if current_entry:
            from app.models import User
            r2 = await db.execute(select(User).where(User.id == current_entry.farmer_id))
            farmer = r2.scalar_one_or_none()
            farmer_name = farmer.full_name if farmer else None

        counters_out.append(CounterOut(
            id=counter.id,
            counter_number=counter.counter_number,
            label=counter.label or f"Counter {counter.counter_number}",
            is_active=counter.is_active,
            operator_name=counter.operator_name,
            current_token=current_entry.token if current_entry else None,
            current_farmer_name=farmer_name,
            current_queue_entry_id=current_entry.id if current_entry else None
        ))

    return CentreDetailOut(
        id=centre.id,
        name=centre.name,
        location=centre.location,
        district=centre.district,
        latitude=centre.latitude,
        longitude=centre.longitude,
        distance_km=centre.distance_km,
        status=centre.status,
        avg_processing_minutes=centre.avg_processing_minutes,
        recommendation_score=score,
        recommendation_reasons=reasons,
        counters=counters_out,
        **stats
    )


@router.get("/{centre_id}/slots", response_model=List[SlotOut])
async def get_slots(centre_id: int, slot_date: Optional[date] = None, db: AsyncSession = Depends(get_db)):
    if slot_date is None:
        slot_date = date.today()

    result = await db.execute(
        select(TimeSlot).where(
            TimeSlot.centre_id == centre_id,
            TimeSlot.date == slot_date,
            TimeSlot.is_active == True
        ).order_by(TimeSlot.start_time)
    )
    slots = result.scalars().all()

    return [
        SlotOut(
            id=s.id,
            centre_id=s.centre_id,
            date=s.date,
            start_time=s.start_time,
            end_time=s.end_time,
            total_capacity=s.total_capacity,
            booked_count=s.booked_count,
            available=max(0, s.total_capacity - s.booked_count),
            is_full=(s.booked_count >= s.total_capacity)
        )
        for s in slots
    ]
