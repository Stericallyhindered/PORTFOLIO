# Laser Consumables - Full-Stack E-Commerce Platform

A complete, vertically integrated e-commerce platform built with Next.js, PostgreSQL, Stripe, and ShipStation.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router) with TypeScript
- **Backend:** Next.js API Routes + Server Actions
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **Payments:** Stripe
- **Shipping:** ShipStation API
- **Email:** Resend API
- **Styling:** Tailwind CSS

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` - Next.js App Router pages and API routes
- `components/` - React components
- `lib/` - Utility functions and integrations
- `prisma/` - Database schema and migrations
- `public/` - Static assets

## Features

- Full product management system
- Shopping cart and checkout
- Order management
- Shipping label generation (ShipStation)
- Automated emails
- Discount codes
- Customer accounts
- Admin panel
- Analytics dashboard
- Website customization





