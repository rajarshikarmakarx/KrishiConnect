"""
KrishiConnect FastAPI Main Application
"""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.seed import seed
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
    yield


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
