# Restore Production Database to Neon

## Option 1: Using Neon Console (Recommended)

1. Go to your Neon project console: https://console.neon.tech
2. Navigate to your database
3. Open the SQL Editor
4. **IMPORTANT**: Make sure you're connected to the PRODUCTION database you want to restore to

### Steps:

1. **Backup current database first** (optional but recommended):
   ```sql
   -- Export current state before restoring
   ```

2. **Restore the database dump**:
   - Go to Neon Dashboard > Your Project > SQL Editor
   - The dump file is: `bass-clown-database.2025.08.07.dump`
   - This is a PostgreSQL custom format dump (pg_dump with -Fc)
   - You'll need to use `pg_restore` command line tool OR
   - If Neon supports it, you can restore via their console

3. **If using command line pg_restore**:
   ```bash
   pg_restore -h <neon-host> -U <neon-user> -d <neon-database> --verbose "bass-clown-database.2025.08.07.dump"
   ```

4. **If Neon doesn't support direct restore**, you may need to:
   - Extract SQL from the dump first
   - Then run the SQL in Neon's SQL Editor

## Option 2: Manual SQL Import (if dump extraction needed)

If you need to extract SQL from the dump:
```bash
pg_restore --clean --if-exists -f extracted.sql "bass-clown-database.2025.08.07.dump"
```

Then paste the SQL into Neon's SQL Editor.

## Verify Restore

After restore, verify:
```sql
-- Check users table
SELECT COUNT(*) FROM users;

-- Check contests table
SELECT COUNT(*) FROM contests;

-- Check portfolio_videos table
SELECT COUNT(*) FROM portfolio_videos;

-- Check giveaways table
SELECT COUNT(*) FROM giveaways;
```

