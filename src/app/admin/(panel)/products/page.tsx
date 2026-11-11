import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULTS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";
import {
  ProductTable,
  type AdminProductRow,
} from "@/components/admin/ProductTable";

export const dynamic = "force-dynamic";

const PRODUCT_FIELDS =
  "id,name,slug,price,weight_grams,stock_qty,category,images,active";

export default async function ProductsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Products</h1>
        </div>
        <NotConfiguredBanner />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: products }, { data: settings }] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_FIELDS)
      .order("name"),
    supabase.from("settings").select("*").eq("key", "lowStockThreshold").single(),
  ]);

  const threshold =
    (settings?.value as number) ?? DEFAULTS.lowStockThreshold;

  const rows: AdminProductRow[] = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    weight_grams: Number(p.weight_grams ?? 0),
    stock_qty: Number(p.stock_qty ?? 0),
    category: p.category ?? null,
    images: Array.isArray(p.images) ? p.images : [],
    active: Boolean(p.active),
  }));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Products{" "}
          <span className="text-base font-normal text-stone-400">
            ({rows.length})
          </span>
        </h1>
        <Link href="/admin/products/new">
          <Button>+ Add Product</Button>
        </Link>
      </div>

      <ProductTable products={rows} lowStockThreshold={threshold} />
    </div>
  );
}
