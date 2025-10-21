# Start Django Backend (Windows)

# This script starts the Django development server on Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Django Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to django-backend directory
$BackendPath = Join-Path $PSScriptRoot ".." "packages" "django-backend"
Set-Location $BackendPath

Write-Host "📁 Working Directory: $BackendPath" -ForegroundColor Yellow
Write-Host ""

# Check Python version
Write-Host "🐍 Checking Python..." -ForegroundColor Green
python --version

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if virtual environment should be used
if (Test-Path "venv") {
    Write-Host "🔧 Activating virtual environment..." -ForegroundColor Green
    .\venv\Scripts\Activate.ps1
    Write-Host ""
}

# Install dependencies if needed
Write-Host "📦 Checking dependencies..." -ForegroundColor Green
pip show django | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚙️  Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    Write-Host ""
}

# Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Green
python manage.py migrate --no-input

Write-Host ""

# Collect static files (suppress warnings)
Write-Host "📂 Collecting static files..." -ForegroundColor Green
python manage.py collectstatic --no-input --clear 2>&1 | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Django Server Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 Server URL: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "  📋 API Docs:   http://127.0.0.1:8000/" -ForegroundColor Cyan
Write-Host "  💊 Health:     http://127.0.0.1:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Start the server
python manage.py runserver
