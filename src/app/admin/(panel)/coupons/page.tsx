import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";
import { createCoupon, deleteCoupon, toggleCouponActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-stone-800">Coupons</h1>
        <NotConfiguredBanner />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-800">Coupons</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coupons list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="All Coupons"
              subtitle="Manage discount coupons for your store."
            />

            <div className="overflow-hidden rounded border border-stone-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Discount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(coupons ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                        No coupons yet. Create one using the form.
                      </td>
                    </tr>
                  )}
                  {(coupons ?? []).map((c) => (
                    <tr key={c.id} className="border-b border-stone-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-stone-800">{c.name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-brand-50 px-2 py-0.5 font-mono text-xs font-bold text-brand-700">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        {Number(c.discount_percent)}% OFF
                      </td>
                      <td className="px-4 py-3">
                        <form action={toggleCouponActive} className="inline">
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="active" value={String(c.active)} />
                          <button
                            type="submit"
                            className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                              c.active
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                            }`}
                          >
                            {c.active ? "Active" : "Inactive"}
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form action={deleteCoupon} className="inline">
                          <input type="hidden" name="id" value={c.id} />
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
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Create coupon form */}
        <div>
          <Card>
            <CardHeader
              title="Create Coupon"
              subtitle="Add a new discount coupon."
            />
            <form action={createCoupon} className="space-y-4">
              <div>
                <Label htmlFor="name">Coupon Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Diwali Sale"
                />
              </div>
              <div>
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  placeholder="e.g. DIWALI20"
                  className="font-mono uppercase"
                />
                <p className="mt-1 text-xs text-stone-400">
                  Customer will enter this code at checkout.
                </p>
              </div>
              <div>
                <Label htmlFor="discount_percent">Discount (%)</Label>
                <Input
                  id="discount_percent"
                  name="discount_percent"
                  type="number"
                  min={1}
                  max={100}
                  step="0.01"
                  required
                  placeholder="e.g. 10"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                Active (customers can use this code)
              </label>
              <Button type="submit" className="w-full">
                Create Coupon
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
