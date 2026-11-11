"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  deleteProduct,
  getProductUsage,
  setProductActive,
  type ActionResult,
  type ProductUsage,
} from "@/app/admin/(panel)/products/actions";
import { formatINR } from "@/lib/format";

interface DeleteProductButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image?: string | null;
    active: boolean;
  };
  /** "row" = small text link in the products table, "danger" = full button */
  variant?: "row" | "danger";
}

export function DeleteProductButton({
  product,
  variant = "row",
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<ProductUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function openModal() {
    setOpen(true);
    setError(null);
    setConfirmName("");
    setUsage(null);
    setUsageLoading(true);
    getProductUsage(product.id)
      .then(setUsage)
      .catch(() => setUsage({ orderCount: 0, sampleOrderNos: [] }))
      .finally(() => setUsageLoading(false));
  }

  function closeModal() {
    if (pending) return;
    setOpen(false);
  }

  function handleUnlist() {
    setError(null);
    startTransition(async () => {
      const res: ActionResult = await setProductActive(
        product.id,
        !product.active
      );
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    setError(null);
    const fd = new FormData();
    fd.set("confirmName", confirmName);
    startTransition(async () => {
      const res: ActionResult = await deleteProduct(product.id, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  const nameMatches = confirmName.trim() === product.name;
  const hasOrders = (usage?.orderCount ?? 0) > 0;

  return (
    <>
      {variant === "row" ? (
        <button
          type="button"
          onClick={openModal}
          className="font-medium text-red-600 hover:underline"
        >
          Delete
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          className="w-full rounded border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete permanently
        </button>
      )}

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={closeModal}
          >
            <div
              className="w-full max-w-md rounded-lg bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-start justify-between border-b border-stone-200 p-5">
              <h2 className="text-base font-semibold text-ink">
                Remove product
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-stone-400 hover:text-stone-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt=""
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-stone-100 text-stone-400">
                    📦
                  </div>
                )}
                <div>
                  <div className="font-medium text-stone-800">
                    {product.name}
                  </div>
                  <div className="text-sm text-stone-500">
                    {formatINR(product.price)} ·{" "}
                    {product.active ? "Active" : "Hidden"}
                  </div>
                </div>
              </div>

              {usageLoading ? (
                <p className="text-sm text-stone-400">Checking order history…</p>
              ) : hasOrders ? (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-medium">
                    Used in {usage?.orderCount} past order
                    {usage?.orderCount === 1 ? "" : "s"}
                    {usage?.sampleOrderNos.length
                      ? ` (e.g. #${usage.sampleOrderNos.join(", #")})`
                      : ""}
                    .
                  </p>
                  <p className="mt-1">
                    Order history and invoices stay intact, but this product
                    will drop out of category-wise reports.
                  </p>
                </div>
              ) : null}

              <div className="rounded border border-stone-200 p-3">
                <p className="text-sm font-medium text-stone-700">
                  Hide from store (recommended)
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Removes the product from the storefront, search and checkout
                  instantly. You can bring it back any time.
                </p>
                <button
                  type="button"
                  onClick={handleUnlist}
                  disabled={pending}
                  className="mt-3 rounded bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
                >
                  {product.active ? "Hide from store" : "Restore to store"}
                </button>
              </div>

              <div className="rounded border border-red-200 p-3">
                <p className="text-sm font-medium text-red-700">
                  Delete permanently
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  This removes the product from the database for good. Type{" "}
                  <span className="font-medium text-stone-700">
                    {product.name}
                  </span>{" "}
                  below to confirm.
                </p>
                <input
                  ref={inputRef}
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={product.name}
                  className="mt-3 w-full rounded border border-stone-300 px-3 py-1.5 text-sm focus:border-red-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!nameMatches || pending}
                  className="mt-3 rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete permanently
                </button>
              </div>

              {error && (
                <p className="rounded bg-red-50 p-2 text-sm text-red-700">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}
