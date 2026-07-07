# 🚀 Setup Instructions for Local Development

## Prerequisites

You need **Bun** installed. If you don't have it:

### Install Bun (Windows)
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Or visit: https://bun.sh/docs/installation

### Alternative: Use npm/node
If you prefer npm, you can use:
```bash
npm install
npm run dev
```
(But some scripts are optimized for Bun)

## Quick Setup Steps

### 1. Navigate to the project directory
```bash
cd "dev website"
```

### 2. Create environment file
Copy the environment template:
```bash
copy ENV_TEMPLATE.txt .env.local
```

Then edit `.env.local` and add:
- **DATABASE_URL**: Your PostgreSQL connection string (get free one from https://neon.tech)
- **NEXTAUTH_SECRET**: Any random string
- **JWT_SECRET**: Any random string  
- **NEXT_PUBLIC_BASE_URL**: http://localhost:3000

### 3. Install dependencies
```bash
bun install
```

If bun is not available, use:
```bash
npm install
```

### 4. Set up database and admin user
```bash
bun run create-admin
```

Or with npm:
```bash
npm run create-admin
```

This creates:
- Admin email: `david@solheim.tech`
- Admin password: `bassclown25`

### 5. Start development server
```bash
bun dev
```

Or with npm:
```bash
npm run dev
```

### 6. Open browser
Go to: **http://localhost:3000**

### 7. Log in
- Email: `david@solheim.tech`
- Password: `bassclown25`

## Getting a Database

### Option 1: Neon PostgreSQL (Recommended - Free)
1. Go to https://neon.tech
2. Sign up for free account
3. Create a new project
4. Copy the connection string
5. Paste it as `DATABASE_URL` in `.env.local`

### Option 2: Local PostgreSQL
1. Install PostgreSQL on Windows
2. Create database: `CREATE DATABASE bassclown;`
3. Use: `postgresql://postgres:yourpassword@localhost:5432/bassclown`

## What You Can Explore

✅ **Admin Dashboard**: http://localhost:3000/admin
- Manage users, contests, giveaways
- View analytics and reports
- Process refunds
- Manage backups
- View audit logs

✅ **Brand Dashboard**: http://localhost:3000/brand
- Brand analytics
- Create contests
- Brand collaborations

✅ **User Features**:
- Contests: http://localhost:3000/contests
- Giveaways: http://localhost:3000/dashboard/giveaways
- Media Kits: http://localhost:3000/dashboard/media-kits
- Profile: http://localhost:3000/dashboard/profile

## Troubleshooting

### Bun not found
Install Bun: `powershell -c "irm bun.sh/install.ps1 | iex"`
Or use npm: `npm install && npm run dev`

### Port 3000 in use
```bash
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
PORT=3001 bun dev
```

### Database connection error
- Check your `DATABASE_URL` in `.env.local`
- Verify database is accessible
- For Neon: Make sure connection string is correct

### Module not found
```bash
rm -rf node_modules .next
bun install
# or
npm install
```

## All Available Commands

```bash
# Development
bun dev              # Start dev server
bun run build        # Build for production
bun start            # Start production server

# Setup
bun install          # Install dependencies
bun run create-admin # Set up database and admin user
bun run setup        # Install + create admin (one command)

# Utilities
bun run lint         # Check code quality
```

## Next Steps

1. ✅ Server running on http://localhost:3000
2. ✅ Explore admin dashboard
3. ✅ Create test contests and giveaways
4. ✅ Test all features
5. ✅ Review the codebase

Enjoy exploring the Bass Clown Co platform! 🎣

