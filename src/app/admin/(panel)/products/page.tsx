import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULTS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";

export const dynamic = "force-dynamic";

function currency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default async function ProductsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-800">Products</h1>
        </div>
        <NotConfiguredBanner />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: products }, { data: settings }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("settings").select("*").eq("key", "lowStockThreshold").single(),
  ]);

  const threshold =
    (settings?.value as number) ?? DEFAULTS.lowStockThreshold;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">
          Products{" "}
          <span className="text-base font-normal text-stone-400">
            ({products?.length ?? 0})
          </span>
        </h1>
        <Link href="/admin/products/new">
          <Button>+ Add Product</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                  No products yet. Add your first product.
                </td>
              </tr>
            )}
            {(products ?? []).map((p) => (
              <tr
                key={p.id}
                className="border-b border-stone-100 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-stone-100 text-stone-400">
                        📦
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-stone-800">{p.name}</div>
                      <div className="text-xs text-stone-400">{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{currency(Number(p.price))}</td>
                <td className="px-4 py-3">
                  {p.weight_grams ? `${p.weight_grams}g` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.stock_qty <= threshold
                        ? "font-medium text-red-600"
                        : "text-stone-700"
                    }
                  >
                    {p.stock_qty}
                    {p.stock_qty <= threshold && (
                      <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                        low
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 capitalize text-stone-600">
                  {p.category || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      p.active
                        ? "bg-green-100 text-green-700"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {p.active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
