#!/usr/bin/env bash
# KrishiFlow startup script
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🌾 Starting KrishiFlow Procurement Platform..."
echo ""

# ── Backend ──────────────────────────────────────────────────────────────────
cd "$ROOT/backend"

if [ ! -d "venv" ]; then
  echo "📦 Creating virtual environment..."
  python3 -m venv venv
fi

echo "📦 Ensuring backend dependencies are installed..."
venv/bin/pip install -q --disable-pip-version-check -r requirements.txt || pip install -q --disable-pip-version-check -r requirements.txt

echo "🌱 Ensuring database is seeded..."
PYTHONPATH=. venv/bin/python app/seed.py

echo "🚀 Starting FastAPI backend on http://localhost:8000"
PYTHONPATH=. venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# ── Frontend ──────────────────────────────────────────────────────────────────
cd "$ROOT/frontend"

if [ ! -d node_modules ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

echo "🚀 Starting React dev server on http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "✅ KrishiFlow is up and running!"
echo "=========================================================="
echo "   🌾 Farmer Portal:     http://localhost:5173/"
echo "   🏢 Officer Portal:    http://localhost:5173/admin"
echo "   🔌 API Docs:          http://localhost:8000/docs"
echo "=========================================================="
echo ""
echo "Press Ctrl+C to stop all servers."

# Wait and cleanup
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped KrishiFlow.'" EXIT
wait

