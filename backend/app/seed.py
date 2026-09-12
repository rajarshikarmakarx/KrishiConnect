"""
KrishiConnect Seed Data
Populates realistic demo data for hackathon demonstration.
Optimized for async PostgreSQL (Supabase) with batch inserts and 30-day historical data.
"""
import asyncio
import random
from datetime import datetime, date, timedelta, timezone
from app.database import AsyncSessionLocal, init_db
from app.models import (
    User, ProcurementCentre, CentreCounter, TimeSlot,
    QueueEntry, Procurement, Payment, Notification, AssayRecord,
    UserRole, QueueStatus, PaymentStatus, CentreStatus
)
from app.auth import get_password_hash
from app.pricing import STATUTORY_BASE_MSP, calculate_gradewise_price

CROPS = ["Paddy", "Wheat", "Mustard", "Jute", "Potato", "Onion"]
CROP_RATES = STATUTORY_BASE_MSP

VILLAGES = [
    "Amtala", "Baruipur", "Rajpur", "Sonarpur", "Joka", "Thakurpukur",
    "Budge Budge", "Maheshtala", "Behala", "Tollygunge", "Garia", "Narendrapur",
    "Bishnupur", "Bankra", "Santragachi", "Liluah", "Belur", "Shibpur"
]

FARMER_NAMES = [
    "Ramesh Kumar Das", "Suresh Mondal", "Bikash Giri", "Tapan Halder",
    "Ananta Manna", "Gopal Bera", "Nimai Das", "Kartik Patra",
    "Dilip Ghosh", "Sanjoy Roy", "Pradip Pal", "Binay Biswas",
    "Subal Jana", "Hiru Das", "Kali Sardar", "Madan Haldar",
    "Nanda Dolui", "Arun Naskar", "Barun Maity", "Dulal Baidya",
    "Swapan Saha", "Uttam Dutta", "Parimal Pramanik", "Asit Roy",
    "Bijan Mondal", "Chandan Das", "Debashis Giri", "Enamul Haque",
    "Falguni Pal", "Goutam Bose", "Haripada Mandal", "Indrajit Roy",
    "Jagannath Das", "Kalipada Maity", "Laltu Biswas", "Mafizul Islam",
    "Nitai Chandra", "Ojit Mahato", "Prokash Kumar", "Ranjit Ghosh",
    "Samar Patra", "Tapash Dey", "Ujjwal Banerjee", "Vikram Singh"
]


def utc_now():
    return datetime.now(timezone.utc)


