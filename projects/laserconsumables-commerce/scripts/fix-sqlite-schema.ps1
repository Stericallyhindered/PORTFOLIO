# Fix Prisma schema for SQLite compatibility
# SQLite doesn't support: enums, Json type, String arrays, @db.Text

Write-Host "Fixing Prisma schema for SQLite compatibility...`n" -ForegroundColor Cyan

$schemaFile = "prisma\schema.prisma"
$content = Get-Content $schemaFile -Raw

# Remove all @db.Text annotations
$content = $content -replace ' @db\.Text', ''

# Replace enums with String types
$content = $content -replace 'enum UserRole \{[^}]+\}', ''
$content = $content -replace 'UserRole', 'String'
$content = $content -replace 'role\s+String\s+@default\(CUSTOMER\)', 'role          String   @default("CUSTOMER")'

$content = $content -replace 'enum OrderStatus \{[^}]+\}', ''
$content = $content -replace 'OrderStatus', 'String'
$content = $content -replace 'status\s+String\s+@default\(PENDING\)', 'status          String   @default("PENDING")'

$content = $content -replace 'enum PaymentStatus \{[^}]+\}', ''
$content = $content -replace 'PaymentStatus', 'String'
$content = $content -replace 'paymentStatus\s+String\s+@default\(PENDING\)', 'paymentStatus   String   @default("PENDING")'

$content = $content -replace 'enum ShipmentStatus \{[^}]+\}', ''
$content = $content -replace 'ShipmentStatus', 'String'
$content = $content -replace 'status\s+String\s+@default\(PENDING\)', 'status            String   @default("PENDING")'

# Replace String[] with String (store as JSON string)
$content = $content -replace 'variables\s+String\[\]', 'variables   String   // JSON string array'

# Replace Json type with String
$content = $content -replace 'data\s+Json\?', 'data      String?    // JSON string'

Set-Content $schemaFile $content

Write-Host "Schema fixed! Now run: npm run db:push" -ForegroundColor Green





