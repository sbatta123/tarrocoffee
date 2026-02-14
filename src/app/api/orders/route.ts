import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** GET /api/orders — KDS order queue (pending, new, in_progress, completed) */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, items, total_price, status, created_at")
      .in("status", ["pending", "new", "in_progress", "completed"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Orders GET error:", error.message, error.code);
      return NextResponse.json(
        { error: error.message, code: error.code, hint: "If using Supabase, enable RLS and add a policy allowing SELECT on orders, or disable RLS for the orders table for demo." },
        { status: 500 }
      );
    }

    const list = (orders ?? []).map((o) => ({
      id: o.id,
      items: o.items ?? "",
      total_price: Number(o.total_price),
      status: o.status ?? "new",
      created_at: o.created_at,
    }));

    return NextResponse.json(list);
  } catch (e) {
    console.error("Orders list error:", e);
    return NextResponse.json([], { status: 500 });
  }
}
