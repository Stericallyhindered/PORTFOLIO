import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/auth";

// GET /api/products - List all products (admin only for full access)
export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdmin(req.headers.get("authorization"));

  const supabase = createServerClient();

  let query = supabase.from("products").select("*").order("name");

  // Public users only see in-stock products
  if (!isAdmin) {
    query = query.eq("in_stock", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

// PATCH /api/products - Toggle stock status (admin only)
export async function PATCH(req: NextRequest) {
  const isAdmin = await verifyAdmin(req.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id, in_stock } = await req.json();

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("products")
      .update({ in_stock })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
