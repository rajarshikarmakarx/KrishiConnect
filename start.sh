#!/usr/bin/env bash
# =============================================================================
# KrishiConnect - One-Click Startup Script
# Automatically sets up Python virtual environment, installs backend & frontend
# dependencies, initializes/seeds the database, and launches dev servers.
# =============================================================================
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🌾 =========================================================="
echo "🌾 Starting KrishiConnect Smart Procurement Platform"
echo "🌾 =========================================================="
echo ""

# ── Dependency Checks ────────────────────────────────────────────────────────
command -v python3 >/dev/null 2>&1 || {
  echo "❌ Python 3 is required but not found in PATH. Please install Python 3."
  exit 1
}

command -v npm >/dev/null 2>&1 || {
  echo "❌ Node.js & npm are required but not found in PATH. Please install Node.js."
  exit 1
}

# ── Backend Setup & Launch ───────────────────────────────────────────────────
echo "⚙️  Configuring Backend Service..."
cd "$ROOT/backend"

# Ensure .env exists
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "📄 Creating backend/.env from .env.example..."
  cp .env.example .env
fi

# Create virtual environment if missing
if [ ! -d "venv" ]; then
  echo "📦 Creating Python virtual environment in backend/venv..."
  python3 -m venv venv
fi

# Determine python and pip executables (handles Linux, macOS, Git Bash / WSL on Windows)
if [ -f "$ROOT/backend/venv/bin/python" ]; then
  PYTHON_BIN="$ROOT/backend/venv/bin/python"
  PIP_BIN="$ROOT/backend/venv/bin/pip"
elif [ -f "$ROOT/backend/venv/Scripts/python.exe" ]; then
  PYTHON_BIN="$ROOT/backend/venv/Scripts/python.exe"
  PIP_BIN="$ROOT/backend/venv/Scripts/pip.exe"
elif [ -f "$ROOT/backend/venv/Scripts/python" ]; then
  PYTHON_BIN="$ROOT/backend/venv/Scripts/python"
  PIP_BIN="$ROOT/backend/venv/Scripts/pip"
else
  PYTHON_BIN="python3"
  PIP_BIN="pip3"
fi

# Check if essential packages are installed, else install requirements.txt
if ! "$PYTHON_BIN" -c "import fastapi, uvicorn, sqlalchemy, jose, tzdata" 2>/dev/null; then
  echo "📦 Installing backend Python dependencies..."
  "$PIP_BIN" install --disable-pip-version-check -r requirements.txt
fi

# Ensure database is initialized & seeded
echo "🌱 Ensuring database and seed data are ready..."
PYTHONPATH=. "$PYTHON_BIN" -c "
import asyncio
from app.database import init_db
from app.seed import seed

async def main():
    await init_db()
    await seed()

asyncio.run(main())
"

echo "🚀 Launching FastAPI backend server on http://localhost:8000 ..."
PYTHONPATH=. "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# ── Frontend Setup & Launch ──────────────────────────────────────────────────
echo ""
echo "⚙️  Configuring Frontend Service..."
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend npm dependencies..."
  npm install
fi

echo "🚀 Launching Vite frontend server on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

# ── Summary Banner ───────────────────────────────────────────────────────────
echo ""
echo "=========================================================="
echo "✅ KrishiConnect Platform is up and running!"
echo "=========================================================="
echo "   🌾 Farmer Portal:       http://localhost:5173/"
echo "   🏢 Mandi Officer/Admin: http://localhost:5173/admin"
echo "   🔌 Backend API Docs:    http://localhost:8000/docs"
echo "=========================================================="
echo ""
echo "📌 Demo Credentials:"
echo "   - Farmer Mobile OTP:    Any 10-digit mobile (OTP: 123456)"
echo "   - Operator (Mandi):     Mobile: 9000000001 | Password: operator123"
echo "   - District Admin:       Mobile: 9000000000 | Password: admin123"
echo "=========================================================="
echo ""
echo "Press Ctrl+C to stop all servers."

# Graceful cleanup on exit or interrupt
trap "echo ''; echo '🛑 Stopping KrishiConnect servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0" INT TERM EXIT

# Wait for background child processes
wait
