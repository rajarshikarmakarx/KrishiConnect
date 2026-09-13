@echo off
setlocal enabledelayedexpansion

title KrishiConnect Launcher
echo ============================================================
echo   KrishiConnect - Smart Agricultural Procurement Platform
echo ============================================================
echo.

cd /d "%~dp0"

:: ── 1. Check Python ─────────────────────────────────────────
set "PY_CMD="
where python >nul 2>&1 && set "PY_CMD=python"
if not defined PY_CMD (
    where py >nul 2>&1 && set "PY_CMD=py -3"
)
if not defined PY_CMD (
    where python3 >nul 2>&1 && set "PY_CMD=python3"
)

if not defined PY_CMD (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

:: ── 2. Check Node & NPM ─────────────────────────────────────
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js / NPM is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: ── 3. Configure Backend ────────────────────────────────────
echo [1/4] Setting up Backend...
cd "%~dp0backend"

if not exist ".env" (
    if exist ".env.example" (
        echo      Creating backend/.env from .env.example...
        copy .env.example .env >nul
    )
)

:: Check if system python already has all requirements
set "RUN_PY=%PY_CMD%"
%PY_CMD% -c "import fastapi, uvicorn, sqlalchemy, dotenv" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "RUN_PY=%PY_CMD%"
) else (
    if not exist "venv\Scripts\python.exe" (
        echo      Creating Python virtual environment...
        %PY_CMD% -m venv venv
    )
    set "RUN_PY=%~dp0backend\venv\Scripts\python.exe"
    set "RUN_PIP=%~dp0backend\venv\Scripts\pip.exe"
    echo      Installing backend packages...
    "!RUN_PIP!" install --disable-pip-version-check -r requirements.txt
)

echo      Initializing database and seed data...
set PYTHONPATH=%~dp0backend
set PYTHONIOENCODING=utf-8
%RUN_PY% -m app.seed

:: ── 4. Configure Frontend ───────────────────────────────────
echo.
echo [2/4] Setting up Frontend...
cd "%~dp0frontend"

if not exist ".env" (
    if exist ".env.example" (
        echo      Creating frontend/.env from .env.example...
        copy .env.example .env >nul
    )
)

if not exist "node_modules" (
    echo      Installing npm packages...
    call npm install
)

:: ── 5. Launch Servers ───────────────────────────────────────
echo.
echo [3/4] Starting FastAPI Backend on port 8000...
cd "%~dp0backend"
start "KrishiConnect Backend Server" cmd /k "set PYTHONPATH=%~dp0backend&& set PYTHONIOENCODING=utf-8&& %RUN_PY% -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [4/4] Starting Vite React Frontend on port 5173...
cd "%~dp0frontend"
start "KrishiConnect Frontend Server" cmd /k "npm run dev -- --host"

:: Wait 2 seconds then open browser
ping -n 3 127.0.0.1 >nul
start http://localhost:5173

echo.
echo ============================================================
echo   KrishiConnect is running!
echo ============================================================
echo   Farmer Portal:         http://localhost:5173/
echo   Mandi Officer / Admin: http://localhost:5173/admin
echo   FastAPI Swagger Docs:  http://localhost:8000/docs
echo.
echo   Demo Credentials:
echo   - Farmer OTP:    Any 10-digit number, e.g. 9800000000 (OTP: 482913)
echo   - Operator:      Mobile: 9000000001 or operator@krishi.gov.in (Password: password123)
echo   - Admin:         Mobile: 9000000000 or admin@krishi.gov.in (Password: password123)
echo ============================================================
echo   Close the two server command windows to stop the application.
echo ============================================================
echo.
pause
