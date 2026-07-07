"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Package, ArrowLeft, Copy, Check } from "lucide-react";

interface OrderData {
  orderNumber?: string;
  trackingNumber?: string;
  labelUrl?: string;
}

export default function SuccessPage() {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("lastOrder");
    if (raw) {
      try {
        setOrder(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const copyTracking = () => {
    if (order?.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center animate-fade-in">
      <div className="glass-card rounded-3xl p-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-jungle-green/20">
          <CheckCircle className="h-10 w-10 text-jungle-green-light" />
        </div>

        <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-white mb-3">
          Order Placed!
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          Your order has been submitted. You&rsquo;ll receive a confirmation email shortly
          with your tracking information.
        </p>

        {order?.orderNumber && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Order Number</p>
            <p className="font-display text-lg font-bold text-white">{order.orderNumber}</p>
          </div>
        )}

        {order?.trackingNumber && (
          <div className="rounded-xl bg-jungle-purple/10 border border-jungle-purple/20 p-4 mb-6">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Tracking Number</p>
            <div className="flex items-center justify-center gap-2">
              <Package className="h-4 w-4 text-jungle-purple-light" />
              <span className="font-mono text-sm text-jungle-purple-light font-semibold">
                {order.trackingNumber}
              </span>
              <button
                onClick={copyTracking}
                className="rounded-full p-1 text-white/30 hover:text-white transition-colors"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-jungle-green-light" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-xl bg-brand-400/10 border border-brand-400/20 p-3">
            <p className="text-xs text-white/60 leading-relaxed">
              <span className="text-brand-400 font-semibold">Reminder:</span>{" "}
              Payment is handled separately. You&rsquo;ll be contacted regarding payment.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full btn-jungle px-6 py-3 text-sm no-underline transition-all hover:scale-[1.02]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
