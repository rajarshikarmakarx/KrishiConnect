"""
KrishiConnect Database Connection
Configures Supabase PostgreSQL with asyncpg and connection pooling,
with automatic dialect conversion from standard postgresql:// URLs.
"""
import os
import ssl
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    db_path = BASE_DIR / "krishiconnect.db"
    DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"
else:
    # Convert postgres:// or postgresql:// to postgresql+asyncpg://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = "postgresql+asyncpg://" + DATABASE_URL[len("postgres://"):]
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = "postgresql+asyncpg://" + DATABASE_URL[len("postgresql://"):]
    elif DATABASE_URL.startswith("sqlite+aiosqlite:///."):
        rel_path = DATABASE_URL[len("sqlite+aiosqlite:///."):]
        abs_path = (BASE_DIR / rel_path.lstrip("/")).resolve()
        DATABASE_URL = f"sqlite+aiosqlite:///{abs_path}"

# Engine options
engine_kwargs = {
    "echo": False,
}

if "postgresql" in DATABASE_URL or "asyncpg" in DATABASE_URL:
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 300,
    })
    # Remove sslmode query param from asyncpg URL if present to avoid driver confusion
    if "?" in DATABASE_URL:
        base_url, query_params = DATABASE_URL.split("?", 1)
        params = [p for p in query_params.split("&") if not p.startswith("sslmode=")]
        DATABASE_URL = base_url + ("?" + "&".join(params) if params else "")
elif "sqlite" in DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_async_engine(
    DATABASE_URL,
    **engine_kwargs
)

if "sqlite" in DATABASE_URL:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA cache_size=-64000")  # 64MB cache
            cursor.execute("PRAGMA mmap_size=268435456") # 256MB mmap
            cursor.execute("PRAGMA temp_store=MEMORY")
            cursor.close()
        except Exception:
            pass

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    from app.models import Base
    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if "postgresql" in DATABASE_URL or "asyncpg" in DATABASE_URL:
            try:
                await conn.execute(text("ALTER TABLE queue_entries ALTER COLUMN status TYPE VARCHAR(50);"))
                await conn.execute(text("ALTER TABLE procurements ADD COLUMN IF NOT EXISTS assay_record_id INTEGER REFERENCES assay_records(id);"))
                await conn.execute(text("ALTER TABLE procurements ADD COLUMN IF NOT EXISTS grade VARCHAR(50);"))
            except Exception as e:
                pass

        # Ensure priority bump audit columns exist in queue_entries
        if "postgresql" in DATABASE_URL or "asyncpg" in DATABASE_URL:
            bump_migration_stmts = [
                "ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS is_bumped BOOLEAN DEFAULT FALSE;",
                "ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS bump_priority INTEGER DEFAULT 0;",
                "ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS bump_reason VARCHAR(500);",
                "ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS bumped_at TIMESTAMP WITH TIME ZONE;",
                "ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS bumped_by_id INTEGER REFERENCES users(id);"
            ]
        else:
            bump_migration_stmts = [
                "ALTER TABLE queue_entries ADD COLUMN is_bumped BOOLEAN DEFAULT 0;",
                "ALTER TABLE queue_entries ADD COLUMN bump_priority INTEGER DEFAULT 0;",
                "ALTER TABLE queue_entries ADD COLUMN bump_reason VARCHAR(500);",
                "ALTER TABLE queue_entries ADD COLUMN bumped_at TIMESTAMP;",
                "ALTER TABLE queue_entries ADD COLUMN bumped_by_id INTEGER REFERENCES users(id);"
            ]
        for stmt in bump_migration_stmts:
            try:
                await conn.execute(text(stmt))
            except Exception:
                # Column already exists or dialect variance
                pass
