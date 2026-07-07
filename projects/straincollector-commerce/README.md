# StrainCollector v2

Modern Next.js e-commerce app for managing cannabis genetics orders. No online payment processing -- orders are placed with shipping labels auto-generated via Shippo, and payment is handled externally.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (admin only)
- **Shipping:** Shippo API (USPS Priority Mail labels)
- **Email:** Brevo (transactional order notifications)
- **Hosting:** Vercel

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Copy Strain Images

```bash
npm run copy-images
```

This copies strain photos from the master_images database to `public/strainpics/`.

### 3. Copy the Logo

Make sure `logo.png` exists in `public/` directory:

```bash
copy logo.png public\logo.png
```

### 4. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Then run `supabase/seed.sql` to populate the product catalog
4. Go to **Settings > API** and copy your project URL and keys
5. Go to **Authentication > Users** and create your admin user (email + password)

### 5. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
copy .env.example .env.local
```

Required values:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `SHIPPO_API_TOKEN` - Shippo API token (test or live)
- `BREVO_API_KEY` - Brevo email API key (optional, emails skipped without it)
- `ADMIN_EMAIL` - Email to receive order notifications
- `ORIGIN_*` - Your shipping origin address

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/fresh-snips` | Fresh snips catalog (3 for $100) |
| `/rooted-clones` | Rooted clones catalog (volume pricing) |
| `/cart` | Shopping cart |
| `/checkout` | Order placement form |
| `/checkout/success` | Order confirmation |
| `/admin` | Admin login |
| `/admin/orders` | Order management dashboard |
| `/admin/inventory` | Product stock management |

## Pricing

**Fresh Snips:** 3 for $100

**Rooted Clones (volume tiers):**

| Quantity | Price/Each |
|----------|-----------|
| 1-9 | $75 |
| 10-19 | $50 |
| 20-49 | $40 |
| 50-74 | $30 |
| 75-99 | $20 |
| 100+ | $15 |

**Shipping:** Flat $25 (USPS Priority Mail)

## Admin Features- View all orders with status, customer info, items, and totals
- Generate shipping labels manually from order details
- Download label PDFs
- Update order status (pending > label_created > shipped > completed)
- Toggle product stock status
- Search and filter orders