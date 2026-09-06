"""
KrishiConnect Timezone & Date Utilities
Provides consistent Indian Standard Time (IST / Asia/Kolkata, UTC+5:30) date handling across
PostgreSQL / SQLite databases and API routers.
"""
from datetime import datetime, date, timezone
import zoneinfo
from sqlalchemy import func

KOLKATA_TZ = zoneinfo.ZoneInfo("Asia/Kolkata")


def utc_now() -> datetime:
    """Current UTC timestamp with timezone metadata."""
    return datetime.now(timezone.utc)


def get_local_today() -> date:
    """Current calendar date in Indian Standard Time (Asia/Kolkata)."""
    return datetime.now(timezone.utc).astimezone(KOLKATA_TZ).date()


def local_date(col):
    """
    SQLAlchemy expression for timezone-aware date casting in PostgreSQL.
    Converts TIMESTAMPTZ column to Asia/Kolkata calendar date.
    """
    return func.date(func.timezone("Asia/Kolkata", col))
