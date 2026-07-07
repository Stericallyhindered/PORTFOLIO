import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/auth";

// PATCH /api/orders/:id - Update order status (admin only)
export async function PATCH(
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

  try {
    const body = await req.json();
    const supabase = createServerClient();

    const updates: Record<string, unknown> = {};
    if (body.status) updates.status = body.status;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to update order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/orders/:id - Get single order (admin only)
export async function GET(
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

  const { data, error } = await supabase
    .from("orders")
    .select(`*, order_items (*)`)
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
}
