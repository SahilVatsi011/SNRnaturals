"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProductActive, type ActionResult } from "@/app/admin/(panel)/products/actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { formatINR } from "@/lib/format";

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  weight_grams: number;
  stock_qty: number;
  category: string | null;
  images: string[] | null;
  active: boolean;
}

type Filter = "all" | "active" | "hidden";

export function ProductTable({
  products,
  lowStockThreshold,
}: {
  products: AdminProductRow[];
  lowStockThreshold: number;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      all: products.length,
      active: products.filter((p) => p.active).length,
      hidden: products.filter((p) => !p.active).length,
    }),
    [products]
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "active" && !p.active) return false;
      if (filter === "hidden" && p.active) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term) ||
        (p.category ?? "").toLowerCase().includes(term)
      );
    });
  }, [products, filter, query]);

  function toggleActive(product: AdminProductRow) {
    setError(null);
    setBusyId(product.id);
    startTransition(async () => {
      const res: ActionResult = await setProductActive(
        product.id,
        !product.active
      );
      setBusyId(null);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "hidden", label: "Hidden" },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-stone-200/60 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                filter === t.key
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {t.label}{" "}
              <span className="text-xs text-stone-400">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, slug or category…"
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 sm:max-w-xs"
        />
      </div>

      {error && (
        <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
      )}

      {/* Mobile: product cards */}
      <ul className="space-y-3 md:hidden">
        {visible.length === 0 && (
          <li className="rounded-2xl bg-white p-8 text-center text-sm text-stone-400 shadow-sm ring-1 ring-black/5">
            {products.length === 0
              ? "No products yet. Add your first product."
              : "No products match this filter."}
          </li>
        )}
        {visible.map((p) => {
          const low = p.stock_qty <= lowStockThreshold;
          return (
            <li
              key={p.id}
              className={`rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 ${p.active ? "" : "opacity-75"}`}
            >
              <div className="flex gap-3">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-black/5" />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-2xl">📦</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{p.name}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                        p.active ? "bg-brand-50 text-brand-700 ring-brand-600/20" : "bg-stone-100 text-stone-500 ring-stone-500/20"
                      }`}
                    >
                      {p.active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs capitalize text-stone-500">
                    {p.category || "No category"}
                    {p.weight_grams ? ` · ${p.weight_grams}g` : ""}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-base font-bold text-ink">{formatINR(Number(p.price))}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        low ? "bg-red-50 text-red-600" : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {p.stock_qty} in stock
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-3">
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="flex-1 rounded-xl bg-ink py-2 text-center text-sm font-semibold text-white"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => toggleActive(p)}
                  disabled={busyId === p.id}
                  className="flex-1 rounded-xl bg-stone-100 py-2 text-sm font-semibold text-stone-700 disabled:opacity-50"
                >
                  {busyId === p.id ? "…" : p.active ? "Hide" : "Show"}
                </button>
                <div className="flex shrink-0 items-center px-2">
                  <DeleteProductButton
                    product={{
                      id: p.id,
                      name: p.name,
                      price: Number(p.price),
                      image: p.images?.[0] ?? null,
                      active: p.active,
                    }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5 md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/70 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-stone-400"
                >
                  {products.length === 0
                    ? "No products yet. Add your first product."
                    : "No products match this filter."}
                </td>
              </tr>
            )}
            {visible.map((p) => (
              <tr
                key={p.id}
                className={`border-b border-stone-100 last:border-0 ${
                  p.active ? "" : "bg-stone-50/70"
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-11 w-11 rounded-xl object-cover ring-1 ring-black/5"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-400">
                        📦
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-stone-800">
                        {p.name}
                      </div>
                      <div className="text-xs text-stone-400">{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{formatINR(Number(p.price))}</td>
                <td className="px-4 py-3">
                  {p.weight_grams ? `${p.weight_grams}g` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.stock_qty <= lowStockThreshold
                        ? "font-medium text-red-600"
                        : "text-stone-700"
                    }
                  >
                    {p.stock_qty}
                    {p.stock_qty <= lowStockThreshold && (
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
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      p.active
                        ? "bg-brand-50 text-brand-700 ring-brand-600/20"
                        : "bg-stone-100 text-stone-500 ring-stone-500/20"
                    }`}
                  >
                    {p.active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-200"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleActive(p)}
                      disabled={busyId === p.id}
                      className="font-medium text-stone-500 hover:text-stone-700 hover:underline disabled:opacity-50"
                    >
                      {busyId === p.id
                        ? "…"
                        : p.active
                          ? "Hide"
                          : "Show"}
                    </button>
                    <DeleteProductButton
                      product={{
                        id: p.id,
                        name: p.name,
                        price: Number(p.price),
                        image: p.images?.[0] ?? null,
                        active: p.active,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
