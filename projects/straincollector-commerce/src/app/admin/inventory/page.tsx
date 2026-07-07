"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Package,
  Check,
  X,
} from "lucide-react";
import type { Product } from "@/lib/types";

export default function AdminInventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("sc-admin-token")
      : null;

  const fetchProducts = useCallback(async () => {
    if (!token) { router.push("/admin"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleStock = async (id: string, inStock: boolean) => {
    if (!token) return;
    setTogglingId(id);
    try {
      await fetch(`/api/products`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, in_stock: !inStock }),
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, in_stock: !p.in_stock } : p))
      );
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = products.filter((p) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (search) return p.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const inStockCount = products.filter((p) => p.in_stock).length;
  const outOfStockCount = products.filter((p) => !p.in_stock).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/orders")}
            className="rounded-full glass p-2.5 text-white/40 transition-colors hover:text-brand-400"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-white">
              Inventory
            </h1>
            <p className="text-sm text-white/40">
              {inStockCount} in stock / {outOfStockCount} out of stock
            </p>
          </div>
        </div>
        <button
          onClick={fetchProducts}
          className="rounded-full glass p-2.5 text-white/40 transition-colors hover:text-brand-400"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search strains..."
            className="w-full rounded-full glass py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-brand-400/30"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-full glass px-4 py-2.5 text-sm text-white outline-none"
        >
          <option value="all">All Categories</option>
          <option value="fresh_snip">Fresh Snips</option>
          <option value="rooted_clone">Rooted Clones</option>
        </select>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Package className="mx-auto h-12 w-12 text-white/15 mb-4" />
          <p className="text-white/40">No products found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-4 glass-card rounded-xl px-4 py-3 transition-all hover:border-white/15"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    product.category === "fresh_snip"
                      ? "bg-jungle-green/10 text-jungle-green-light"
                      : "bg-jungle-purple/10 text-jungle-purple-light"
                  }`}
                >
                  {product.category === "fresh_snip" ? "Snip" : "Clone"}
                </span>
                <span className="text-sm font-display font-semibold uppercase tracking-wide text-white truncate">
                  {product.name}
                </span>
              </div>

              <button
                onClick={() => toggleStock(product.id, product.in_stock)}
                disabled={togglingId === product.id}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  product.in_stock
                    ? "bg-jungle-green/10 border border-jungle-green/20 text-jungle-green-light hover:bg-jungle-green/20"
                    : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                } disabled:opacity-50`}
              >
                {togglingId === product.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : product.in_stock ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                {product.in_stock ? "In Stock" : "Out of Stock"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
