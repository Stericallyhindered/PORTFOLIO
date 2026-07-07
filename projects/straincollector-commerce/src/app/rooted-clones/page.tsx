"use client";

import { useState, useMemo } from "react";
import { Sprout } from "lucide-react";
import { ROOTED_CLONES } from "@/data/strains";
import { getCloneTierPrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/components/CartProvider";
import StrainCard from "@/components/StrainCard";
import SearchFilter from "@/components/SearchFilter";
import PricingTier from "@/components/PricingTier";

export default function RootedClonesPage() {
  const [search, setSearch] = useState("");
  const { getTotalByCategory } = useCart();
  const totalClones = getTotalByCategory("rooted_clone");
  const unitPrice = getCloneTierPrice(totalClones);

  const filtered = useMemo(() => {
    if (!search.trim()) return ROOTED_CLONES;
    const q = search.toLowerCase();
    return ROOTED_CLONES.filter((s) => s.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-jungle-purple to-jungle-purple-light shadow-md">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-white">
            Rooted Clones
          </h1>
        </div>
        <p className="text-white/50 text-sm mb-2">Established roots ready to transplant.</p>

        {/* Dynamic Price */}
        <div className="glass-card rounded-2xl px-5 py-4 inline-flex items-center gap-4 mb-6">
          <div>
            <span className="text-2xl font-bold text-jungle-purple-light font-display">
              {formatCurrency(unitPrice)}
            </span>
            <span className="text-lg text-white/60 ml-1">/ clone</span>
            {totalClones > 0 && (
              <span className="block text-xs text-white/40 mt-0.5">
                Based on {totalClones} clone{totalClones !== 1 ? "s" : ""} in your cart
              </span>
            )}
          </div>
        </div>

        {/* Two-col: search + pricing tier */}
        <div className="grid gap-6 lg:grid-cols-2 mb-2">
          <div className="space-y-4">
            <SearchFilter
              value={search}
              onChange={setSearch}
              placeholder="Search rooted clones..."
              resultCount={filtered.length}
              totalCount={ROOTED_CLONES.length}
            />
          </div>
          <PricingTier />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 text-center">
          <Sprout className="mx-auto h-12 w-12 text-white/20 mb-4" />
          <p className="text-white/40">No strains found matching &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((strain) => (
            <StrainCard
              key={strain.slug}
              id={strain.slug}
              name={strain.name}
              slug={strain.slug}
              category="rooted_clone"
              image={strain.image}
              inStock={strain.inStock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
