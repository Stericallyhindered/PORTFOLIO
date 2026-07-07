# 🚀 START HERE - Local Development Setup

Follow these simple steps to get the Bass Clown Co website running on your local machine:

## Prerequisites Check

1. **Bun installed?** 
   ```bash
   bun --version
   ```
   If not, install from: https://bun.sh/docs/installation

2. **Node.js installed?**
   ```bash
   node --version
   ```
   Need v18.17.0 or later.

## Setup Steps

### Step 1: Navigate to Project
```bash
cd "dev website"
```

### Step 2: Install Dependencies
```bash
bun install
```

### Step 3: Create Environment File

Create a `.env.local` file in the `dev website` folder with this minimum content:

```env
DATABASE_URL=your-database-url-here
NEXTAUTH_SECRET=generate-random-string-here
JWT_SECRET=generate-random-string-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**For quick testing, you can get a free PostgreSQL database from Neon:**
1. Go to https://neon.tech
2. Sign up (free)
3. Create a new project
4. Copy the connection string
5. Paste it as `DATABASE_URL` in `.env.local`

**Or use local PostgreSQL:**
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/bassclown
```

### Step 4: Set Up Database
```bash
bun run create-admin
```

This creates the admin user:
- **Email**: `david@solheim.tech`
- **Password**: `bassclown25`

### Step 5: Start Development Server
```bash
bun dev
```

### Step 6: Open Browser
Go to: **http://localhost:3000**

### Step 7: Log In
- Email: `david@solheim.tech`
- Password: `bassclown25`

## What You Can Do Now

✅ Explore the admin dashboard: http://localhost:3000/admin
✅ Create contests and giveaways
✅ Test user registration and features
✅ Explore brand collaboration tools
✅ Check out all the features we built!

## Quick Commands Reference

```bash
# Install dependencies
bun install

# Set up database and admin user
bun run create-admin

# Start development server
bun dev

# Build for production
bun run build

# Start production server
bun start
```

## Troubleshooting

**Port 3000 already in use?**
- Kill the process: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
- Or use different port: `PORT=3001 bun dev`

**Database connection error?**
- Check your `DATABASE_URL` in `.env.local`
- Make sure PostgreSQL is running (if using local)
- Verify network access (if using cloud database)

**Module not found?**
```bash
rm -rf node_modules .next
bun install
```

## Need More Help?

See `LOCAL_SETUP.md` for detailed troubleshooting guide.

