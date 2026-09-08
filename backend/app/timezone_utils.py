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
    KOLKATA_TZ = timezone(timedelta(hours=5, minutes=30), name="IST")


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


def local_date(col):
    """
    SQLAlchemy expression for timezone-aware date casting in PostgreSQL and SQLite.
    - PostgreSQL: converts TIMESTAMPTZ column to Asia/Kolkata date via timezone().
    - SQLite: converts UTC datetime column to Asia/Kolkata (+5:30 = +330 minutes) date.
    """
    if is_postgres():
        return func.date(func.timezone("Asia/Kolkata", col))
    return func.date(col, "+330 minutes")

