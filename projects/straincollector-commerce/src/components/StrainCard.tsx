"use client";

import Image from "next/image";
import { Plus, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useCart } from "./CartProvider";
import type { ProductCategory } from "@/lib/types";

interface StrainCardProps {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  image: string;
  inStock: boolean;
}

export default function StrainCard({
  id,
  name,
  slug,
  category,
  image,
  inStock,
}: StrainCardProps) {
  const { addItem, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const inCart = items.find((i) => i.productId === id);
  const isPlaceholder = image === "/logo.png";

  const handleAdd = () => {
    if (!inStock) return;
    addItem({
      productId: id,
      name,
      slug,
      category,
      image_url: image,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl glass-card transition-all duration-300 hover:border-brand-400/30 hover:glow-gold">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        {isPlaceholder ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-jungle-purple/20 to-jungle-dark/50">
            <Image src="/logo.png" alt={name} width={80} height={80} className="opacity-40" />
          </div>
        ) : (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}

        {/* Dark overlay on hover for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Stock Badge */}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400">
              <AlertCircle className="h-3 w-3" />
              Out of Stock
            </span>
          </div>
        )}

        {/* In Cart Badge */}
        {inCart && (
          <div className="absolute right-2 top-2">
            <span className="flex items-center gap-1 rounded-full bg-brand-400/90 px-2 py-0.5 text-[10px] font-bold text-black shadow-lg">
              {inCart.quantity} in cart
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-white leading-tight line-clamp-2 mb-2">
          {name}
        </h3>

        <div className="mt-auto">
          <button
            onClick={handleAdd}
            disabled={!inStock}
            className={`flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all ${
              !inStock
                ? "cursor-not-allowed bg-white/5 text-white/30"
                : justAdded
                ? "btn-jungle scale-95"
                : "bg-white/10 text-white hover:bg-white/20 hover:text-brand-400"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Added!
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
