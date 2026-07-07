"use client";

import { useState, useMemo } from "react";
import { Leaf } from "lucide-react";
import { FRESH_SNIPS } from "@/data/strains";
import StrainCard from "@/components/StrainCard";
import SearchFilter from "@/components/SearchFilter";

export default function FreshSnipsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return FRESH_SNIPS;
    const q = search.toLowerCase();
    return FRESH_SNIPS.filter((s) => s.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-jungle-green to-jungle-green-light shadow-md">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-white">
            Fresh Snips
          </h1>
        </div>
        <p className="text-white/50 text-sm mb-4">Freshly cut genetics ready for rooting.</p>

        {/* Pricing Banner */}
        <div className="glass-card rounded-2xl px-5 py-4 inline-flex items-center gap-4 mb-6">
          <div>
            <span className="text-2xl font-bold text-brand-400 font-display">3 for $100</span>
            <span className="block text-xs text-white/40 mt-0.5">Bundle pricing on all fresh snips</span>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Search fresh snips..."
            resultCount={filtered.length}
            totalCount={FRESH_SNIPS.length}
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 text-center">
          <Leaf className="mx-auto h-12 w-12 text-white/20 mb-4" />
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
              category="fresh_snip"
              image={strain.image}
              inStock={strain.inStock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
