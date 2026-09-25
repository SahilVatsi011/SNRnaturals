import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULTS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const [
    { data: orders },
    { data: products },
    { data: thresholdRow },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_no, customer_name, total, created_at, order_status, payment_status"
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("products").select("id, name, stock_qty"),
    supabase
      .from("settings")
      .select("value")
      .eq("key", "lowStockThreshold")
      .maybeSingle(),
  ]);

  const threshold =
    Number(thresholdRow?.value) || DEFAULTS.lowStockThreshold;

  const stock = (products ?? [])
    .filter((p) => Number(p.stock_qty) <= threshold)
    .slice(0, 10);

  const res = NextResponse.json({
    orders: orders ?? [],
    stock,
    threshold,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}