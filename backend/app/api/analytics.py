"""
KrishiFlow Payments & Analytics Routers
"""
from datetime import date, datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import (
    User, ProcurementCentre, QueueEntry, Procurement, Payment,
    QueueStatus, PaymentStatus, UserRole
)
from app.schemas import PaymentOut, DistrictAnalytics, CentreAnalytics
from app.auth import decode_token
from app.realtime import manager

payments_router = APIRouter(prefix="/payments", tags=["payments"])
analytics_router = APIRouter(prefix="/analytics", tags=["analytics"])


async def get_current_user(authorization: str = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = int(payload.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@payments_router.get("/{payment_id}", response_model=PaymentOut)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    r = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = r.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Farmers may only access payments that belong to their own procurements
    if current_user.role == UserRole.FARMER:
        r2 = await db.execute(select(Procurement).where(Procurement.id == payment.procurement_id))
        proc = r2.scalar_one_or_none()
        if proc:
            r3 = await db.execute(select(QueueEntry).where(QueueEntry.id == proc.queue_entry_id))
            entry = r3.scalar_one_or_none()
            if not entry or entry.farmer_id != current_user.id:
                raise HTTPException(status_code=403, detail="You can only view your own payments")

    return PaymentOut(
        id=payment.id,
        procurement_id=payment.procurement_id,
        amount=payment.amount,
        status=payment.status,
        created_at=payment.created_at,
        paid_at=payment.paid_at
    )


@payments_router.post("/{payment_id}/pay")
async def mark_payment_paid(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in [UserRole.OPERATOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only operators can update payment")

    r = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = r.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Payment already marked as paid")

    payment.status = PaymentStatus.PAID
    payment.paid_at = datetime.utcnow()
    await db.commit()

    # Find farmer to notify
    r2 = await db.execute(select(Procurement).where(Procurement.id == payment.procurement_id))
    proc = r2.scalar_one_or_none()
    if proc:
        r3 = await db.execute(select(QueueEntry).where(QueueEntry.id == proc.queue_entry_id))
        entry = r3.scalar_one_or_none()
        if entry:
            await manager.broadcast_farmer_update(entry.farmer_id, {
                "type": "PAYMENT_PAID",
                "amount": payment.amount,
                "message": f"✅ Payment of ₹{payment.amount:,.0f} has been credited!"
            })
            await manager.broadcast_queue_changed(entry.centre_id, "payment")

    return {"message": "Payment marked as paid", "amount": payment.amount}


async def get_centre_analytics(db: AsyncSession, centre: ProcurementCentre) -> CentreAnalytics:
    today = date.today()

    r = await db.execute(
        select(func.count(QueueEntry.id)).where(
            QueueEntry.centre_id == centre.id,
            QueueEntry.status == QueueStatus.COMPLETED,
            func.date(QueueEntry.completed_at) == today
        )
    )
    today_served = r.scalar() or 0

    r = await db.execute(
        select(func.count(QueueEntry.id)).where(
            QueueEntry.centre_id == centre.id,
            QueueEntry.status == QueueStatus.WAITING
        )
    )
    waiting = r.scalar() or 0

    r = await db.execute(
        select(func.count(QueueEntry.id)).where(
            QueueEntry.centre_id == centre.id,
            QueueEntry.status == QueueStatus.PROCESSING
        )
    )
    processing = r.scalar() or 0

    # Total quantity and amount from completed procurements today
    r = await db.execute(
        select(func.sum(Procurement.accepted_quantity_kg), func.sum(Procurement.total_amount)).where(
            Procurement.queue_entry_id.in_(
                select(QueueEntry.id).where(
                    QueueEntry.centre_id == centre.id,
                    QueueEntry.status == QueueStatus.COMPLETED,
                    func.date(QueueEntry.completed_at) == today
                )
            )
        )
    )
    row = r.one()
    total_qty = row[0] or 0.0
    total_amount = row[1] or 0.0

    # Paid amount
    r = await db.execute(
        select(func.sum(Payment.amount)).where(
            Payment.status == PaymentStatus.PAID,
            Payment.procurement_id.in_(
                select(Procurement.id).where(
                    Procurement.queue_entry_id.in_(
                        select(QueueEntry.id).where(
                            QueueEntry.centre_id == centre.id,
                            func.date(QueueEntry.completed_at) == today
                        )
                    )
                )
            )
        )
    )
    paid_amount = r.scalar() or 0.0

    # Avg wait time (completed today)
    avg_wait = 24.0  # minutes default
    r = await db.execute(
        select(QueueEntry.booked_at, QueueEntry.processing_started_at).where(
            QueueEntry.centre_id == centre.id,
            QueueEntry.status == QueueStatus.COMPLETED,
            func.date(QueueEntry.completed_at) == today,
            QueueEntry.processing_started_at != None
        )
    )
    wait_rows = r.all()
    if wait_rows:
        waits = [(row[1] - row[0]).total_seconds() / 60 for row in wait_rows if row[1] and row[0]]
        avg_wait = sum(waits) / len(waits) if waits else 24.0

    return CentreAnalytics(
        centre_id=centre.id,
        centre_name=centre.name,
        today_served=today_served,
        currently_waiting=waiting,
        currently_processing=processing,
        avg_wait_minutes=round(avg_wait, 1),
        total_quantity_kg=round(total_qty, 2),
        total_amount=round(total_amount, 2),
        paid_amount=round(paid_amount, 2),
        pending_amount=round(total_amount - paid_amount, 2)
    )


@analytics_router.get("/centre/{centre_id}", response_model=CentreAnalytics)
async def centre_analytics(centre_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(ProcurementCentre).where(ProcurementCentre.id == centre_id))
    centre = r.scalar_one_or_none()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    return await get_centre_analytics(db, centre)


@analytics_router.get("/district", response_model=DistrictAnalytics)
async def district_analytics(db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(ProcurementCentre))
    centres = r.scalars().all()

    all_analytics = []
    for c in centres:
        ca = await get_centre_analytics(db, c)
        all_analytics.append(ca)

    total_served = sum(ca.today_served for ca in all_analytics)
    total_waiting = sum(ca.currently_waiting for ca in all_analytics)
    total_processing = sum(ca.currently_processing for ca in all_analytics)
    avg_wait = sum(ca.avg_wait_minutes * ca.today_served for ca in all_analytics) / max(total_served, 1)
    total_qty_tons = sum(ca.total_quantity_kg for ca in all_analytics) / 1000
    total_amount = sum(ca.total_amount for ca in all_analytics)
    total_paid = sum(ca.paid_amount for ca in all_analytics)

    # Crop breakdown
    r = await db.execute(
        select(Procurement.crop, func.count(Procurement.id), func.sum(Procurement.accepted_quantity_kg)).where(
            Procurement.completed_at != None
        ).group_by(Procurement.crop)
    )
    crop_rows = r.all()
    crop_breakdown = [
        {"crop": row[0], "count": row[1], "quantity_kg": round(row[2] or 0, 2)}
        for row in crop_rows
    ]

    # Hourly throughput (last 8 hours)
    hourly = []
    now = datetime.utcnow()
    for h in range(8):
        hour_start = now - timedelta(hours=8 - h)
        hour_end = hour_start + timedelta(hours=1)
        r = await db.execute(
            select(func.count(QueueEntry.id)).where(
                QueueEntry.status == QueueStatus.COMPLETED,
                QueueEntry.completed_at >= hour_start,
                QueueEntry.completed_at < hour_end
            )
        )
        count = r.scalar() or 0
        hourly.append({"hour": hour_start.strftime("%H:00"), "served": count})

    return DistrictAnalytics(
        total_served_today=total_served,
        currently_waiting=total_waiting,
        currently_processing=total_processing,
        avg_wait_minutes=round(avg_wait, 1),
        total_quantity_tons=round(total_qty_tons, 3),
        total_procurement_amount=round(total_amount, 2),
        total_paid_amount=round(total_paid, 2),
        centres=all_analytics,
        crop_breakdown=crop_breakdown,
        hourly_throughput=hourly
    )