async def seed(reset: bool = False):
    from app.database import engine
    from app.models import Base
    if reset:
        print("🧹 Resetting database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

    await init_db()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select, func
        result = await db.execute(select(func.count(User.id)))
        count = result.scalar()
        if count > 0 and not reset:
            print("Database already seeded. Skipping...")
            return

        print("🌱 Seeding KrishiConnect database...")

        # ── Admin User ────────────────────────────────────────────────────────
        admin = User(
            full_name="District Agricultural Officer",
            mobile="9000000000",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            village="Haripur",
            district="Howrah"
        )
        db.add(admin)

        # ── Procurement Centres ───────────────────────────────────────────────
        centres_data = [
            {
                "name": "Haripur Procurement Centre",
                "location": "Haripur, Howrah",
                "district": "Howrah",
                "latitude": 22.5833,
                "longitude": 88.3333,
                "distance_km": 0.0,
                "avg_processing_minutes": 7.0,
                "counters": 3
            },
            {
                "name": "Bagnan Procurement Centre",
                "location": "Bagnan, Howrah",
                "district": "Howrah",
                "latitude": 22.4731,
                "longitude": 87.9719,
                "distance_km": 18.5,
                "avg_processing_minutes": 8.5,
                "counters": 2
            },
            {
                "name": "Uluberia Procurement Centre",
                "location": "Uluberia, Howrah",
                "district": "Howrah",
                "latitude": 22.4681,
                "longitude": 88.1075,
                "distance_km": 12.8,
                "avg_processing_minutes": 6.5,
                "counters": 4
            },
            {
                "name": "Amta Procurement Centre",
                "location": "Amta, Howrah",
                "district": "Howrah",
                "latitude": 22.5961,
                "longitude": 87.9791,
                "distance_km": 24.1,
                "avg_processing_minutes": 9.0,
                "counters": 2
            }
        ]

        centres = []
        for cd in centres_data:
            n_counters = cd.pop("counters")
            centre = ProcurementCentre(**cd)
            db.add(centre)
            await db.flush()  # get centre.id

            for i in range(1, n_counters + 1):
                counter = CentreCounter(
                    centre_id=centre.id,
                    counter_number=i,
                    label=f"Counter {i}",
                    is_active=True,
                    operator_name=f"Operator {i}"
                )
                db.add(counter)

            # Add time slots for today and next 7 days
            today = date.today()
            for day_offset in range(7):
                slot_date = today + timedelta(days=day_offset)
                time_windows = [
                    ("09:00", "10:00"), ("10:00", "11:00"),
                    ("11:00", "12:00"), ("12:00", "13:00"),
                    ("14:00", "15:00"), ("15:00", "16:00")
                ]
                for start, end in time_windows:
                    slot = TimeSlot(
                        centre_id=centre.id,
                        date=slot_date,
                        start_time=start,
                        end_time=end,
                        total_capacity=25,
                        booked_count=0,
                        is_active=True
                    )
                    db.add(slot)

            centres.append(centre)

        await db.flush()

        # ── Operator Users ────────────────────────────────────────────────────
        for i, centre in enumerate(centres):
            op = User(
                full_name=f"Operator - {centre.name.split()[0]}",
                mobile=f"900000000{i + 1}",
                hashed_password=get_password_hash("operator123"),
                role=UserRole.OPERATOR,
                assigned_centre_id=centre.id,
                district=centre.district
            )
            db.add(op)

        # ── Farmer Users ──────────────────────────────────────────────────────
        farmers = []
        for i, name in enumerate(FARMER_NAMES):
            farmer = User(
                full_name=name,
                mobile=f"98{str(i).zfill(9)}",
                hashed_password=get_password_hash("farmer123"),
                role=UserRole.FARMER,
                village=random.choice(VILLAGES),
                district="Howrah",
                farmer_id=f"WB-HWH-{1000 + i}"
            )
            db.add(farmer)
            farmers.append(farmer)

        await db.flush()

        # ── Get today's slots for Haripur (centre index 0) ───────────────────
        from sqlalchemy import select as sa_select
        haripur = centres[0]
        today = date.today()

        result = await db.execute(
            sa_select(TimeSlot).where(
                TimeSlot.centre_id == haripur.id,
                TimeSlot.date == today
            ).order_by(TimeSlot.start_time)
        )
        today_slots = result.scalars().all()

        result = await db.execute(
            sa_select(CentreCounter).where(CentreCounter.centre_id == haripur.id)
        )
        haripur_counters = result.scalars().all()

        # ── Create demo queue for Haripur ─────────────────────────────────────
        token_num = 101
        now = utc_now()

        # 5 COMPLETED entries
        for i in range(5):
            farmer = farmers[i]
            slot = today_slots[0]
            crop = random.choice(CROPS[:3])
            qty_kg = round(random.uniform(150, 400), 1)

            entry = QueueEntry(
                token=f"A{token_num}",
                farmer_id=farmer.id,
                centre_id=haripur.id,
                slot_id=slot.id,
                status=QueueStatus.COMPLETED,
                crop=crop,
                expected_quantity_kg=qty_kg,
                booked_at=now - timedelta(hours=5 + i),
                called_at=now - timedelta(hours=4 + i),
                processing_started_at=now - timedelta(hours=4 + i) + timedelta(minutes=2),
                completed_at=now - timedelta(hours=3 + i),
            )
            slot.booked_count += 1

            accepted = round(qty_kg * random.uniform(0.92, 0.99), 1)
            grade = "Grade B" if random.random() < 0.25 else "Grade A"
            price_info = calculate_gradewise_price(crop, grade)
            rate = price_info["effective_rate_per_kg"]
            total = round(accepted * rate, 2)

            assay = AssayRecord(
                queue_entry=entry,
                crop=crop,
                moisture_percentage=15.2 if grade == "Grade B" else 13.2,
                chaff_percentage=1.8 if grade == "Grade B" else 0.6,
                damaged_grains_percentage=1.0 if grade == "Grade B" else 0.0,
                grade=grade,
                decision="APPROVED",
                suggested_rate_per_kg=rate,
                notes=f"Statutory {grade} Assay Verified",
                created_at=entry.processing_started_at
            )

            proc = Procurement(
                queue_entry=entry,
                assay_record=assay,
                crop=crop,
                grade=grade,
                expected_quantity_kg=qty_kg,
                accepted_quantity_kg=accepted,
                rate_per_kg=rate,
                total_amount=total,
                created_at=entry.processing_started_at,
                completed_at=entry.completed_at
            )

            payment = Payment(
                procurement=proc,
                amount=total,
                status=PaymentStatus.PAID,
                created_at=entry.completed_at,
                paid_at=now - timedelta(hours=i)
            )
            db.add(entry)
            db.add(assay)
            db.add(proc)
            db.add(payment)
            token_num += 1

        # 2 PROCESSING entries (at counters)
        for i in range(2):
            farmer = farmers[5 + i]
            slot = today_slots[1]
            crop = random.choice(CROPS[:3])
            qty_kg = round(random.uniform(200, 350), 1)

            entry = QueueEntry(
                token=f"A{token_num}",
                farmer_id=farmer.id,
                centre_id=haripur.id,
                slot_id=slot.id,
                counter_id=haripur_counters[i].id if i < len(haripur_counters) else None,
                status=QueueStatus.PROCESSING,
                crop=crop,
                expected_quantity_kg=qty_kg,
                booked_at=now - timedelta(hours=2),
                called_at=now - timedelta(minutes=20 + i * 10),
                processing_started_at=now - timedelta(minutes=15 + i * 10),
            )
            slot.booked_count += 1

            proc = Procurement(
                queue_entry=entry,
                crop=crop,
                expected_quantity_kg=qty_kg,
                created_at=entry.processing_started_at
            )
            db.add(entry)
            db.add(proc)
            token_num += 1

        # 14 WAITING entries
        for i in range(14):
            farmer = farmers[7 + i]
            slot = today_slots[2] if i < 7 else today_slots[3]
            crop = random.choice(CROPS)
            qty_kg = round(random.uniform(100, 500), 1)

            entry = QueueEntry(
                token=f"A{token_num}",
                farmer_id=farmer.id,
                centre_id=haripur.id,
                slot_id=slot.id,
                status=QueueStatus.WAITING,
                crop=crop,
                expected_quantity_kg=qty_kg,
                booked_at=now - timedelta(hours=1) + timedelta(minutes=i * 3),
            )
            slot.booked_count += 1
            db.add(entry)
            token_num += 1

        # 1 CANCELLED entry
        entry = QueueEntry(
            token=f"A{token_num}",
            farmer_id=farmers[21].id,
            centre_id=haripur.id,
            slot_id=today_slots[1].id,
            status=QueueStatus.CANCELLED,
            crop="Paddy",
            expected_quantity_kg=200.0,
            booked_at=now - timedelta(hours=3),
            cancelled_at=now - timedelta(hours=2),
        )
        db.add(entry)
        token_num += 1

        # ── Demo Farmer: registered as "farmer" user for fresh login ──────────
        demo_farmer = User(
            full_name="Demo Farmer (You)",
            mobile="9876543210",
            hashed_password=get_password_hash("demo123"),
            role=UserRole.FARMER,
            village="Haripur",
            district="Howrah",
            farmer_id="WB-HWH-DEMO"
        )
        db.add(demo_farmer)
        await db.flush()

        # ── Seed other centres with some live data ────────────────────────────
        for centre_idx in range(1, 4):
            centre = centres[centre_idx]
            result = await db.execute(
                sa_select(TimeSlot).where(
                    TimeSlot.centre_id == centre.id,
                    TimeSlot.date == today
                ).order_by(TimeSlot.start_time)
            )
            c_slots = result.scalars().all()
            if not c_slots:
                continue

            c_token = 200 + centre_idx * 100
            n_completed = random.randint(3, 8)
            n_waiting = random.randint(5, 15)

            for j in range(n_completed):
                if j >= len(farmers) - 22:
                    break
                farmer = farmers[22 + j % 10]
                crop = random.choice(CROPS)
                qty = round(random.uniform(100, 400), 1)
                entry = QueueEntry(
                    token=f"B{c_token}",
                    farmer_id=farmer.id,
                    centre_id=centre.id,
                    slot_id=c_slots[0].id,
                    status=QueueStatus.COMPLETED,
                    crop=crop,
                    expected_quantity_kg=qty,
                    booked_at=now - timedelta(hours=5),
                    completed_at=now - timedelta(hours=2),
                )
                db.add(entry)
                c_slots[0].booked_count += 1
                c_token += 1

            for j in range(n_waiting):
                farmer = farmers[(22 + n_completed + j) % len(farmers)]
                entry = QueueEntry(
                    token=f"B{c_token}",
                    farmer_id=farmer.id,
                    centre_id=centre.id,
                    slot_id=c_slots[1].id if len(c_slots) > 1 else c_slots[0].id,
                    status=QueueStatus.WAITING,
                    crop=random.choice(CROPS),
                    expected_quantity_kg=round(random.uniform(100, 400), 1),
                    booked_at=now - timedelta(minutes=random.randint(10, 120)),
                )
                db.add(entry)
                c_token += 1

        # ── 30 days of historical data (powers EMA predictor) ─────────────────
        print("📅 Seeding 30-day historical queue data for AI model…")
        await _seed_history(db, centres, farmers)

        await db.commit()
        print("✅ Seed complete! Initial users and procurement centres created.")
        print("ℹ️  Seed credentials are for development use only — check seed.py for details.")


async def _seed_history(db, centres, farmers):
    """
    Backfill 30 days of completed QueueEntry + Procurement + Payment rows.
    Each day gets realistic volume with normally-distributed wait times.
    """
    from sqlalchemy import select as sa_select
    today = date.today()
    token_counter = 3000

    for day_offset in range(30, 0, -1):  # 30 days ago … yesterday
        hist_date = today - timedelta(days=day_offset)
        is_weekend = hist_date.weekday() >= 5
        base_volume = random.randint(6, 10) if is_weekend else random.randint(10, 16)

        for centre in centres:
            volume = max(1, int(base_volume * random.uniform(0.8, 1.2)))

            hist_slot = TimeSlot(
                centre_id=centre.id,
                date=hist_date,
                start_time="09:00",
                end_time="17:00",
                total_capacity=50,
                booked_count=min(volume, 50),
                is_active=True,
            )
            db.add(hist_slot)
            await db.flush()  # get hist_slot.id

            centre_baseline = centre.avg_processing_minutes * random.uniform(0.8, 1.3)

            for j in range(volume):
                farmer = farmers[(token_counter + j) % len(farmers)]
                crop = random.choice(CROPS)
                qty_kg = round(random.uniform(80, 500), 1)

                booked_dt = datetime.combine(hist_date, datetime.min.time(), tzinfo=timezone.utc) + timedelta(hours=9, minutes=j * 15)
                wait_min = max(3.0, random.gauss(centre_baseline * 3, centre_baseline))
                proc_start = booked_dt + timedelta(minutes=wait_min)
                proc_duration = max(4.0, random.gauss(centre.avg_processing_minutes, 1.5))
                completed_dt = proc_start + timedelta(minutes=proc_duration)

                accepted = round(qty_kg * random.uniform(0.88, 0.99), 1)
                grade = "Grade B" if random.random() < 0.25 else "Grade A"
                price_info = calculate_gradewise_price(crop, grade)
                rate = price_info["effective_rate_per_kg"]
                total_amount = round(accepted * rate, 2)

                entry = QueueEntry(
                    token=f"H{token_counter}",
                    farmer_id=farmer.id,
                    centre_id=centre.id,
                    slot_id=hist_slot.id,
                    status=QueueStatus.COMPLETED,
                    crop=crop,
                    expected_quantity_kg=qty_kg,
                    booked_at=booked_dt,
                    called_at=booked_dt + timedelta(minutes=max(1.0, wait_min - 2)),
                    processing_started_at=proc_start,
                    completed_at=completed_dt,
                )

                assay = AssayRecord(
                    queue_entry=entry,
                    crop=crop,
                    moisture_percentage=15.1 if grade == "Grade B" else 13.0,
                    chaff_percentage=1.7 if grade == "Grade B" else 0.5,
                    damaged_grains_percentage=1.2 if grade == "Grade B" else 0.0,
                    grade=grade,
                    decision="APPROVED",
                    suggested_rate_per_kg=rate,
                    notes=f"Historical {grade} intake",
                    created_at=proc_start
                )

                proc = Procurement(
                    queue_entry=entry,
                    assay_record=assay,
                    crop=crop,
                    grade=grade,
                    expected_quantity_kg=qty_kg,
                    accepted_quantity_kg=accepted,
                    rate_per_kg=rate,
                    total_amount=total_amount,
                    created_at=proc_start,
                    completed_at=completed_dt,
                )

                payment = Payment(
                    procurement=proc,
                    amount=total_amount,
                    status=PaymentStatus.PAID,
                    created_at=completed_dt,
                    paid_at=completed_dt + timedelta(hours=random.randint(1, 4)),
                )

                db.add(entry)
                db.add(assay)
                db.add(proc)
                db.add(payment)
                token_counter += 1

        # Flush per day
        await db.flush()

    print(f"  ✓ Historical data: {token_counter - 3000} records across 30 days")


if __name__ == "__main__":
    import sys
    do_reset = "--reset" in sys.argv or "-r" in sys.argv
    asyncio.run(seed(reset=do_reset))
