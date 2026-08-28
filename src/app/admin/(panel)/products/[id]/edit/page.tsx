import { notFound } from "next/navigation";
import { ProductForm, type ProductFormData } from "@/components/admin/ProductForm";
import { updateProduct } from "../../actions";
import { fetchFeeConfig } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return <NotConfiguredBanner />;
  }

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const feeConfig = await fetchFeeConfig();

  const initial: ProductFormData = {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    mrp: Number(product.mrp || 0),
    price: Number(product.price),
    weight_grams: Number(product.weight_grams || 0),
    length_cm: Number(product.length_cm || 0),
    width_cm: Number(product.width_cm || 0),
    height_cm: Number(product.height_cm || 0),
    stock_qty: Number(product.stock_qty || 0),
    category: product.category ?? "",
    active: Boolean(product.active),
    images: Array.isArray(product.images) ? product.images : [],
  };

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-stone-800">
        Edit Product — {product.name}
      </h1>
      <ProductForm
        initial={initial}
        feeConfig={feeConfig}
        createAction={async () => {}}
        updateAction={updateProduct}
      />
    </div>
  );
}
