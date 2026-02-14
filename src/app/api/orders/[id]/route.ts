import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ALLOWED_STATUSES = ["in_progress", "completed"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    let body: { status?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { status } = body;

    if (typeof status !== "string" || !ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
      return NextResponse.json(
        { error: "Invalid request. status must be 'in_progress' or 'completed'." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Orders PATCH error:", error.message);
      return NextResponse.json(
        { error: error.message || "Database update failed. If using Supabase, ensure RLS allows UPDATE on orders." },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Orders PATCH:", e);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
