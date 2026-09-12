"""
KrishiConnect FastAPI Main Application
"""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.seed import seed
from app.redis_client import redis_manager
from app.realtime import manager as ws_manager
from app.api.auth import router as auth_router
from app.api.centres import router as centres_router
from app.api.queue import router as queue_router
from app.api.analytics import payments_router, analytics_router
from app.api.ai import ai_router
from app.api.websocket import ws_router
from app.api.locations import router as locations_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and seed data
    await init_db()
    await seed()

    # Initialize Redis connection and start real-time pub/sub mesh
    await redis_manager.init()
    pubsub_task = asyncio.create_task(ws_manager.start_pubsub_listener())

    yield

    # Cleanup background tasks and close Redis pool
    pubsub_task.cancel()
    try:
        await pubsub_task
    except asyncio.CancelledError:
        pass
    except Exception:
        pass
    await redis_manager.close()


app = FastAPI(
    title="KrishiConnect API",
    description="Smart Procurement & Queue Management for Farmers",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — read from env, support dynamic origins for seamless cloud deployment
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:80,http://localhost")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

cors_kwargs = {
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}

if "*" in allowed_origins:
    cors_kwargs["allow_origin_regex"] = r"https?://.*"
else:
    cors_kwargs["allow_origins"] = allowed_origins

app.add_middleware(
    CORSMiddleware,
    **cors_kwargs
)

# GZip compression for responses > 1KB (reduces network payload sizes by ~70-80%)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(auth_router)
app.include_router(centres_router)
app.include_router(queue_router)
app.include_router(payments_router)
app.include_router(analytics_router)
app.include_router(ai_router)
app.include_router(ws_router)
app.include_router(locations_router)


@app.get("/")
async def root():
    return {
        "service": "KrishiConnect API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
