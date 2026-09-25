import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const start = sp.get("start") ?? "";
  const end = sp.get("end") ?? "";
  const status = sp.get("status") ?? "";

  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDate.test(start) || !isoDate.test(end)) {
    return NextResponse.json(
      { error: "Valid start and end dates (YYYY-MM-DD) are required." },
      { status: 400 }
    );
  }
  if (start > end) {
    return NextResponse.json(
      { error: "Start date cannot be after end date." },
      { status: 400 }
    );
  }

  const startIso = new Date(`${start}T00:00:00+05:30`).toISOString();
  const endIso = new Date(`${end}T23:59:59.999+05:30`).toISOString();

  let query = supabase
    .from("orders")
    .select("*")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("order_status", status);
  }

  const { data: orders, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json({ orders: orders ?? [], start, end, status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}