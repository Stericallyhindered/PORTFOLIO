-- Add pendingUses column to discount_codes table
ALTER TABLE "discount_codes" 
ADD COLUMN "pendingUses" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "pending_uses_check" CHECK ("pendingUses" >= 0),
ADD CONSTRAINT "total_pending_uses_check" CHECK (("totalUses" + "pendingUses") <= "maxUses"); 