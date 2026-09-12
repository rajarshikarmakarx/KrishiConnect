"""
KrishiConnect Timezone & Date Utilities
Provides consistent Indian Standard Time (IST / Asia/Kolkata, UTC+5:30) date handling across
PostgreSQL / SQLite databases and API routers.
"""
from datetime import datetime, date, timezone, timedelta
from sqlalchemy import func

try:
    import zoneinfo
    KOLKATA_TZ = zoneinfo.ZoneInfo("Asia/Kolkata")
except Exception:
    # Fallback for systems without system IANA zoneinfo (e.g. Windows without tzdata package)
    # Indian Standard Time (IST) is UTC+5:30 with no Daylight Saving Time changes.
    KOLKATA_TZ = timezone(timedelta(hours=5, minutes=30), name="Asia/Kolkata")


def utc_now() -> datetime:
    """Current UTC timestamp with timezone metadata."""
    return datetime.now(timezone.utc)


def get_local_today() -> date:
    """Current calendar date in Indian Standard Time (Asia/Kolkata)."""
    return datetime.now(timezone.utc).astimezone(KOLKATA_TZ).date()


def is_postgres() -> bool:
    """Check if active database is PostgreSQL/asyncpg."""
    from app.database import DATABASE_URL
    return "postgresql" in DATABASE_URL or "asyncpg" in DATABASE_URL


def get_date_range_utc(target_date: date) -> tuple[datetime, datetime]:
    """
    Returns (start_utc, end_utc) for a given calendar date in Indian Standard Time (IST, UTC+5:30).
    Enables high-performance index-seek range scans (col >= start_utc AND col < end_utc)
    instead of unindexable column-wrapped functions.
    """
    # Start of day in IST converted to UTC
    start_ist = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0, tzinfo=KOLKATA_TZ)
    end_ist = start_ist + timedelta(days=1)
    return start_ist.astimezone(timezone.utc), end_ist.astimezone(timezone.utc)


def get_local_today_range_utc() -> tuple[datetime, datetime]:
    """Returns (start_utc, end_utc) for today's date in Indian Standard Time (IST)."""
    today_ist = get_local_today()
    return get_date_range_utc(today_ist)


def local_date(col):
    """
    SQLAlchemy expression for timezone-aware date casting in PostgreSQL and SQLite.
    - PostgreSQL: converts TIMESTAMPTZ column to Asia/Kolkata date via timezone().
    - SQLite: converts UTC datetime column to Asia/Kolkata (+5:30 = +330 minutes) date.
    """
    if is_postgres():
        return func.date(func.timezone("Asia/Kolkata", col))
    return func.date(col, "+330 minutes")

