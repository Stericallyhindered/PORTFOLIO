"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Truck, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { calculateCartPricing } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

interface LocalFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const pricing = calculateCartPricing(items);

  const [form, setForm] = useState<LocalFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field: keyof LocalFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: form, items }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Checkout failed");

      sessionStorage.setItem("lastOrder", JSON.stringify(data));
      clearCart();
      router.push("/checkout/success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center animate-fade-in">
        <div className="glass-card rounded-3xl p-12">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-white mb-3">
            Nothing to Checkout
          </h1>
          <p className="text-white/50 mb-6 text-sm">Add items to your cart first.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full btn-jungle px-6 py-3 text-sm no-underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Strains
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/20";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 animate-fade-in">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-sm text-white/40 mb-6 hover:text-brand-400 transition-colors no-underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-white mb-2">
        Checkout
      </h1>
      <p className="text-white/40 text-sm mb-8">
        Enter your shipping info to place your order.
      </p>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          {/* Payment Notice */}
          <div className="rounded-xl bg-brand-400/10 border border-brand-400/20 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-brand-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-400 mb-1">No payment collected here</p>
              <p className="text-xs text-white/50 leading-relaxed">
                This checkout places your order and generates tracking. Payment is arranged separately.
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <input
              className={inputClass}
              placeholder="First Name *"
              required
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Last Name *"
              required
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </div>

          {/* Contact */}
          <input
            className={inputClass}
            type="email"
            placeholder="Email *"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
          <input
            className={inputClass}
            type="tel"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />

          {/* Address */}
          <input
            className={inputClass}
            placeholder="Address Line 1 *"
            required
            value={form.address1}
            onChange={(e) => set("address1", e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Address Line 2 (Apt, Suite, etc.)"
            value={form.address2}
            onChange={(e) => set("address2", e.target.value)}
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              className={inputClass}
              placeholder="City *"
              required
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="State *"
              required
              maxLength={2}
              value={form.state}
              onChange={(e) => set("state", e.target.value.toUpperCase())}
            />
            <input
              className={inputClass}
              placeholder="ZIP *"
              required
              maxLength={10}
              value={form.zip}
              onChange={(e) => set("zip", e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full btn-jungle py-3.5 text-sm transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4" />
                Place Order
              </>
            )}
          </button>
        </form>

        {/* Summary Sidebar */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-5 sticky top-24">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-brand-400 mb-4">
              Summary
            </h2>
            <div className="space-y-2 text-sm">
              {pricing.freshSnipQty > 0 && (
                <div className="flex justify-between text-white/50">
                  <span>Fresh Snips ({pricing.freshSnipQty})</span>
                  <span>{formatCurrency(pricing.freshSnipTotal)}</span>
                </div>
              )}
              {pricing.rootedCloneQty > 0 && (
                <div className="flex justify-between text-white/50">
                  <span>Clones ({pricing.rootedCloneQty})</span>
                  <span>{formatCurrency(pricing.rootedCloneTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-white/50">
                <span>Shipping</span>
                <span>{formatCurrency(pricing.shipping)}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-brand-400">{formatCurrency(pricing.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
