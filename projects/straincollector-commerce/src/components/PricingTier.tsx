"use client";

import { CLONE_PRICING_TIERS, getActiveTierIndex } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "./CartProvider";

export default function PricingTier() {
  const { getTotalByCategory } = useCart();
  const totalClones = getTotalByCategory("rooted_clone");
  const activeIndex = totalClones > 0 ? getActiveTierIndex(totalClones) : -1;

  return (
    <div className="overflow-hidden rounded-2xl glass-card">
      <div className="px-4 py-3 border-b border-white/10" style={{ background: "rgba(127, 29, 141, 0.15)" }}>
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">Volume Pricing</h3>
        <p className="text-xs text-white/50 mt-0.5">
          Price per clone drops as you add more.
          {totalClones > 0 && (
            <span className="text-brand-400 ml-1">
              ({totalClones} clone{totalClones !== 1 ? "s" : ""} in cart)
            </span>
          )}
        </p>
      </div>
      <div className="divide-y divide-white/5">
        {CLONE_PRICING_TIERS.map((tier, i) => (
          <div
            key={tier.label}
            className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
              i === activeIndex
                ? "bg-brand-400/10 border-l-2 border-brand-400"
                : "border-l-2 border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-semibold ${
                  i === activeIndex ? "text-brand-400" : "text-white/60"
                }`}
              >
                {tier.label} clones
              </span>
              {i === activeIndex && (
                <span className="rounded-full bg-brand-400/20 px-2 py-0.5 text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <span
              className={`text-sm font-bold ${
                i === activeIndex ? "text-brand-400" : "text-white/80"
              }`}
            >
              {formatCurrency(tier.pricePerUnit)}
              <span className="text-xs font-normal text-white/40"> /each</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
