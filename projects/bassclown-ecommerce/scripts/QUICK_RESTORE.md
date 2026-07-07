# Quick Restore Guide

Restore production data in 3 steps:

## Step 1: Restore Database to Neon

1. Go to: https://console.neon.tech
2. Select your project
3. Open SQL Editor
4. Use `pg_restore` OR extract SQL from dump:

```bash
# Option A: Direct restore (if you have pg_restore)
pg_restore -h <neon-host> -U <neon-user> -d <neon-db> --clean "C:\Users\matt\Desktop\bassclown\bass-clown-database.2025.08.07.dump"

# Option B: Extract to SQL first (if pg_restore doesn't work)
pg_restore --clean --if-exists -f extracted.sql "C:\Users\matt\Desktop\bassclown\bass-clown-database.2025.08.07.dump"
# Then paste extracted.sql into Neon SQL Editor
```

## Step 2: Upload Blob Files to Vercel

1. Get your Vercel Blob token: https://vercel.com/dashboard/stores
2. Set environment variable:
   ```powershell
   $env:BLOB_READ_WRITE_TOKEN="your-token"
   ```
3. Run upload:
   ```bash
   cd "dev website"
   npm run upload-blobs
   ```

## Step 3: Update Database URLs (if needed)

```bash
# Set DATABASE_URL if not already set
$env:DATABASE_URL="your-neon-connection-string"

# Update URLs
npm run update-blob-urls
```

## Verify

1. Test locally:
   ```bash
   npm run dev
   ```
   Visit: http://localhost:3000/our-work (should show videos)

2. Test build:
   ```bash
   npm run build
   ```

3. Push to main:
   ```bash
   git add .
   git commit -m "Restore production data"
   git push origin main
   ```

Done! 🎉

