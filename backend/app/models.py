"""
KrishiConnect Database Models
PostgreSQL compatible schema with native_enum=False, UTC timezone-aware datetimes,
and robust foreign key relationships.
"""
import enum
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Time,
    Boolean, Enum as SAEnum, ForeignKey, Text, func, Index
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def utc_now():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    FARMER = "farmer"
    OPERATOR = "operator"
    ASSAYER = "assayer"
    ADMIN = "admin"


class QueueStatus(str, enum.Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    DEFERRED_SUN_DRYING = "DEFERRED_SUN_DRYING"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, enum.Enum):
    PROCESSING = "PROCESSING"
    PAID = "PAID"


class CentreStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    FULL = "FULL"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    mobile = Column(String(15), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    role = Column(SAEnum(UserRole, native_enum=False), nullable=False, default=UserRole.FARMER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Farmer-specific fields
    village = Column(String(200))
    district = Column(String(200))
    farmer_id = Column(String(100))  # Optional gov't farmer ID

    # Operator-specific fields
    assigned_centre_id = Column(Integer, ForeignKey("procurement_centres.id"), nullable=True)

    queue_entries = relationship("QueueEntry", back_populates="farmer", foreign_keys="QueueEntry.farmer_id")
    notifications = relationship("Notification", back_populates="farmer")


class ProcurementCentre(Base):
    __tablename__ = "procurement_centres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    location = Column(String(300), nullable=False)
    district = Column(String(200), nullable=False)
    latitude = Column(Float, default=22.5833)
    longitude = Column(Float, default=88.3333)
    distance_km = Column(Float, default=0.0)  # Reference distance
    status = Column(SAEnum(CentreStatus, native_enum=False), default=CentreStatus.OPEN)
    max_daily_capacity = Column(Integer, default=100)
    avg_processing_minutes = Column(Float, default=7.0)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    counters = relationship("CentreCounter", back_populates="centre")
    slots = relationship("TimeSlot", back_populates="centre")
    queue_entries = relationship("QueueEntry", back_populates="centre")
    quality_standards = relationship("CentreQualityStandard", back_populates="centre", uselist=False)


class CentreCounter(Base):
    __tablename__ = "centre_counters"

    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("procurement_centres.id"), nullable=False)
    counter_number = Column(Integer, nullable=False)
    label = Column(String(100))  # e.g. "Counter 1"
    is_active = Column(Boolean, default=True)
    operator_name = Column(String(200))

    centre = relationship("ProcurementCentre", back_populates="counters")
    queue_entries = relationship("QueueEntry", back_populates="counter")


class TimeSlot(Base):
    __tablename__ = "time_slots"
    __table_args__ = (
        Index("ix_timeslot_centre_date", "centre_id", "date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("procurement_centres.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=False)  # "10:00"
    end_time = Column(String(10), nullable=False)    # "11:00"
    total_capacity = Column(Integer, default=25)
    booked_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    centre = relationship("ProcurementCentre", back_populates="slots")
    queue_entries = relationship("QueueEntry", back_populates="slot")


class QueueEntry(Base):
    __tablename__ = "queue_entries"
    __table_args__ = (
        Index("ix_queue_centre_status", "centre_id", "status"),
        Index("ix_queue_centre_booked", "centre_id", "booked_at"),
        Index("ix_queue_farmer_status", "farmer_id", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(10), nullable=False, index=True)  # e.g. A127
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    centre_id = Column(Integer, ForeignKey("procurement_centres.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=True)
    counter_id = Column(Integer, ForeignKey("centre_counters.id"), nullable=True)

    status = Column(SAEnum(QueueStatus, native_enum=False), default=QueueStatus.WAITING, nullable=False)
    crop = Column(String(100), nullable=False)
    expected_quantity_kg = Column(Float, nullable=False)

    # Priority Bump (Assayer authorization with immutable statutory audit logging)
    is_bumped = Column(Boolean, default=False, nullable=False)
    bump_priority = Column(Integer, default=0, nullable=False)
    bump_reason = Column(String(500), nullable=True)
    bumped_at = Column(DateTime(timezone=True), nullable=True)
    bumped_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    booked_at = Column(DateTime(timezone=True), default=utc_now)
    called_at = Column(DateTime(timezone=True), nullable=True)
    processing_started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    farmer = relationship("User", back_populates="queue_entries", foreign_keys=[farmer_id])
    centre = relationship("ProcurementCentre", back_populates="queue_entries")
    slot = relationship("TimeSlot", back_populates="queue_entries")
    counter = relationship("CentreCounter", back_populates="queue_entries")
    bumped_by = relationship("User", foreign_keys=[bumped_by_id])
    procurement = relationship("Procurement", back_populates="queue_entry", uselist=False)
    assay_record = relationship("AssayRecord", back_populates="queue_entry", uselist=False)


class AssayRecord(Base):
    __tablename__ = "assay_records"

    id = Column(Integer, primary_key=True, index=True)
    queue_entry_id = Column(Integer, ForeignKey("queue_entries.id"), unique=True, nullable=False)
    assayer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    crop = Column(String(100), nullable=False)
    moisture_percentage = Column(Float, nullable=False)
    chaff_percentage = Column(Float, default=0.0)
    damaged_grains_percentage = Column(Float, default=0.0)
    grade = Column(String(20), nullable=False)  # "Grade A", "Grade B", "Grade C", "Rejected"
    decision = Column(String(50), nullable=False)  # "APPROVED", "DEFERRED_SUN_DRYING", "REJECTED"
    suggested_rate_per_kg = Column(Float, nullable=False)
    rejection_reason = Column(String(300), nullable=True)
    sun_drying_grace_hours = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    queue_entry = relationship("QueueEntry", back_populates="assay_record")
    assayer = relationship("User", foreign_keys=[assayer_id])
    procurement = relationship("Procurement", back_populates="assay_record", uselist=False)


class Procurement(Base):
    __tablename__ = "procurements"
    __table_args__ = (
        Index("ix_procurement_completed", "completed_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    queue_entry_id = Column(Integer, ForeignKey("queue_entries.id"), unique=True, nullable=False)
    assay_record_id = Column(Integer, ForeignKey("assay_records.id"), nullable=True)
    crop = Column(String(100), nullable=False)
    grade = Column(String(20), nullable=True)
    expected_quantity_kg = Column(Float, nullable=False)
    accepted_quantity_kg = Column(Float, nullable=True)
    rate_per_kg = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    queue_entry = relationship("QueueEntry", back_populates="procurement")
    assay_record = relationship("AssayRecord", back_populates="procurement")
    payment = relationship("Payment", back_populates="procurement", uselist=False)


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payment_status", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    procurement_id = Column(Integer, ForeignKey("procurements.id"), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(SAEnum(PaymentStatus, native_enum=False), default=PaymentStatus.PROCESSING, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    paid_at = Column(DateTime(timezone=True), nullable=True)

    procurement = relationship("Procurement", back_populates="payment")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO")  # INFO, APPROACHING, CALLED, PAYMENT
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    farmer = relationship("User", back_populates="notifications")


class CentreQualityStandard(Base):
    __tablename__ = "centre_quality_standards"

    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("procurement_centres.id"), unique=True, nullable=False, index=True)
    standards_data = Column(Text, nullable=False)  # JSON-encoded standards dict
    is_customized = Column(Boolean, default=True)
    infrastructure_notes = Column(String(500), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    centre = relationship("ProcurementCentre", back_populates="quality_standards")
    updated_by = relationship("User", foreign_keys=[updated_by_id])
