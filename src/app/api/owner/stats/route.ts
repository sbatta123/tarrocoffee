import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** GET /api/owner/stats — today's pulse metrics for the store owner */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startIso = startOfToday.toISOString();

    const { data: orders } = await supabase
      .from("orders")
      .select("id, items, total_price, status, created_at")
      .in("status", ["pending", "new", "in_progress", "completed"])
      .gte("created_at", startIso)
      .order("created_at", { ascending: false });

    const list = orders ?? [];
    const ordersToday = list.length;
    const revenueToday = list.reduce((sum, o) => sum + Number(o.total_price ?? 0), 0);
    const avgOrderValue = ordersToday > 0 ? revenueToday / ordersToday : 0;

    // Count item mentions (e.g. "1x Latte (Small) (Hot), 2x Cookie" -> Latte x1, Cookie x2)
    const itemCounts: Record<string, number> = {};
    for (const o of list) {
      const itemsStr = (o.items as string) ?? "";
      for (const part of itemsStr.split(",").map((s) => s.trim()).filter(Boolean)) {
        const match = part.match(/^(\d+)x\s+(.+)$/);
        const qty = match ? parseInt(match[1], 10) : 1;
        const name = match ? match[2].trim() : part;
        const baseName = name.replace(/\s*\([^)]*\)/g, "").trim() || name;
        itemCounts[baseName] = (itemCounts[baseName] ?? 0) + qty;
      }
    }
    const topItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const statusCounts = { pending: 0, new: 0, in_progress: 0, completed: 0 };
    for (const o of list) {
      const s = (o.status as string) ?? "new";
      if (s in statusCounts) (statusCounts as Record<string, number>)[s]++;
    }

    return NextResponse.json({
      ordersToday,
      revenueToday: Math.round(revenueToday * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      topItems,
      statusCounts,
    });
  } catch (e) {
    console.error("Owner stats error:", e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
