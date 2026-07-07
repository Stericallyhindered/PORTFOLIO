# Local Development Setup Guide

This guide will help you set up and run the Bass Clown Co website on your local machine.

## Prerequisites

Before starting, ensure you have the following installed:

- **Bun** (v1.0 or later) - [Install Bun](https://bun.sh/docs/installation)
- **Node.js** (18.17.0 or later) - [Download Node.js](https://nodejs.org/)
- **PostgreSQL Database** - Either:
  - Local PostgreSQL installation
  - Neon PostgreSQL (cloud database) - [Sign up free](https://neon.tech/)
  - Docker PostgreSQL container

## Quick Start

### Step 1: Navigate to Project Directory

```bash
cd "dev website"
```

### Step 2: Install Dependencies

```bash
bun install
```

### Step 3: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in your actual values:
   - **DATABASE_URL**: Your PostgreSQL connection string
   - **NEXTAUTH_SECRET**: Generate a random secret (you can use: `openssl rand -base64 32`)
   - **JWT_SECRET**: Generate another random secret
   - Other optional services (Stripe, Resend, etc.) can be configured later

### Step 4: Set Up Database

Run the database setup script to create tables and admin user:

```bash
bun run create-admin
```

This will:
- Create the users table (and other tables via migrations if needed)
- Create an admin user with credentials:
  - **Email**: `david@solheim.tech`
  - **Password**: `bassclown25`

### Step 5: Start Development Server

```bash
bun dev
```

The server will start on **http://localhost:3000**

## Database Options

### Option 1: Neon PostgreSQL (Cloud - Recommended for Quick Start)

1. Sign up at [neon.tech](https://neon.tech/)
2. Create a new project
3. Copy the connection string
4. Paste it as `DATABASE_URL` in your `.env.local`

Example format:
```
DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require
```

### Option 2: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database:
   ```sql
   CREATE DATABASE bassclown;
   ```
3. Set DATABASE_URL in `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/bassclown
   ```

### Option 3: Docker PostgreSQL

```bash
docker run --name bassclown-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=bassclown \
  -p 5432:5432 \
  -d postgres:15
```

Then use:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/bassclown
```

## Running Database Migrations

If you need to run database migrations manually:

```bash
# Using Drizzle Kit
bunx drizzle-kit migrate
```

Or use the migration API endpoint (requires admin login):
```
POST http://localhost:3000/api/admin/migrations
```

## Accessing the Application

Once running, you can access:

- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Admin Dashboard**: http://localhost:3000/admin (after logging in as admin)
- **Brand Dashboard**: http://localhost:3000/brand (after logging in as brand user)

### Default Admin Credentials

After running `bun run create-admin`:
- **Email**: `david@solheim.tech`
- **Password**: `bassclown25`

**⚠️ Important**: Change these credentials in production!

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill the process using port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 bun dev
```

### Database Connection Errors

1. Verify your `DATABASE_URL` is correct
2. Check if PostgreSQL is running
3. Verify network access (for cloud databases)
4. Check SSL mode settings

### Module Not Found Errors

Clear cache and reinstall:

```bash
rm -rf node_modules .next
bun install
```

### Build Errors

Check TypeScript errors:

```bash
bun run build
```

Ignore TypeScript errors during development (they're set to ignore in next.config.js for now).

## Development Tips

### Hot Reload

The development server automatically reloads when you make changes. No need to restart!

### API Routes

All API routes are available at `http://localhost:3000/api/*`

### Database Schema

The database schema is defined in `lib/db/schema.ts`. Use Drizzle Kit to push changes:

```bash
bunx drizzle-kit push
```

### Testing Features

- **Contests**: Create contests via admin panel
- **Giveaways**: Create giveaways via admin panel  
- **User Management**: Manage users via admin panel
- **Brand Features**: Login as brand user to access brand dashboard
- **Media Kits**: Create media kits from user dashboard
- **File Uploads**: Test file uploads (requires Vercel Blob token or mock)

## Optional Services Setup

### Stripe (for payments)

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get test API keys from the dashboard
3. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Resend (for emails)

1. Create a Resend account at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_...
   ```

Without these, the app will still run but certain features (payments, emails) won't work.

## Next Steps

1. ✅ Server running on http://localhost:3000
2. ✅ Log in with admin credentials
3. ✅ Explore the admin dashboard
4. ✅ Create test contests and giveaways
5. ✅ Test user registration and features
6. ✅ Review all implemented features

## Need Help?

Check the main README.md for more detailed information about the project structure and features.

