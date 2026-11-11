/** Shared number formatting for the store and admin panel. */

/** ₹1,234 — whole rupees (prices, totals in lists and cards). */
export function formatINR(n: number | string): string {
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

/** ₹1,234.50 — keeps paise (order detail, packing slip, tracking). */
export function formatINRExact(n: number | string): string {
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
