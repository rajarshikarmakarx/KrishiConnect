#!/usr/bin/env bash
# =============================================================================
# KrishiConnect - Cross-Platform Startup Script (Linux, macOS, WSL, Git Bash)
# =============================================================================
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🌾 =========================================================="
echo "🌾 Starting KrishiConnect Smart Agricultural Platform"
echo "🌾 =========================================================="
echo ""

# ── 1. Dependency Checks ──────────────────────────────────────────────────────
PY_BIN=""
if command -v python3 >/dev/null 2>&1; then
  PY_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PY_BIN="python"
elif command -v py >/dev/null 2>&1; then
  PY_BIN="py"
else
  echo "❌ Python is required but not found in PATH. Please install Python 3.10+."
  exit 1
fi

PKG_MGR="pnpm"
if ! command -v pnpm >/dev/null 2>&1; then
  if command -v npm >/dev/null 2>&1; then
    PKG_MGR="npm"
  else
    echo "❌ Node.js and pnpm (or npm) are required but not found in PATH."
    exit 1
  fi
fi

# ── 2. Backend Setup & Launch ─────────────────────────────────────────────────
echo "⚙️  Configuring Backend Service..."
cd "$ROOT/backend"

# Ensure .env exists
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "📄 Creating backend/.env from .env.example..."
  cp .env.example .env
fi

# Determine python and pip executables (handles Linux, macOS, Git Bash / WSL on Windows)
VENV_PYTHON=""
VENV_PIP=""

if [ -f "$ROOT/backend/venv/bin/python" ]; then
  VENV_PYTHON="$ROOT/backend/venv/bin/python"
  VENV_PIP="$ROOT/backend/venv/bin/pip"
elif [ -f "$ROOT/../backend/venv/bin/python" ]; then
  echo "ℹ️  Using shared virtual environment from parent backend..."
  VENV_PYTHON="$ROOT/../backend/venv/bin/python"
  VENV_PIP="$ROOT/../backend/venv/bin/pip"
elif [ -f "$ROOT/backend/venv/Scripts/python.exe" ]; then
  VENV_PYTHON="$ROOT/backend/venv/Scripts/python.exe"
  VENV_PIP="$ROOT/backend/venv/Scripts/pip.exe"
elif [ -f "$ROOT/../backend/venv/Scripts/python.exe" ]; then
  echo "ℹ️  Using shared virtual environment from parent backend..."
  VENV_PYTHON="$ROOT/../backend/venv/Scripts/python.exe"
  VENV_PIP="$ROOT/../backend/venv/Scripts/pip.exe"
else
  echo "📦 Creating Python virtual environment in backend/venv..."
  "$PY_BIN" -m venv venv
  if [ -f "venv/bin/python" ]; then
    VENV_PYTHON="$ROOT/backend/venv/bin/python"
    VENV_PIP="$ROOT/backend/venv/bin/pip"
  else
    VENV_PYTHON="$ROOT/backend/venv/Scripts/python.exe"
    VENV_PIP="$ROOT/backend/venv/Scripts/pip.exe"
  fi
fi

# Install dependencies if needed
if ! "$VENV_PYTHON" -c "import fastapi, uvicorn, sqlalchemy, jose" 2>/dev/null; then
  echo "📦 Installing backend Python dependencies..."
  "$VENV_PIP" install --disable-pip-version-check -r requirements.txt
fi

# Ensure database is initialized & seeded
echo "🌱 Ensuring database and seed data are ready..."
"$VENV_PYTHON" -c "
import asyncio
from app.database import init_db
from app.seed import seed

async def main():
    await init_db()
    await seed()

asyncio.run(main())
"

echo "🚀 Launching FastAPI backend server on http://localhost:8000 ..."
"$VENV_PYTHON" run.py &
BACKEND_PID=$!

# ── 3. Frontend Setup & Launch ────────────────────────────────────────────────
echo ""
echo "⚙️  Configuring Frontend Service ($PKG_MGR)..."
cd "$ROOT/frontend"

# Ensure .env exists
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies ($PKG_MGR)..."
  $PKG_MGR install
fi

echo "🚀 Launching Vite frontend server on http://localhost:5173 ..."
$PKG_MGR dev &
FRONTEND_PID=$!

# ── 4. Summary Banner ─────────────────────────────────────────────────────────
echo ""
echo "=========================================================="
echo "✅ KrishiConnect Platform is up and running!"
echo "=========================================================="
echo "   🌾 Farmer Portal:       http://localhost:5173/"
echo "   🏢 Mandi Officer/Admin: http://localhost:5173/admin"
echo "   🔌 Backend API Docs:    http://localhost:8000/docs"
echo "=========================================================="
echo ""
echo "Press Ctrl+C to stop all servers."

# Graceful cleanup on exit or interrupt
trap "echo ''; echo '🛑 Stopping KrishiConnect servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0" INT TERM EXIT

# Wait for background child processes
wait
