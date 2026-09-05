"""
KrishiConnect Database Connection
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    db_path = BASE_DIR / "krishiconnect.db"
    DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"
elif DATABASE_URL.startswith("sqlite+aiosqlite:///."):
    rel_path = DATABASE_URL[len("sqlite+aiosqlite:///."):]
    abs_path = (BASE_DIR / rel_path.lstrip("/")).resolve()
    DATABASE_URL = f"sqlite+aiosqlite:///{abs_path}"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
