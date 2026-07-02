-- Create discount_codes table
CREATE TABLE "discount_codes" (
    "id" SERIAL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "email" TEXT,
    "discountType" TEXT NOT NULL,
    "discountAmount" NUMERIC(10, 2) NOT NULL,
    "maxUses" INTEGER NOT NULL,
    "totalUses" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN DEFAULT true,
    "validFrom" TIMESTAMP WITH TIME ZONE,
    "validUntil" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "discount_type_check" CHECK ("discountType" IN ('percentage', 'fixed')),
    CONSTRAINT "discount_amount_check" CHECK (
        ("discountType" = 'percentage' AND "discountAmount" BETWEEN 0 AND 100) OR
        ("discountType" = 'fixed' AND "discountAmount" >= 0)
    ),
    CONSTRAINT "max_uses_check" CHECK ("maxUses" >= 1),
    CONSTRAINT "total_uses_check" CHECK ("totalUses" >= 0),
    CONSTRAINT "total_uses_max_check" CHECK ("totalUses" <= "maxUses")
); 