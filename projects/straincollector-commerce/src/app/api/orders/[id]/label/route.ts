import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/auth";
import { generateShippingLabel } from "@/lib/shippo";
import { sendCustomerOrderEmail, sendAdminOrderEmail } from "@/lib/email";

// POST /api/orders/:id/label - Generate shipping label for an order (admin only)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await verifyAdmin(req.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = createServerClient();

  // Fetch the order
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select(`*, order_items (*)`)
    .eq("id", params.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  // Generate label via Shippo
  const labelData = await generateShippingLabel(
    order.shipping_address,
    order.customer_email,
    order.customer_phone
  );

  if (!labelData) {
    return NextResponse.json(
      { success: false, error: "Failed to generate shipping label. Check Shippo configuration." },
      { status: 500 }
    );
  }

  // Update order with label info
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "label_created",
      shippo_label_url: labelData.labelUrl,
      shippo_tracking_number: labelData.trackingNumber,
      shippo_tracking_url: labelData.trackingUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (updateError) {
    console.error("Failed to update order with label info:", updateError);
  }

  // Send emails with tracking info
  const updatedOrder = {
    ...order,
    shippo_label_url: labelData.labelUrl,
    shippo_tracking_number: labelData.trackingNumber,
    shippo_tracking_url: labelData.trackingUrl,
  };

  Promise.all([
    sendCustomerOrderEmail(updatedOrder),
    sendAdminOrderEmail(updatedOrder),
  ]).catch((err) => console.error("Email send error:", err));

  return NextResponse.json({
    success: true,
    data: {
      trackingNumber: labelData.trackingNumber,
      trackingUrl: labelData.trackingUrl,
      labelUrl: labelData.labelUrl,
    },
  });
}
