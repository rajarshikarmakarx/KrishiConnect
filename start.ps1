# =============================================================================
# KrishiConnect PowerShell Launcher (Windows)
# =============================================================================
Write-Host "🌾 Starting KrishiConnect Smart Agricultural Platform..." -ForegroundColor Green

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Verify Prerequisites
$PythonCmd = "python"
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        $PythonCmd = "py"
    } else {
        Write-Host "❌ Python is not installed or not in PATH. Please install Python 3.10+." -ForegroundColor Red
        exit 1
    }
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js/NPM is not installed or not in PATH. Please install Node.js." -ForegroundColor Red
    exit 1
}

# 2. Setup Backend
Write-Host "`n[1/4] Setting up Backend..." -ForegroundColor Cyan
Set-Location "$RootDir\backend"

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
    Write-Host "   Created backend/.env from .env.example" -ForegroundColor Yellow
}

$RunPython = $PythonCmd
$HasFastApi = & $PythonCmd -c "import fastapi, uvicorn, sqlalchemy, dotenv; print('ok')" 2>$null
if ($HasFastApi -ne "ok") {
    if (-not (Test-Path "venv\Scripts\python.exe")) {
        Write-Host "   Creating Python virtual environment..." -ForegroundColor Yellow
        & $PythonCmd -m venv venv
    }
    $RunPython = "$RootDir\backend\venv\Scripts\python.exe"
    $VenvPip = "$RootDir\backend\venv\Scripts\pip.exe"
    Write-Host "   Checking backend dependencies..." -ForegroundColor Yellow
    & $VenvPip install -q --disable-pip-version-check -r requirements.txt
}

Write-Host "   Initializing database & seed data..." -ForegroundColor Yellow
$env:PYTHONPATH = "$RootDir\backend"
$env:PYTHONIOENCODING = "utf-8"
& $RunPython -m app.seed

# 3. Setup Frontend
Write-Host "`n[2/4] Setting up Frontend..." -ForegroundColor Cyan
Set-Location "$RootDir\frontend"

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
    Write-Host "   Created frontend/.env from .env.example" -ForegroundColor Yellow
}

if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing frontend npm dependencies..." -ForegroundColor Yellow
    npm install
}

# 4. Launch Services
Write-Host "`n[3/4] Launching Backend on http://localhost:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\backend'; `$env:PYTHONPATH='$RootDir\backend'; `$env:PYTHONIOENCODING='utf-8'; & '$RunPython' -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "[4/4] Launching Frontend on http://localhost:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\frontend'; npm run dev -- --host"

Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "✅ KrishiConnect is running!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   🌾 Farmer Portal:       http://localhost:5173/" -ForegroundColor White
Write-Host "   🏢 Mandi Officer/Admin: http://localhost:5173/admin" -ForegroundColor White
Write-Host "   🔌 API Swagger Docs:    http://localhost:8000/docs" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
