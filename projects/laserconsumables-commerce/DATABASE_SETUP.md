# Database Setup Guide

## Quick Options

### Option 1: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/windows/
   - Or use installer: https://www.postgresql.org/download/windows/
   - Default port: 5432

2. **Create Database**
   ```sql
   CREATE DATABASE laserconsumables;
   ```

3. **Update .env**
   ```
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/laserconsumables?schema=public"
   ```
   Replace `yourpassword` with your PostgreSQL password

4. **Push Schema**
   ```bash
   npm run db:push
   npm run db:seed
   ```

### Option 2: Cloud Database (Easiest - No Installation)

**Supabase (Free Tier)**
1. Go to https://supabase.com
2. Create account and new project
3. Copy connection string from Settings > Database
4. Update DATABASE_URL in .env
5. Run: `npm run db:push` and `npm run db:seed`

**Neon (Free Tier)**
1. Go to https://neon.tech
2. Create account and new project
3. Copy connection string
4. Update DATABASE_URL in .env
5. Run: `npm run db:push` and `npm run db:seed`

**Railway (Free Tier)**
1. Go to https://railway.app
2. Create account and new PostgreSQL database
3. Copy connection string
4. Update DATABASE_URL in .env
5. Run: `npm run db:push` and `npm run db:seed`

### Option 3: Docker PostgreSQL

```bash
docker run --name postgres-laser -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=laserconsumables -p 5432:5432 -d postgres
```

Then update .env:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/laserconsumables?schema=public"
```

## After Database Setup

1. **Push Schema**
   ```bash
   npm run db:push
   ```

2. **Seed Database**
   ```bash
   npm run db:seed
   ```

3. **Default Admin Login**
   - Email: `admin@laserconsumables.com`
   - Password: `admin123`
   - ⚠️ Change this immediately in production!

4. **Start Dev Server**
   ```bash
   npm run dev
   ```

## Verify Database Connection

```bash
npm run db:studio
```

This opens Prisma Studio where you can view/edit your database visually.





