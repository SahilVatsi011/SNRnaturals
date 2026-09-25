import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_no, customer_name, total, created_at, order_status, payment_status"
    )
    .order("created_at", { ascending: false })
    .limit(30);

  const res = NextResponse.json(orders ?? []);
  res.headers.set("Cache-Control", "no-store");
  return res;
}