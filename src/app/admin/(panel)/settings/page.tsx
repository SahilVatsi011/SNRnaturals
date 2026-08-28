import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULTS } from "@/lib/constants";
import { getFeeConfig } from "@/lib/pricing";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";
import {
  upsertDeliverySlab,
  deleteDeliverySlab,
  saveFeeConfig,
  saveLowStockThreshold,
} from "./actions";

export const dynamic = "force-dynamic";

function kg(g: number | null | undefined) {
  if (g == null) return "No limit";
  return g >= 1000 ? `${g / 1000} kg` : `${g} g`;
}

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-stone-800">Settings</h1>
        <NotConfiguredBanner />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: slabs }, { data: settings }] = await Promise.all([
    supabase
      .from("delivery_slabs")
      .select("*")
      .order("min_weight_grams")
      .order("max_weight_grams", { ascending: true, nullsFirst: false }),
    supabase.from("settings").select("*"),
  ]);

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
      <h1 className="mb-6 text-2xl font-bold text-stone-800">Settings</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Delivery slabs */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Delivery Fee Slabs (by weight)"
            subtitle="Admin-editable. Used to calculate delivery fee from cart weight."
          />

          <div className="mb-5 overflow-hidden rounded border border-stone-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
                  <th className="px-3 py-2">Min</th>
                  <th className="px-3 py-2">Max</th>
                  <th className="px-3 py-2">Fee</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {(slabs ?? []).map((s) => (
                  <tr key={s.id} className="border-b border-stone-100">
                    <td className="px-3 py-2">{kg(s.min_weight_grams)}</td>
                    <td className="px-3 py-2">{kg(s.max_weight_grams)}</td>
                    <td className="px-3 py-2 font-medium">
                      ₹{Number(s.price).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          s.active
                            ? "bg-green-100 text-green-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <form action={deleteDeliverySlab}>
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="text-sm text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {(slabs ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-stone-400">
                      No slabs yet. Add one below.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <form action={upsertDeliverySlab} className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label htmlFor="min_weight_grams">Min (g)</Label>
              <Input
                id="min_weight_grams"
                name="min_weight_grams"
                type="number"
                defaultValue={0}
                required
              />
            </div>
            <div>
              <Label htmlFor="max_weight_grams">Max (g) — blank = no limit</Label>
              <Input
                id="max_weight_grams"
                name="max_weight_grams"
                type="number"
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <Label htmlFor="price">Fee (₹)</Label>
              <Input id="price" name="price" type="number" step="0.01" required />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                Active
              </label>
              <Button type="submit">Add slab</Button>
            </div>
          </form>
          <p className="mt-2 text-xs text-stone-400">
            Delivery fee is selected by the slab whose range contains the total
            cart weight.
          </p>
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
            <Button type="submit" variant="secondary">Save fee settings</Button>
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
            <Button type="submit" variant="secondary">Save threshold</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
