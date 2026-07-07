# 🚀 Quick Run Guide

## To Run the Website Right Now:

### Option 1: Using npm (if Bun not installed)

```bash
# Navigate to project
cd "dev website"

# Install dependencies (if not done)
npm install

# Create admin user (if not done)
npm run create-admin:node

# Start server
npm run dev
```

### Option 2: Using Bun (if installed)

```bash
cd "dev website"
bun install
bun run create-admin
bun dev
```

## ⚠️ Before Running - Required Setup:

### 1. Create `.env.local` file

Copy `ENV_TEMPLATE.txt` to `.env.local`:

```bash
copy ENV_TEMPLATE.txt .env.local
```

### 2. Edit `.env.local` and add:

**REQUIRED:**
```
DATABASE_URL=your-postgresql-connection-string
NEXTAUTH_SECRET=any-random-string-here
JWT_SECRET=any-random-string-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Get free database:**
- Go to https://neon.tech
- Sign up (free)
- Create project
- Copy connection string
- Paste as `DATABASE_URL`

## After Server Starts:

1. **Open browser**: http://localhost:3000
2. **Log in**: 
   - Email: `david@solheim.tech`
   - Password: `bassclown25`

## Server Status

The server is running in the background. Check your terminal for output!

If you see errors:
- Check `.env.local` has `DATABASE_URL` configured
- Run `npm run create-admin:node` to set up database
- Restart server: `npm run dev`

## What's Available?

✅ **Homepage**: http://localhost:3000
✅ **Login**: http://localhost:3000/login  
✅ **Admin Dashboard**: http://localhost:3000/admin (after login)
✅ **Brand Dashboard**: http://localhost:3000/brand (after login)
✅ **Contests**: http://localhost:3000/contests
✅ **Giveaways**: http://localhost:3000/dashboard/giveaways

Enjoy exploring! 🎣

