# Restore Production Data Guide

This guide will help you restore the production database and blob files from the working dev site to finish building the new site.

## Overview

You have:
1. **Database Dump**: `bass-clown-database.2025.08.07.dump` - Full PostgreSQL database backup
2. **Vercel Blob Backup**: `vercel blob backup/` folder with 7 videos and 7 photos

## Step-by-Step Process

### Step 1: Restore Database to Neon

**Important Decision**: Are you restoring to:
- **Production Neon DB** (your live production database)?
- **Development Neon DB** (a separate dev/staging database)?

#### Option A: Restore to Production (if you're taking over the same database)

1. Go to Neon Console: https://console.neon.tech
2. Select your production project
3. Open SQL Editor
4. **Backup current state first** (if there's important data):
   - Use Neon's backup feature or export current schema

5. Restore the dump:
   ```bash
   # If you have pg_restore installed locally:
   pg_restore -h <your-neon-host> \
              -U <your-neon-user> \
              -d <your-neon-database> \
              --clean \
              --if-exists \
              --verbose \
              "C:\Users\matt\Desktop\bassclown\bass-clown-database.2025.08.07.dump"
   ```

   Or use Neon's import feature if available.

#### Option B: Extract SQL and run in Neon Console

If pg_restore doesn't work, extract to SQL first:
```bash
pg_restore --clean --if-exists -f extracted-database.sql "bass-clown-database.2025.08.07.dump"
```

Then paste the SQL into Neon's SQL Editor.

### Step 2: Upload Blob Files to Vercel Blob

1. **Get your Vercel Blob token**:
   - Go to: https://vercel.com/dashboard/stores
   - Select your blob store
   - Copy the "Read and Write" token

2. **Set environment variable**:
   ```bash
   # In PowerShell:
   $env:BLOB_READ_WRITE_TOKEN="your-token-here"
   ```

3. **Run the upload script**:
   ```bash
   cd "dev website"
   node scripts/upload-blobs-to-vercel.js
   ```

   This will:
   - Upload all videos from `vercel blob backup/blobs/videos/`
   - Upload all photos from `vercel blob backup/blobs/photos/`
   - Save results to `blob-upload-results.json`

### Step 3: Update Database URLs (if needed)

If the blob URLs changed after upload, update the database:

```bash
# Make sure DATABASE_URL is set
$env:DATABASE_URL="your-neon-connection-string"

# Run the update script
node scripts/update-database-urls.js
```

This updates:
- `portfolio_videos.video_url` entries
- Any contest/giveaway images pointing to blobs

### Step 4: Verify Everything Works

1. **Check database**:
   ```sql
   -- In Neon SQL Editor:
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM contests;
   SELECT COUNT(*) FROM portfolio_videos;
   SELECT COUNT(*) FROM giveaways;
   ```

2. **Check blob URLs**:
   ```sql
   SELECT title, video_url FROM portfolio_videos LIMIT 5;
   ```

3. **Test locally**:
   ```bash
   npm run dev
   ```

   Visit:
   - http://localhost:3000/our-work (should show videos)
   - http://localhost:3000/content-contests (should show contests)
   - http://localhost:3000/giveaways (should show giveaways)

### Step 5: Test Build Locally

```bash
npm run build
```

Fix any issues before pushing.

### Step 6: Push to Main

Once everything works locally:

```bash
git add .
git commit -m "Restore production data - database and blob files"
git push origin main
```

Vercel will automatically deploy.

## Verification Checklist

- [ ] Database restored (all tables have data)
- [ ] Blob files uploaded (check Vercel dashboard)
- [ ] Database URLs updated (if blob URLs changed)
- [ ] Local dev site shows videos/images
- [ ] Local build succeeds
- [ ] Pushed to GitHub main
- [ ] Production site works after deploy

## Troubleshooting

**Database restore fails**:
- Check Neon connection string
- Ensure you have proper permissions
- Try extracting SQL first and running manually

**Blob upload fails**:
- Verify `BLOB_READ_WRITE_TOKEN` is correct
- Check file paths are correct
- Ensure you have write access to Vercel Blob store

**URLs don't match**:
- Check `blob-upload-results.json` for actual URLs
- Run `update-database-urls.js` script
- Manually verify URLs in database

## Notes

- The database dump includes ALL production data (users, contests, submissions, etc.)
- The blob backup has 7 videos and 7 photos with metadata
- Original blob URLs are preserved in `.meta.json` files
- After upload, new URLs may be different - the script handles this

