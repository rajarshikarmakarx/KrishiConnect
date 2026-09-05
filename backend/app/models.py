"""
KrishiConnect Database Models
"""
import enum
from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Time,
    Boolean, Enum as SAEnum, ForeignKey, Text, func
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class UserRole(str, enum.Enum):
    FARMER = "farmer"
    OPERATOR = "operator"
    ADMIN = "admin"


class QueueStatus(str, enum.Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
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
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.FARMER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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
    latitude = Column(Float, default=22.5726)
    longitude = Column(Float, default=88.3639)
    distance_km = Column(Float, default=0.0)  # From a reference point
    status = Column(SAEnum(CentreStatus), default=CentreStatus.OPEN)
    max_daily_capacity = Column(Integer, default=100)
    avg_processing_minutes = Column(Float, default=7.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    counters = relationship("CentreCounter", back_populates="centre")
    slots = relationship("TimeSlot", back_populates="centre")
    queue_entries = relationship("QueueEntry", back_populates="centre")


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

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(10), nullable=False, index=True)  # e.g. A127
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    centre_id = Column(Integer, ForeignKey("procurement_centres.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=True)
    counter_id = Column(Integer, ForeignKey("centre_counters.id"), nullable=True)

    status = Column(SAEnum(QueueStatus), default=QueueStatus.WAITING, nullable=False)
    crop = Column(String(100), nullable=False)
    expected_quantity_kg = Column(Float, nullable=False)

    booked_at = Column(DateTime, default=datetime.utcnow)
    called_at = Column(DateTime, nullable=True)
    processing_started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    farmer = relationship("User", back_populates="queue_entries", foreign_keys=[farmer_id])
    centre = relationship("ProcurementCentre", back_populates="queue_entries")
    slot = relationship("TimeSlot", back_populates="queue_entries")
    counter = relationship("CentreCounter", back_populates="queue_entries")
    procurement = relationship("Procurement", back_populates="queue_entry", uselist=False)


class Procurement(Base):
    __tablename__ = "procurements"

    id = Column(Integer, primary_key=True, index=True)
    queue_entry_id = Column(Integer, ForeignKey("queue_entries.id"), unique=True, nullable=False)
    crop = Column(String(100), nullable=False)
    expected_quantity_kg = Column(Float, nullable=False)
    accepted_quantity_kg = Column(Float, nullable=True)
    rate_per_kg = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    queue_entry = relationship("QueueEntry", back_populates="procurement")
    payment = relationship("Payment", back_populates="procurement", uselist=False)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    procurement_id = Column(Integer, ForeignKey("procurements.id"), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.PROCESSING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    procurement = relationship("Procurement", back_populates="payment")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO")  # INFO, APPROACHING, CALLED, PAYMENT
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("User", back_populates="notifications")
