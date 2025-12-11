# Quick Database Switch Script
# Switches between Cloud (PostgreSQL) and Local (SQLite) databases

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DATABASE SWITCHING UTILITY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$envFile = ".env"
$backupFile = ".env.backup"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Creating default .env file..." -ForegroundColor Yellow
    @"
# Database Configuration
# Comment/uncomment the line below to switch databases

# Cloud Database (PostgreSQL - Neon)
NEON_DATABASE_URL=your_neon_url_here

# If NEON_DATABASE_URL is empty or commented, SQLite will be used automatically

# Cloudinary (for profile pictures)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Encryption (IMPORTANT: Set this in production!)
# ENCRYPTION_KEY=
"@ | Out-File -FilePath $envFile -Encoding utf8
    Write-Host "✅ Created .env file. Please configure it first." -ForegroundColor Green
    exit
}

# Backup current .env
Copy-Item $envFile $backupFile -Force
Write-Host "✅ Backed up current .env to .env.backup" -ForegroundColor Green

# Read current .env
$envContent = Get-Content $envFile -Raw

# Check current state
if ($envContent -match '(?m)^NEON_DATABASE_URL=.+$') {
    $currentMode = "CLOUD"
} elseif ($envContent -match '(?m)^#\s*NEON_DATABASE_URL=') {
    $currentMode = "LOCAL"
} else {
    $currentMode = "UNKNOWN"
}

Write-Host "`nCurrent Mode: " -NoNewline
if ($currentMode -eq "CLOUD") {
    Write-Host "☁️  CLOUD (PostgreSQL)" -ForegroundColor Blue
} elseif ($currentMode -eq "LOCAL") {
    Write-Host "💾 LOCAL (SQLite)" -ForegroundColor Green
} else {
    Write-Host "⚠️  UNKNOWN" -ForegroundColor Yellow
}

Write-Host "`nSwitch to:" -ForegroundColor Cyan
Write-Host "1. 💾 Local Database (SQLite)" -ForegroundColor Green
Write-Host "2. ☁️  Cloud Database (PostgreSQL)" -ForegroundColor Blue
Write-Host "3. ❌ Cancel" -ForegroundColor Red

$choice = Read-Host "`nEnter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n🔄 Switching to LOCAL database (SQLite)..." -ForegroundColor Yellow
        
        # Comment out NEON_DATABASE_URL
        $newContent = $envContent -replace '(?m)^NEON_DATABASE_URL=', '# NEON_DATABASE_URL='
        $newContent | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
        
        Write-Host "✅ Switched to LOCAL SQLite database" -ForegroundColor Green
        Write-Host "`nDatabase will be at: backend\db.sqlite3" -ForegroundColor Cyan
        
        # Check database
        Write-Host "`nChecking database..." -ForegroundColor Yellow
        venv\Scripts\python.exe check_db.py
    }
    "2" {
        Write-Host "`n🔄 Switching to CLOUD database (PostgreSQL)..." -ForegroundColor Yellow
        
        # Uncomment NEON_DATABASE_URL
        $newContent = $envContent -replace '(?m)^#\s*NEON_DATABASE_URL=', 'NEON_DATABASE_URL='
        $newContent | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
        
        Write-Host "✅ Switched to CLOUD PostgreSQL database" -ForegroundColor Green
        Write-Host "`nMake sure NEON_DATABASE_URL is configured in .env" -ForegroundColor Cyan
        
        # Check database
        Write-Host "`nChecking database..." -ForegroundColor Yellow
        venv\Scripts\python.exe check_db.py
    }
    "3" {
        Write-Host "`n❌ Cancelled. No changes made." -ForegroundColor Red
        exit
    }
    default {
        Write-Host "`n❌ Invalid choice!" -ForegroundColor Red
        exit
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANT: Restart Django server for changes to take effect!" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
