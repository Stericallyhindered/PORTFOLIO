-- Create affiliates table
CREATE TABLE "affiliates" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "phoneNumber" TEXT NOT NULL,
    "companyName" TEXT,
    "affiliateCode" TEXT NOT NULL UNIQUE,
    "affiliateCommission" NUMERIC(5, 2) NOT NULL DEFAULT 10,
    "customerDiscount" NUMERIC(5, 2) NOT NULL DEFAULT 15,
    "verified" BOOLEAN DEFAULT false,
    "salt" TEXT,
    "hash" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "totalEarnings" NUMERIC(10, 2) NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    -- Payout information with Stripe support
    "payoutInfo" JSONB DEFAULT '{"paymentMethod": "stripe"}',
    "stripeConnectURL" TEXT,
    CONSTRAINT "affiliate_commission_check" CHECK ("affiliateCommission" BETWEEN 0 AND 100),
    CONSTRAINT "customer_discount_check" CHECK ("customerDiscount" BETWEEN 0 AND 100)
);

-- Create index for faster affiliate code lookups
CREATE INDEX "affiliates_code_idx" ON "affiliates" ("affiliateCode");

-- Create index for email searches
CREATE INDEX "affiliates_email_idx" ON "affiliates" ("email");

-- Create index for Stripe account ID lookups
CREATE INDEX "affiliates_stripe_idx" ON "affiliates" ((payoutInfo->>'stripeAccountId')); 