import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateShippingLabel } from "@/lib/shippo";
import { sendCustomerOrderEmail, sendAdminOrderEmail } from "@/lib/email";
import { calculateCartPricing } from "@/lib/pricing";
import type { CheckoutPayload, OrderWithItems } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const payload: CheckoutPayload = await req.json();

    // Validate required fields
    if (
      !payload.customerName ||
      !payload.customerEmail ||
      !payload.shippingAddress?.street1 ||
      !payload.shippingAddress?.city ||
      !payload.shippingAddress?.state ||
      !payload.shippingAddress?.zip ||
      !payload.items?.length
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Recalculate pricing server-side (don't trust client)
    const pricing = calculateCartPricing(payload.items);

    // Generate order number
    const orderNumber = Math.floor(10000 + Math.random() * 90000);

    // Initialize Supabase
    const supabase = createServerClient();

    // ─── Generate Shipping Label via Shippo ────────────────
    let labelData: {
      trackingNumber: string;
      trackingUrl: string;
      labelUrl: string;
    } | null = null;

    try {
      labelData = await generateShippingLabel(
        payload.shippingAddress,
        payload.customerEmail,
        payload.customerPhone
      );
    } catch (err) {
      console.error("Label generation failed (non-fatal):", err);
      // Continue without label - admin can generate later
    }

    // ─── Save Order to Supabase ─────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: labelData ? "label_created" : "pending",
        customer_email: payload.customerEmail,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone || "",
        shipping_address: payload.shippingAddress,
        notes: payload.notes || null,
        instagram: payload.instagram || null,
        subtotal: pricing.subtotal,
        shipping_cost: pricing.shipping,
        total: pricing.total,
        shippo_label_url: labelData?.labelUrl || null,
        shippo_tracking_number: labelData?.trackingNumber || null,
        shippo_tracking_url: labelData?.trackingUrl || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order insert failed:", orderError);
      return NextResponse.json(
        { success: false, error: "Failed to save order. Please try again." },
        { status: 500 }
      );
    }

    // ─── Save Order Items ────────────────────────────────────
    const orderItems = payload.items.map((item) => {
      const unitPrice =
        item.category === "fresh_snip"
          ? 100 / 3
          : pricing.rootedCloneUnitPrice;

      return {
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit_price: Math.round(unitPrice * 100) / 100,
        line_total: Math.round(item.quantity * unitPrice * 100) / 100,
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items insert failed:", itemsError);
    }

    // ─── Send Emails ────────────────────────────────────────
    const fullOrder: OrderWithItems = {
      ...order,
      order_items: orderItems.map((item, i) => ({
        ...item,
        id: `temp-${i}`,
      })),
    };

    // Send emails in parallel (non-blocking)
    Promise.all([
      sendCustomerOrderEmail(fullOrder),
      sendAdminOrderEmail(fullOrder),
    ]).catch((err) => console.error("Email send error:", err));

    // ─── Return Success ──────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        trackingNumber: labelData?.trackingNumber || null,
        trackingUrl: labelData?.trackingUrl || null,
        labelUrl: labelData?.labelUrl || null,
      },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
