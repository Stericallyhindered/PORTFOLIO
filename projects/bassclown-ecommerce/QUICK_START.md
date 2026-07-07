# Quick Start Guide - Local Development

## Step-by-Step Setup

### 1. Navigate to Project Directory
```bash
cd "dev website"
```

### 2. Create Environment File
```bash
# Copy the example file
copy .env.example .env.local
```

Then edit `.env.local` and add your `DATABASE_URL`. You can use:
- **Neon PostgreSQL** (cloud - recommended): Sign up at https://neon.tech and get your connection string
- **Local PostgreSQL**: `postgresql://postgres:password@localhost:5432/bassclown`

**Minimum required for local dev:**
```
DATABASE_URL=your-database-connection-string
NEXTAUTH_SECRET=any-random-string-here
JWT_SECRET=any-random-string-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
bun install
```

### 4. Set Up Database
```bash
bun run create-admin
```

This creates:
- Database tables
- Admin user with email: `david@solheim.tech` and password: `bassclown25`

### 5. Start Development Server
```bash
bun dev
```

### 6. Open Browser
Navigate to: **http://localhost:3000**

### 7. Log In
- Email: `david@solheim.tech`
- Password: `bassclown25`

## That's It! 🎉

You can now explore:
- Admin dashboard: http://localhost:3000/admin
- Brand dashboard: http://localhost:3000/brand
- Contests: http://localhost:3000/contests
- Giveaways: http://localhost:3000/dashboard/giveaways
- And all other features!

## Need Help?

See `LOCAL_SETUP.md` for detailed troubleshooting and setup options.

