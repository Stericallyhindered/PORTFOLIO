import type { CartItem, CartPricingSummary, PricingTier } from "./types";

// ─── Fresh Snips Pricing ─────────────────────────────────────
// 3 for $100 bundle
export const FRESH_SNIP_BUNDLE_QTY = 3;
export const FRESH_SNIP_BUNDLE_PRICE = 100;
export const FRESH_SNIP_UNIT_PRICE = FRESH_SNIP_BUNDLE_PRICE / FRESH_SNIP_BUNDLE_QTY; // ~$33.33

// ─── Rooted Clone Pricing Tiers ──────────────────────────────
export const CLONE_PRICING_TIERS: PricingTier[] = [
  { minQty: 1, maxQty: 9, pricePerUnit: 75, label: "1-9" },
  { minQty: 10, maxQty: 19, pricePerUnit: 50, label: "10-19" },
  { minQty: 20, maxQty: 49, pricePerUnit: 40, label: "20-49" },
  { minQty: 50, maxQty: 74, pricePerUnit: 30, label: "50-74" },
  { minQty: 75, maxQty: 99, pricePerUnit: 20, label: "75-99" },
  { minQty: 100, maxQty: null, pricePerUnit: 15, label: "100+" },
];

// ─── Shipping ────────────────────────────────────────────────
export const FLAT_SHIPPING = 25;

// ─── Pricing Calculations ────────────────────────────────────

export function getCloneTierPrice(totalQty: number): number {
  for (const tier of CLONE_PRICING_TIERS) {
    if (totalQty >= tier.minQty && (tier.maxQty === null || totalQty <= tier.maxQty)) {
      return tier.pricePerUnit;
    }
  }
  return CLONE_PRICING_TIERS[0].pricePerUnit;
}

export function getActiveTierIndex(totalQty: number): number {
  for (let i = 0; i < CLONE_PRICING_TIERS.length; i++) {
    const tier = CLONE_PRICING_TIERS[i];
    if (totalQty >= tier.minQty && (tier.maxQty === null || totalQty <= tier.maxQty)) {
      return i;
    }
  }
  return 0;
}

export function calculateFreshSnipTotal(qty: number): number {
  const bundles = Math.floor(qty / FRESH_SNIP_BUNDLE_QTY);
  const remainder = qty % FRESH_SNIP_BUNDLE_QTY;
  return bundles * FRESH_SNIP_BUNDLE_PRICE + remainder * FRESH_SNIP_UNIT_PRICE;
}

export function calculateCartPricing(items: CartItem[]): CartPricingSummary {
  const freshSnipItems = items.filter((i) => i.category === "fresh_snip");
  const rootedCloneItems = items.filter((i) => i.category === "rooted_clone");

  const freshSnipQty = freshSnipItems.reduce((sum, i) => sum + i.quantity, 0);
  const rootedCloneQty = rootedCloneItems.reduce((sum, i) => sum + i.quantity, 0);

  const freshSnipTotal = calculateFreshSnipTotal(freshSnipQty);
  const rootedCloneUnitPrice = getCloneTierPrice(rootedCloneQty);
  const rootedCloneTotal = rootedCloneQty * rootedCloneUnitPrice;

  const subtotal = Math.round((freshSnipTotal + rootedCloneTotal) * 100) / 100;
  const shipping = items.length > 0 ? FLAT_SHIPPING : 0;
  const total = subtotal + shipping;

  return {
    freshSnipItems,
    rootedCloneItems,
    freshSnipTotal: Math.round(freshSnipTotal * 100) / 100,
    rootedCloneTotal,
    freshSnipQty,
    rootedCloneQty,
    rootedCloneUnitPrice,
    subtotal,
    shipping,
    total,
  };
}
