"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, AlertTriangle } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { calculateCartPricing } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const pricing = calculateCartPricing(items);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center animate-fade-in">
        <div className="glass-card rounded-3xl p-12">
          <ShoppingCart className="mx-auto h-16 w-16 text-white/20 mb-6" />
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-white mb-3">
            Cart Empty
          </h1>
          <p className="text-white/50 mb-8">Add some genetics to get started.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full btn-jungle px-6 py-3 text-sm no-underline transition-all hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Strains
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-white">
            Your Cart
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/50 transition-colors hover:bg-red-500/15 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear All
        </button>
      </div>

      {/* Items */}
      <div className="space-y-3 mb-8">
        {items.map((item) => (
          <div
            key={item.productId}
            className="glass-card rounded-2xl p-4 flex items-center gap-4"
          >
            {/* Thumbnail */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
              <Image
                src={item.image_url || "/logo.png"}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-white truncate">
                {item.name}
              </h3>
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  item.category === "fresh_snip" ? "text-jungle-green-light" : "text-jungle-purple-light"
                }`}
              >
                {item.category === "fresh_snip" ? "Fresh Snip" : "Rooted Clone"}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-white">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeItem(item.productId)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-red-500/15 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-brand-400">
          Order Summary
        </h2>

        <div className="space-y-2 text-sm">
          {pricing.freshSnipQty > 0 && (
            <div className="flex justify-between text-white/60">
              <span>
                Fresh Snips ({pricing.freshSnipQty} &times; bundle of 3)
              </span>
              <span>{formatCurrency(pricing.freshSnipTotal)}</span>
            </div>
          )}
          {pricing.rootedCloneQty > 0 && (
            <div className="flex justify-between text-white/60">
              <span>
                Rooted Clones ({pricing.rootedCloneQty} @ {formatCurrency(pricing.rootedCloneUnitPrice)})
              </span>
              <span>{formatCurrency(pricing.rootedCloneTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-white/60">
            <span>Flat Rate Shipping</span>
            <span>{formatCurrency(pricing.shipping)}</span>
          </div>
          <div className="border-t border-white/10 pt-3 flex justify-between text-lg font-bold">
            <span className="text-white">Total</span>
            <span className="text-brand-400">{formatCurrency(pricing.total)}</span>
          </div>
        </div>

        {/* Payment Notice */}
        <div className="rounded-xl bg-brand-400/10 border border-brand-400/20 p-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-brand-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-white/60 leading-relaxed">
            <span className="text-brand-400 font-semibold">Payment is handled externally.</span>{" "}
            This site is for order placement and tracking only. You will be contacted regarding payment after checkout.
          </p>
        </div>

        <Link
          href="/checkout"
          className="flex w-full items-center justify-center gap-2 rounded-full btn-jungle py-3 text-sm no-underline transition-all hover:scale-[1.02]"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
