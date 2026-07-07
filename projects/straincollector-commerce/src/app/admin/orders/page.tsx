"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Download,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogOut,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  Tag,
  MapPin,
  Mail,
  Phone,
  Instagram,
  FileText,
  ExternalLink,
} from "lucide-react";
import type { OrderWithItems, OrderStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  label_created: { label: "Label Created", color: "text-jungle-teal-light", bg: "bg-jungle-teal/10 border-jungle-teal/20" },
  shipped: { label: "Shipped", color: "text-jungle-purple-light", bg: "bg-jungle-purple/10 border-jungle-purple/20" },
  completed: { label: "Completed", color: "text-jungle-green-light", bg: "bg-jungle-green/10 border-jungle-green/20" },
  cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? sessionStorage.getItem("sc-admin-token") : null;

  const fetchOrders = useCallback(async () => {
    if (!token) { router.push("/admin"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    if (!token) return;
    setActionLoading(`status-${orderId}`);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      await fetchOrders();
    } finally {
      setActionLoading(null);
    }
  };

  const generateLabel = async (orderId: string) => {
    if (!token) return;
    setActionLoading(`label-${orderId}`);
    try {
      const res = await fetch(`/api/orders/${orderId}/label`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await fetchOrders();
      } else {
        alert(data.error || "Label generation failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("sc-admin-token");
    sessionStorage.removeItem("sc-admin-email");
    router.push("/admin");
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        o.order_number.toString().includes(q) ||
        (o.shippo_tracking_number && o.shippo_tracking_number.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    labelCreated: orders.filter((o) => o.status === "label_created").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-white">
            Orders
          </h1>
          <p className="text-sm text-white/40">Manage orders and shipping labels</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/admin/inventory")}
            className="rounded-full glass px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/60 transition-colors hover:text-brand-400"
          >
            Inventory
          </button>
          <button
            onClick={fetchOrders}
            className="rounded-full glass p-2.5 text-white/40 transition-colors hover:text-brand-400"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={logout}
            className="rounded-full bg-red-500/10 border border-red-500/20 p-2.5 text-red-400 transition-colors hover:bg-red-500/20"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
        {[
          { label: "Total Orders", value: stats.total, color: "text-white" },
          { label: "Pending", value: stats.pending, color: "text-amber-400" },
          { label: "Labels Created", value: stats.labelCreated, color: "text-jungle-teal-light" },
          { label: "Shipped", value: stats.shipped, color: "text-jungle-purple-light" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full rounded-full glass py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-brand-400/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-full glass px-4 py-2.5 text-sm text-white outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="label_created">Label Created</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Package className="mx-auto h-12 w-12 text-white/15 mb-4" />
          <p className="text-white/40">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const expanded = expandedId === order.id;
            const sc = STATUS_CONFIG[order.status];

            return (
              <div
                key={order.id}
                className="glass-card rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/15"
              >
                {/* Row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="flex w-full items-center gap-4 p-4 text-left"
                >
                  <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Order</p>
                      <p className="text-sm font-display font-bold text-white">#{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Customer</p>
                      <p className="text-sm text-white truncate">{order.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Total</p>
                      <p className="text-sm font-bold text-brand-400">{formatCurrency(order.total)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Status</p>
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 text-white/30 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/30 flex-shrink-0" />
                  )}
                </button>

                {/* Expanded Detail */}
                {expanded && (
                  <div className="border-t border-white/5 p-5 space-y-5 animate-fade-in">
                    <div className="grid gap-5 sm:grid-cols-2">
                      {/* Customer Info */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest">Customer</h4>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 text-white/60">
                            <Mail className="h-3.5 w-3.5 text-white/30" />
                            <a href={`mailto:${order.customer_email}`} className="hover:text-brand-400 transition-colors">{order.customer_email}</a>
                          </div>
                          {order.customer_phone && (
                            <div className="flex items-center gap-2 text-white/60">
                              <Phone className="h-3.5 w-3.5 text-white/30" />
                              {order.customer_phone}
                            </div>
                          )}
                          {order.instagram && (
                            <div className="flex items-center gap-2 text-white/60">
                              <Instagram className="h-3.5 w-3.5 text-white/30" />
                              @{order.instagram}
                            </div>
                          )}
                          {order.notes && (
                            <div className="flex items-start gap-2 text-white/60">
                              <FileText className="h-3.5 w-3.5 text-white/30 mt-0.5" />
                              <span className="text-xs">{order.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest">Ship To</h4>
                        <div className="flex items-start gap-2 text-sm text-white/60">
                          <MapPin className="h-3.5 w-3.5 text-white/30 mt-0.5" />
                          <div>
                            <p>{order.shipping_address.name}</p>
                            <p>{order.shipping_address.street1}</p>
                            {order.shipping_address.street2 && <p>{order.shipping_address.street2}</p>}
                            <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest mb-2">Items</h4>
                      <div className="rounded-xl overflow-hidden border border-white/5">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ background: "rgba(127, 29, 141, 0.1)" }}>
                              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-white/40">Strain</th>
                              <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-white/40">Type</th>
                              <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-white/40">Qty</th>
                              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/40">Price</th>
                              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/40">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {order.order_items.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 text-white/70">{item.product_name}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.category === "fresh_snip" ? "bg-jungle-green/10 text-jungle-green-light" : "bg-jungle-purple/10 text-jungle-purple-light"}`}>
                                    {item.category === "fresh_snip" ? "Snip" : "Clone"}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center text-white/70">{item.quantity}</td>
                                <td className="px-3 py-2 text-right text-white/50">{formatCurrency(item.unit_price)}</td>
                                <td className="px-3 py-2 text-right text-white font-medium">{formatCurrency(item.line_total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 text-right text-sm space-x-3">
                        <span className="text-white/40">Subtotal: {formatCurrency(order.subtotal)}</span>
                        <span className="text-white/40">Shipping: {formatCurrency(order.shipping_cost)}</span>
                        <span className="font-bold text-brand-400">Total: {formatCurrency(order.total)}</span>
                      </div>
                    </div>

                    {/* Tracking / Label */}
                    {order.shippo_tracking_number && (
                      <div className="rounded-xl bg-jungle-purple/10 border border-jungle-purple/20 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider">Tracking</p>
                            <p className="text-sm font-mono font-bold text-jungle-purple-light">{order.shippo_tracking_number}</p>
                          </div>
                          <div className="flex gap-2">
                            {order.shippo_tracking_url && (
                              <a
                                href={order.shippo_tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full glass px-3 py-1.5 text-xs text-white/60 hover:text-brand-400 transition-colors flex items-center gap-1 no-underline"
                              >
                                Track <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {order.shippo_label_url && (
                              <a
                                href={order.shippo_label_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full bg-brand-400/10 border border-brand-400/20 px-3 py-1.5 text-xs text-brand-400 hover:bg-brand-400/20 transition-colors flex items-center gap-1 no-underline"
                              >
                                <Download className="h-3 w-3" /> Label PDF
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                      {!order.shippo_label_url && (
                        <button
                          onClick={() => generateLabel(order.id)}
                          disabled={actionLoading === `label-${order.id}`}
                          className="flex items-center gap-1.5 rounded-full btn-jungle px-4 py-2 text-xs disabled:opacity-50"
                        >
                          {actionLoading === `label-${order.id}` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Tag className="h-3 w-3" />
                          )}
                          Generate Label
                        </button>
                      )}

                      {order.status !== "shipped" && order.shippo_label_url && (
                        <button
                          onClick={() => updateStatus(order.id, "shipped")}
                          disabled={actionLoading === `status-${order.id}`}
                          className="flex items-center gap-1.5 rounded-full bg-jungle-purple/10 border border-jungle-purple/20 px-4 py-2 text-xs font-semibold text-jungle-purple-light transition-colors hover:bg-jungle-purple/20 disabled:opacity-50"
                        >
                          <Truck className="h-3 w-3" /> Mark Shipped
                        </button>
                      )}

                      {order.status !== "completed" && order.status !== "cancelled" && (
                        <button
                          onClick={() => updateStatus(order.id, "completed")}
                          disabled={actionLoading === `status-${order.id}`}
                          className="flex items-center gap-1.5 rounded-full bg-jungle-green/10 border border-jungle-green/20 px-4 py-2 text-xs font-semibold text-jungle-green-light transition-colors hover:bg-jungle-green/20 disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" /> Complete
                        </button>
                      )}

                      {order.status !== "cancelled" && (
                        <button
                          onClick={() => updateStatus(order.id, "cancelled")}
                          disabled={actionLoading === `status-${order.id}`}
                          className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <XCircle className="h-3 w-3" /> Cancel
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-white/20">
                      Created: {formatDate(order.created_at)}
                      {order.updated_at !== order.created_at && ` | Updated: ${formatDate(order.updated_at)}`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
