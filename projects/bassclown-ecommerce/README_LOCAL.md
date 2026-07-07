# 🏃 Quick Start - Run Locally

## Step 1: Install Bun (if not installed)

**Windows:**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Mac/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

## Step 2: Set Up Environment

1. Navigate to project:
   ```bash
   cd "dev website"
   ```

2. Create `.env.local` file:
   ```bash
   copy ENV_TEMPLATE.txt .env.local
   ```

3. Edit `.env.local` and add minimum required:
   ```env
   DATABASE_URL=your-postgresql-connection-string
   NEXTAUTH_SECRET=any-random-string
   JWT_SECRET=any-random-string
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

   **Get free database:** https://neon.tech (free PostgreSQL)

## Step 3: Install & Setup

```bash
# Install dependencies
bun install

# Set up database and create admin user
bun run create-admin
```

## Step 4: Start Server

```bash
bun dev
```

## Step 5: Open Browser

Go to: **http://localhost:3000**

**Login:**
- Email: `david@solheim.tech`
- Password: `bassclown25`

## That's It! 🎉

You're ready to explore the platform!

## Using npm instead of bun?

If you prefer npm:

```bash
npm install
npm run create-admin:node
npm run dev
```

## Need Help?

See `SETUP_INSTRUCTIONS.md` for detailed help.

