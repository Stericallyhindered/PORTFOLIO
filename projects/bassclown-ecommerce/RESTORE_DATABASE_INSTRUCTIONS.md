# Restore Database from Dump File - Instructions

Since the dump file is in PostgreSQL custom format (`.dump`), you need `pg_restore` to extract SQL.

## Option 1: Use Neon Console (Easiest)

Neon Console may support importing dump files directly:

1. Go to: https://console.neon.tech
2. Select your project
3. Look for an "Import" or "Restore" option
4. Upload: `bass-clown-database.2025.08.07.dump`

## Option 2: Install PostgreSQL Client Tools

### Windows - Download PostgreSQL

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. During installation, make sure "Command Line Tools" is selected
3. After installation, `pg_restore` will be available in: `C:\Program Files\PostgreSQL\<version>\bin\`
4. Add it to your PATH or use full path

### Then Extract SQL:

```powershell
cd "C:\Users\matt\Desktop\bassclown"
& "C:\Program Files\PostgreSQL\<version>\bin\pg_restore.exe" --clean --if-exists -f extracted-database.sql "bass-clown-database.2025.08.07.dump"
```

Then paste `extracted-database.sql` into Neon SQL Editor.

## Option 3: Use Docker (If Docker Desktop is Running)

```powershell
# Start Docker Desktop first, then:
cd "C:\Users\matt\Desktop\bassclown"
docker run --rm -v "${PWD}:/data" -w /data postgres:17 pg_restore --clean --if-exists -f extracted-database.sql "bass-clown-database.2025.08.07.dump"
```

## Option 4: Manual SQL Generation

Since the dump is in binary format, extracting all data manually is not practical. 

**The database already has the correct schema** (all 33 tables exist). What we need is the **production data** (contests, giveaways, users, etc.) from the dump.

If you can't use pg_restore, you would need to:
1. Manually check what data exists in the production site
2. Recreate contests, giveaways, and other data manually via the admin panel

## Current Status

✅ **Completed:**
- All blob files uploaded (7 videos, 7 photos)
- Portfolio video URLs updated to match uploaded files
- Database schema exists (33 tables)

❌ **Still Needed:**
- Production data from dump file (contests, giveaways, users, etc.)
