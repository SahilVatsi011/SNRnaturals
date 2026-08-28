import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getFeeConfig, type FeeConfig } from "@/lib/pricing";

export async function fetchFeeConfig(): Promise<FeeConfig> {
  if (!isSupabaseConfigured()) return getFeeConfig();
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "fees")
      .maybeSingle();

    const fees = data?.value as
      | { razorpayFeeRate?: number; smsCostPerOrder?: number }
      | undefined;

    return getFeeConfig({
      razorpayFeeRate: fees?.razorpayFeeRate,
      smsCostPerOrder: fees?.smsCostPerOrder,
    });
  } catch {
    return getFeeConfig();
  }
}
