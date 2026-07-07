# Windows PowerShell Setup Script
Write-Host "Setting up Laser Consumables E-Commerce Platform..." -ForegroundColor Green

# Check Node.js
Write-Host "`nChecking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found! Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "`nChecking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm not found!" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

# Generate Prisma Client
Write-Host "`nGenerating Prisma Client..." -ForegroundColor Yellow
npm run db:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to generate Prisma Client!" -ForegroundColor Red
    exit 1
}

# Check for .env file
Write-Host "`nChecking environment variables..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "`n⚠️  IMPORTANT: Please edit .env file with your configuration!" -ForegroundColor Red
    Write-Host "   - Set DATABASE_URL to your PostgreSQL connection string" -ForegroundColor Yellow
    Write-Host "   - Generate NEXTAUTH_SECRET (see SETUP.md)" -ForegroundColor Yellow
    Write-Host "   - Add your API keys (Stripe, ShipStation, Resend)" -ForegroundColor Yellow
} else {
    Write-Host ".env file exists" -ForegroundColor Green
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your configuration" -ForegroundColor White
Write-Host "2. Run: npm run db:push" -ForegroundColor White
Write-Host "3. Run: npm run db:seed" -ForegroundColor White
Write-Host "4. Run: npm run dev" -ForegroundColor White





