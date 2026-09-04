"""
KrishiFlow FastAPI Main Application
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.seed import seed
from app.api.auth import router as auth_router
from app.api.centres import router as centres_router
from app.api.queue import router as queue_router
from app.api.analytics import payments_router, analytics_router
from app.api.websocket import ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and seed data
    await init_db()
    await seed()
    yield


app = FastAPI(
    title="KrishiFlow API",
    description="Smart Procurement & Queue Management for Farmers",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — read from env, never allow wildcard in production
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(centres_router)
app.include_router(queue_router)
app.include_router(payments_router)
app.include_router(analytics_router)
app.include_router(ws_router)


@app.get("/")
async def root():
    return {
        "service": "KrishiFlow API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
