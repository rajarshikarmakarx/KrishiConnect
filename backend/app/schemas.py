"""
KrishiConnect Pydantic Schemas — Pydantic v1 compatible
"""
from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel

class SchemaModel(BaseModel):
    class Config:
        from_attributes = True

from app.models import UserRole, QueueStatus, PaymentStatus, CentreStatus


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class FarmerRegister(BaseModel):
    full_name: str
    mobile: str
    village: str
    district: str
    farmer_id: Optional[str] = None
    password: str

class OperatorRegister(BaseModel):
    full_name: str
    mobile: str
    password: str
    assigned_centre_id: int

class LoginRequest(BaseModel):
    mobile: str
    password: str

class SendOtpRequest(BaseModel):
    mobile: str

class SendOtpResponse(BaseModel):
    message: str
    mobile: str
    otp: Optional[str] = None
    dev_mode: bool = True

class VerifyOtpRequest(BaseModel):
    mobile: str
    otp: str

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    full_name: str
    assigned_centre_id: Optional[int] = None
    village: Optional[str] = None
    district: Optional[str] = None


# ─── User Schema ──────────────────────────────────────────────────────────────

class UserOut(SchemaModel):
    id: int
    full_name: str
    mobile: str
    role: str
    village: Optional[str] = None
    district: Optional[str] = None
    farmer_id: Optional[str] = None
    assigned_centre_id: Optional[int] = None


# ─── Centre Schemas ───────────────────────────────────────────────────────────

class CounterOut(SchemaModel):
    id: int
    counter_number: int
    label: str
    is_active: bool
    operator_name: Optional[str] = None
    current_token: Optional[str] = None
    current_farmer_name: Optional[str] = None
    current_queue_entry_id: Optional[int] = None


class CentreOut(SchemaModel):
    id: int
    name: str
    location: str
    district: str
    latitude: float
    longitude: float
    distance_km: float
    status: str
    avg_processing_minutes: float
    waiting_count: int = 0
    processing_count: int = 0
    completed_count: int = 0
    active_counters: int = 0
    estimated_wait_minutes: float = 0.0
    available_slots_today: int = 0
    recommendation_score: Optional[float] = None
    recommendation_reasons: Optional[List[str]] = None


class CentreDetailOut(CentreOut):
    counters: List[CounterOut] = []


# ─── Slot Schemas ─────────────────────────────────────────────────────────────

class SlotOut(SchemaModel):
    id: int
    centre_id: int
    date: date
    start_time: str
    end_time: str
    total_capacity: int
    booked_count: int
    available: int
    is_full: bool


# ─── Queue Schemas ────────────────────────────────────────────────────────────

class BookSlotRequest(BaseModel):
    centre_id: int
    slot_id: int
    crop: str
    expected_quantity_kg: float


# ─── Assay & Quality Schemas ──────────────────────────────────────────────────

class AssayRecordOut(SchemaModel):
    id: int
    queue_entry_id: int
    assayer_id: Optional[int] = None
    crop: str
    moisture_percentage: float
    chaff_percentage: float = 0.0
    damaged_grains_percentage: float = 0.0
    grade: str
    decision: str
    suggested_rate_per_kg: float
    rejection_reason: Optional[str] = None
    sun_drying_grace_hours: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime


class QualityActionRequest(BaseModel):
    action: str  # "REJECT" or "SUN_DRYING_DEFERRAL"
    moisture_percentage: float
    chaff_percentage: Optional[float] = 0.0
    damaged_grains_percentage: Optional[float] = 0.0
    reason: Optional[str] = None
    notes: Optional[str] = None


class QueueEntryOut(SchemaModel):
    id: int
    token: str
    farmer_id: int
    farmer_name: Optional[str] = None
    centre_id: int
    centre_name: Optional[str] = None
    centre_location: Optional[str] = None
    centre_district: Optional[str] = None
    centre_latitude: Optional[float] = None
    centre_longitude: Optional[float] = None
    slot_id: Optional[int] = None
    counter_id: Optional[int] = None
    counter_label: Optional[str] = None
    status: str
    crop: str
    expected_quantity_kg: float
    booked_at: datetime
    called_at: Optional[datetime] = None
    processing_started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    position_ahead: Optional[int] = None
    estimated_wait_minutes: Optional[float] = None
    slot_start_time: Optional[str] = None
    slot_end_time: Optional[str] = None
    slot_date: Optional[date] = None
    assay_record: Optional[AssayRecordOut] = None


class QueueStatusOut(BaseModel):
    centre_id: int
    centre_name: str
    currently_serving: Optional[str] = None
    waiting_count: int
    processing_count: int
    completed_count: int
    cancelled_count: int
    active_counters: int
    avg_processing_minutes: float
    estimated_wait_minutes: float
    entries: List[QueueEntryOut] = []


class MyQueueStatus(BaseModel):
    queue_entry: QueueEntryOut
    currently_serving_token: Optional[str] = None
    farmers_ahead: int
    estimated_wait_minutes: float
    notification: Optional[str] = None


# ─── Operator Actions ─────────────────────────────────────────────────────────

class CompleteQueueRequest(BaseModel):
    accepted_quantity_kg: float
    rate_per_kg: float
    moisture_percentage: Optional[float] = 13.5
    chaff_percentage: Optional[float] = 0.5
    damaged_grains_percentage: Optional[float] = 0.0
    notes: Optional[str] = None


# ─── Procurement Schemas ──────────────────────────────────────────────────────

class PaymentOut(SchemaModel):
    id: int
    procurement_id: int
    amount: float
    status: str
    created_at: datetime
    paid_at: Optional[datetime] = None


class ProcurementOut(SchemaModel):
    id: int
    queue_entry_id: int
    crop: str
    grade: Optional[str] = None
    expected_quantity_kg: float
    accepted_quantity_kg: Optional[float] = None
    rate_per_kg: Optional[float] = None
    total_amount: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    payment: Optional[PaymentOut] = None
    assay_record: Optional[AssayRecordOut] = None


# ─── Analytics Schemas ────────────────────────────────────────────────────────

class CentreAnalytics(BaseModel):
    centre_id: int
    centre_name: str
    today_served: int
    currently_waiting: int
    currently_processing: int
    avg_wait_minutes: float
    total_quantity_kg: float
    total_amount: float
    paid_amount: float
    pending_amount: float
    queue_by_hour: List[dict] = []


class DistrictAnalytics(BaseModel):
    total_served_today: int
    currently_waiting: int
    currently_processing: int
    avg_wait_minutes: float
    total_quantity_tons: float
    total_procurement_amount: float
    total_paid_amount: float
    centres: List[CentreAnalytics] = []
    crop_breakdown: List[dict] = []
    hourly_throughput: List[dict] = []


# ─── Notification Schema ──────────────────────────────────────────────────────

class NotificationOut(SchemaModel):
    id: int
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
