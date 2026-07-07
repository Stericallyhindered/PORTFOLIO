# PowerShell script to set up PostgreSQL locally for offline development
# This script will download and install PostgreSQL if not already installed

Write-Host "`n🚀 Setting up PostgreSQL locally for offline development...`n" -ForegroundColor Green

# Check if PostgreSQL is already installed
$pgPath = "C:\Program Files\PostgreSQL"
if (Test-Path $pgPath) {
    Write-Host "✓ PostgreSQL appears to be installed at $pgPath" -ForegroundColor Green
    Write-Host "`nPlease run these commands manually:" -ForegroundColor Yellow
    Write-Host "  1. Create database: createdb laserconsumables" -ForegroundColor Cyan
    Write-Host "  2. Or use pgAdmin to create database 'laserconsumables'" -ForegroundColor Cyan
    Write-Host "`nThen update .env with:" -ForegroundColor Yellow
    Write-Host '  DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/laserconsumables?schema=public"' -ForegroundColor Cyan
    exit 0
}

Write-Host "PostgreSQL not found. Installing..." -ForegroundColor Yellow
Write-Host "`n📥 Downloading PostgreSQL installer..." -ForegroundColor Cyan

# Download PostgreSQL installer
$postgresUrl = "https://get.enterprisedb.com/postgresql/postgresql-16.1-1-windows-x64.exe"
$installerPath = "$env:TEMP\postgresql-installer.exe"

try {
    Invoke-WebRequest -Uri $postgresUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "✓ Download complete" -ForegroundColor Green
} catch {
    Write-Host "✗ Download failed. Please download manually from:" -ForegroundColor Red
    Write-Host "  https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "`nOr use Docker instead (if installed):" -ForegroundColor Yellow
    Write-Host "  docker run --name postgres-laser -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=laserconsumables -p 5432:5432 -d postgres" -ForegroundColor Cyan
    exit 1
}

Write-Host "`n⚠️  IMPORTANT: Manual installation required!" -ForegroundColor Yellow
Write-Host "`nThe installer will open. Please:" -ForegroundColor Cyan
Write-Host "  1. Click 'Next' through the wizard" -ForegroundColor White
Write-Host "  2. Set password to: postgres (or remember your password)" -ForegroundColor White
Write-Host "  3. Port: 5432 (default)" -ForegroundColor White
Write-Host "  4. Locale: Default" -ForegroundColor White
Write-Host "  5. Complete installation" -ForegroundColor White
Write-Host "`nAfter installation, this script will continue..." -ForegroundColor Yellow
Write-Host "`nStarting installer..." -ForegroundColor Cyan

Start-Process -FilePath $installerPath -Wait

Write-Host "`n✓ Installation complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Create database 'laserconsumables' using pgAdmin or command line" -ForegroundColor Cyan
Write-Host "  2. Update .env file with your database connection string" -ForegroundColor Cyan
Write-Host "  3. Run: npm run db:push" -ForegroundColor Cyan
Write-Host "  4. Run: npm run import:shopify" -ForegroundColor Cyan





