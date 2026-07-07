# 🚀 Running the Website

The development server is starting! Here's what to expect:

## Server Status

The server should be starting at: **http://localhost:3000**

## First Time Setup

### 1. Set Up Environment Variables

Make sure your `.env.local` file has at minimum:

```env
DATABASE_URL=your-postgresql-connection-string
NEXTAUTH_SECRET=any-random-string
JWT_SECRET=any-random-string
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Get a free database from: https://neon.tech**

### 2. Set Up Database (if not done yet)

After the server starts, in a new terminal run:

```bash
cd "dev website"
npm run create-admin:node
```

This creates:
- Admin email: `david@solheim.tech`
- Admin password: `bassclown25`

### 3. Access the Website

Open your browser and go to:
- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Admin Dashboard**: http://localhost:3000/admin (after login)

## Commands Reference

```bash
# Start development server
npm run dev

# Set up database and admin user
npm run create-admin:node

# Build for production
npm run build

# Start production server
npm run start
```

## Troubleshooting

**Server won't start?**
- Check if port 3000 is in use: `netstat -ano | findstr :3000`
- Kill the process or use different port: `PORT=3001 npm run dev`

**Database connection error?**
- Verify `DATABASE_URL` in `.env.local` is correct
- Make sure database is accessible

**Module not found?**
```bash
rm -rf node_modules .next
npm install
```

## What's Running?

The development server includes:
- ✅ Hot reload (auto-refresh on changes)
- ✅ TypeScript checking
- ✅ Error reporting
- ✅ API routes at `/api/*`

Enjoy exploring the Bass Clown Co platform! 🎣

