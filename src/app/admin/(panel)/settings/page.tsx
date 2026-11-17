import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULTS } from "@/lib/constants";
import { getFeeConfig } from "@/lib/pricing";
import { Card, CardHeader } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Input, Label } from "@/components/ui/Input";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";
import Link from "next/link";
import {
  saveFeeConfig,
  saveLowStockThreshold,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <NotConfiguredBanner />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("*");

  const feeConfig = getFeeConfig();

  const feeSetting = (settings ?? []).find((s) => s.key === "fees")?.value as
    | { razorpayFeeRate?: number; smsCostPerOrder?: number }
    | undefined;
  const thresholdSetting = (settings ?? []).find(
    (s) => s.key === "lowStockThreshold"
  )?.value;

  const currentThreshold =
    typeof thresholdSetting === "number"
      ? thresholdSetting
      : DEFAULTS.lowStockThreshold;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Settings</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Delivery charges moved to their own page */}
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">Delivery charges</h2>
              <p className="mt-0.5 text-sm text-stone-500">Weight-based rates, with different rates by PIN code.</p>
            </div>
            <Link href="/admin/delivery" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
              Manage delivery charges
            </Link>
          </div>
        </Card>

        {/* Fee config */}
        <Card>
          <CardHeader
            title="Fee Calculator Settings"
            subtitle="Fees baked into displayed prices."
          />
          <form action={saveFeeConfig} className="space-y-4">
            <div>
              <Label htmlFor="razorpayFeeRate">
                Razorpay fee rate (%) — currently{" "}
                {((feeSetting?.razorpayFeeRate ?? feeConfig.razorpayFeeRate) * 100).toFixed(2)}
                %
              </Label>
              <Input
                id="razorpayFeeRate"
                name="razorpayFeeRate"
                type="number"
                step="0.01"
                defaultValue={
                  (feeSetting?.razorpayFeeRate ?? feeConfig.razorpayFeeRate) * 100
                }
              />
            </div>
            <div>
              <Label htmlFor="smsCostPerOrder">
                SMS cost per order (₹)
              </Label>
              <Input
                id="smsCostPerOrder"
                name="smsCostPerOrder"
                type="number"
                step="0.01"
                defaultValue={feeSetting?.smsCostPerOrder ?? feeConfig.smsCostPerOrder}
              />
            </div>
            <SubmitButton variant="secondary" pendingLabel="Saving…">Save fee settings</SubmitButton>
          </form>
        </Card>

        {/* Low stock */}
        <Card>
          <CardHeader
            title="Low-Stock Alert"
            subtitle="Items at or below this stock level show as low."
          />
          <form action={saveLowStockThreshold} className="space-y-4">
            <div>
              <Label htmlFor="lowStockThreshold">Threshold (qty)</Label>
              <Input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                defaultValue={currentThreshold}
              />
            </div>
            <SubmitButton variant="secondary" pendingLabel="Saving…">Save threshold</SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
