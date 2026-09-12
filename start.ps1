# =============================================================================
# KrishiConnect PowerShell Launcher (Cross-Platform / Windows & WSL)
# =============================================================================
Write-Host "Starting KrishiConnect Smart Agricultural Platform..." -ForegroundColor Green

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Verify Prerequisites
if (-not (Get-Command python -ErrorAction SilentlyContinue) -and -not (Get-Command py -ErrorAction SilentlyContinue) -and -not (Get-Command python3 -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Python is not installed or not in PATH. Please install Python 3.10+." -ForegroundColor Red
    exit 1
}

# Determine package manager (enforce pnpm first)
$PkgMgr = "pnpm"
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $PkgMgr = "npm"
    } else {
        Write-Host "[ERROR] Neither pnpm nor npm was found in PATH." -ForegroundColor Red
        exit 1
    }
}

# 2. Setup Backend
Write-Host ""
Write-Host "[1/4] Setting up Backend..." -ForegroundColor Cyan
Set-Location "$RootDir\backend"

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
    Write-Host "   Created backend/.env from .env.example" -ForegroundColor Yellow
}

# Detect virtual environment (local or shared parent)
$VenvPython = "$RootDir\backend\venv\Scripts\python.exe"
$VenvPip = "$RootDir\backend\venv\Scripts\pip.exe"

if (-not (Test-Path $VenvPython)) {
    $ParentPython = "$RootDir\..\backend\venv\Scripts\python.exe"
    $ParentPip = "$RootDir\..\backend\venv\Scripts\pip.exe"
    if (Test-Path $ParentPython) {
        Write-Host "   Using existing Python virtual environment from parent backend\venv..." -ForegroundColor Yellow
        $VenvPython = $ParentPython
        $VenvPip = $ParentPip
    } else {
        Write-Host "   Creating Python virtual environment..." -ForegroundColor Yellow
        python -m venv venv
    }
}

Write-Host "   Checking backend dependencies..." -ForegroundColor Yellow
& $VenvPip install -q --disable-pip-version-check -r requirements.txt

Write-Host "   Initializing database and seed data..." -ForegroundColor Yellow
& $VenvPython -c "import asyncio; from app.database import init_db; from app.seed import seed; asyncio.run(init_db()); asyncio.run(seed())"

# 3. Setup Frontend
Write-Host ""
Write-Host "[2/4] Setting up Frontend..." -ForegroundColor Cyan
Set-Location "$RootDir\frontend"

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
    Write-Host "   Created frontend/.env from .env.example" -ForegroundColor Yellow
}

if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing frontend dependencies using $PkgMgr..." -ForegroundColor Yellow
    & $PkgMgr install
}

# 4. Launch Services
Write-Host ""
Write-Host "[3/4] Launching Backend on http://localhost:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootDir\backend'; & '$VenvPython' run.py"

Write-Host "[4/4] Launching Frontend with $PkgMgr on http://localhost:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootDir\frontend'; & '$PkgMgr' dev"

Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "KrishiConnect is running!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   Farmer Portal:       http://localhost:5173/" -ForegroundColor White
Write-Host "   Mandi Officer/Admin: http://localhost:5173/admin" -ForegroundColor White
Write-Host "   API Swagger Docs:    http://localhost:8000/docs" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
