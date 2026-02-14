import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** GET /api/orders — KDS order queue (new, in_progress, completed) */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: orders } = await supabase
      .from("orders")
      .select("id, items, total_price, status, created_at")
      .in("status", ["new", "in_progress", "completed"])
      .order("created_at", { ascending: false });

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
