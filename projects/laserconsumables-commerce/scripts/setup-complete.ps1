# Complete setup script - sets up database and imports all products
# Run this after PostgreSQL is installed and running

Write-Host "`n🚀 Complete Setup - Database & Product Import`n" -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "✗ .env file not found!" -ForegroundColor Red
    Write-Host "Please run setup-postgres-docker.ps1 or setup-postgres-local.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Check DATABASE_URL
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "DATABASE_URL") {
    Write-Host "✗ DATABASE_URL not found in .env!" -ForegroundColor Red
    Write-Host "Please set up your database connection first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Generating Prisma Client..." -ForegroundColor Cyan
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma client generated" -ForegroundColor Green

Write-Host "`nStep 2: Pushing database schema..." -ForegroundColor Cyan
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to push schema. Check your database connection." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database schema created" -ForegroundColor Green

Write-Host "`nStep 3: Seeding database with admin user..." -ForegroundColor Cyan
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Seed failed (might be okay if admin already exists)" -ForegroundColor Yellow
} else {
    Write-Host "✓ Database seeded" -ForegroundColor Green
}

Write-Host "`nStep 4: Importing ALL products from Shopify export..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
npm run import:shopify
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Import failed. Check the error messages above." -ForegroundColor Red
    exit 1
}
Write-Host "✓ All products imported!" -ForegroundColor Green

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "`n🎉 Your website is ready!" -ForegroundColor Cyan
Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: npm run dev" -ForegroundColor Cyan
Write-Host "  2. Visit: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  3. Admin login: admin@laserconsumables.com / admin123" -ForegroundColor Cyan
Write-Host "`n💡 All your products should now be visible on the site!" -ForegroundColor Gray





