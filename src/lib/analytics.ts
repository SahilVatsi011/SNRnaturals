/**
 * Analytics helpers for the admin revenue panel.
 *
 * All date maths is done in Asia/Kolkata (IST) because the store operates
 * on Indian local time, while `orders.created_at` is stored as timestamptz
 * (UTC). IST has no DST, so a fixed +05:30 offset is safe.
 */

export const IST_OFFSET_MINUTES = 330;
export const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;
export const MAX_RANGE_DAYS = 366;
export const DEFAULT_RANGE_DAYS = 30;

export type DatePreset =
  | "today"
  | "7d"
  | "30d"
  | "month"
  | "lastmonth"
  | "custom";

export interface DateRange {
  /** Inclusive start date, YYYY-MM-DD (IST) */
  from: string;
  /** Inclusive end date, YYYY-MM-DD (IST) */
  to: string;
  preset: DatePreset;
}

export interface OrderItem {
  product_id?: string | null;
  name?: string | null;
  price?: number | null;
  qty?: number | null;
  weight_grams?: number | null;
}

export interface AnalyticsOrder {
  created_at: string;
  total: number | string | null;
  subtotal?: number | string | null;
  delivery_fee?: number | string | null;
  discount_amount?: number | string | null;
  payment_status: string | null;
  order_status: string | null;
  items?: OrderItem[] | null;
  customer_phone?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Date helpers                                                               */
/* -------------------------------------------------------------------------- */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in IST as YYYY-MM-DD. */
export function todayIST(now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Convert YYYY-MM-DD (IST) to a UTC ISO instant at 00:00 IST. */
export function istStartOfDay(date: string): Date {
  return new Date(`${date}T00:00:00.000+05:30`);
}

/** Convert YYYY-MM-DD (IST) to a UTC ISO instant at 23:59:59.999 IST. */
export function istEndOfDay(date: string): Date {
  return new Date(`${date}T23:59:59.999+05:30`);
}

/** Shift a YYYY-MM-DD string by N days (calendar days, IST). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return date;
  }
  const shifted = new Date(Date.UTC(y, m - 1, d) + days * 24 * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${String(
    shifted.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

/** Whole days between two YYYY-MM-DD strings (inclusive count = diff + 1). */
export function daysBetween(from: string, to: string): number {
  const diff =
    istStartOfDay(to).getTime() - istStartOfDay(from).getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

/** The IST calendar day (YYYY-MM-DD) an instant falls into. */
export function istDayKey(iso: string): string {
  return new Date(new Date(iso).getTime() + IST_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

/** First day of the month for a YYYY-MM-DD string. */
function startOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = istStartOfDay(value);
  return !Number.isNaN(d.getTime());
}

/**
 * Resolve the requested range into a safe, validated range.
 * Invalid input falls back to the last 30 days; reversed ranges are swapped;
 * over-long ranges are clamped to MAX_RANGE_DAYS.
 */
export function resolveRange(params: {
  from?: string | null;
  to?: string | null;
  preset?: string | null;
  now?: Date;
}): DateRange {
  const today = todayIST(params.now);
  const rawPreset = (params.preset ?? "").toString();

  let from = params.from ?? "";
  let to = params.to ?? "";
  let preset: DatePreset = (
    ["today", "7d", "30d", "month", "lastmonth", "custom"].includes(rawPreset)
      ? rawPreset
      : "custom"
  ) as DatePreset;

  if (!isValidDateString(from) || !isValidDateString(to)) {
    from = addDays(today, -(DEFAULT_RANGE_DAYS - 1));
    to = today;
    preset = "30d";
  }

  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
    preset = "custom";
  }

  const span = daysBetween(from, to);
  if (span > MAX_RANGE_DAYS) {
    from = addDays(to, -(MAX_RANGE_DAYS - 1));
    preset = "custom";
  }

  return { from, to, preset };
}

/** The equal-length period immediately before the given range. */
export function previousRange(range: DateRange): DateRange {
  const length = daysBetween(range.from, range.to);
  const prevTo = addDays(range.from, -1);
  const prevFrom = addDays(prevTo, -(length - 1));
  return { from: prevFrom, to: prevTo, preset: "custom" };
}

/** Preset ranges available in the UI. */
export function presetRanges(now: Date = new Date()): Record<
  Exclude<DatePreset, "custom">,
  { from: string; to: string }
> {
  const today = todayIST(now);
  const thisMonthStart = startOfMonth(today);
  const lastMonthEnd = addDays(thisMonthStart, -1);
  const lastMonthStart = startOfMonth(lastMonthEnd);

  return {
    today: { from: today, to: today },
    "7d": { from: addDays(today, -6), to: today },
    "30d": { from: addDays(today, -(DEFAULT_RANGE_DAYS - 1)), to: today },
    month: { from: thisMonthStart, to: today },
    lastmonth: { from: lastMonthStart, to: lastMonthEnd },
  };
}

/** Human friendly label for a range, e.g. "1 Sep – 30 Sep 2026 (IST)". */
export function rangeLabel(from: string, to: string): string {
  const fmt = (d: string) =>
    new Date(istStartOfDay(d)).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  if (from === to) return `${fmt(from)} (IST)`;
  return `${fmt(from)} – ${fmt(to)} (IST)`;
}

/* -------------------------------------------------------------------------- */
/* Aggregation                                                                */
/* -------------------------------------------------------------------------- */

export interface DailyPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  units: number;
}

export interface ProductStat {
  productId: string;
  name: string;
  category: string;
  units: number;
  revenue: number;
  share: number;
}

export interface CategoryStat {
  category: string;
  units: number;
  revenue: number;
}

export interface StatusCount {
  key: string;
  label: string;
  count: number;
  value: number;
}

export interface Metrics {
  revenue: number;
  orders: number;
  aov: number;
  units: number;
  discount: number;
  shipping: number;
  goods: number;
  cancelledCount: number;
  cancelledValue: number;
  refundedCount: number;
  pendingCount: number;
  customerCount: number;
}

export interface AnalyticsSummary {
  metrics: Metrics;
  daily: DailyPoint[];
  products: ProductStat[];
  categories: CategoryStat[];
  statuses: StatusCount[];
}

/** Revenue counts only paid orders that were not cancelled. */
export function isRevenueOrder(order: AnalyticsOrder): boolean {
  return order.payment_status === "paid" && order.order_status !== "cancelled";
}

function num(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function dayLabel(date: string): string {
  return new Date(istStartOfDay(date)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Aggregate orders into the numbers the analytics page renders.
 * `orders` should already be filtered to the requested date range.
 */
export function summarize(
  orders: AnalyticsOrder[],
  options: {
    from: string;
    to: string;
    productCategories?: Map<string, string>;
  }
): AnalyticsSummary {
  const { from, to, productCategories } = options;

  const dailyMap = new Map<string, DailyPoint>();
  for (
    let d = from, guard = 0;
    d <= to && guard <= MAX_RANGE_DAYS + 1;
    d = addDays(d, 1), guard += 1
  ) {
    dailyMap.set(d, { date: d, label: dayLabel(d), revenue: 0, orders: 0, units: 0 });
  }

  const productMap = new Map<string, ProductStat>();
  const categoryMap = new Map<string, CategoryStat>();
  const statusMap = new Map<string, StatusCount>();
  const customers = new Set<string>();

  let revenue = 0;
  let units = 0;
  let discount = 0;
  let shipping = 0;
  let goods = 0;
  let cancelledCount = 0;
  let cancelledValue = 0;
  let refundedCount = 0;
  let pendingCount = 0;
  let orderCount = 0;

  const bumpStatus = (key: string, label: string, order: AnalyticsOrder) => {
    const existing = statusMap.get(key);
    if (existing) {
      existing.count += 1;
      existing.value += num(order.total);
    } else {
      statusMap.set(key, { key, label, count: 1, value: num(order.total) });
    }
  };

  for (const order of orders) {
    const day = istDayKey(order.created_at);
    const point = dailyMap.get(day);

    if (order.payment_status === "refunded") {
      refundedCount += 1;
      bumpStatus("refunded", "Refunded", order);
      continue;
    }

    if (order.order_status === "cancelled") {
      cancelledCount += 1;
      cancelledValue += num(order.total);
      bumpStatus("cancelled", "Cancelled", order);
      continue;
    }

    if (order.payment_status !== "paid") {
      pendingCount += 1;
      bumpStatus(
        order.payment_status === "failed" ? "failed" : "pending",
        order.payment_status === "failed" ? "Failed" : "Pending",
        order
      );
      continue;
    }

    // ---- paid, not cancelled: counts as revenue ----
    const orderRevenue = num(order.total);
    const orderUnits = (order.items ?? []).reduce(
      (sum, item) => sum + (item.qty ?? 0),
      0
    );

    revenue += orderRevenue;
    units += orderUnits;
    orderCount += 1;
    discount += num(order.discount_amount);
    shipping += num(order.delivery_fee);
    bumpStatus("paid", "Paid", order);

    if (order.customer_phone) customers.add(order.customer_phone);

    if (point) {
      point.revenue += orderRevenue;
      point.orders += 1;
      point.units += orderUnits;
    }

    for (const item of order.items ?? []) {
      const qty = item.qty ?? 0;
      const lineRevenue = num(item.price) * qty;
      goods += lineRevenue;

      const productId = item.product_id ?? item.name ?? "unknown";
      const name = item.name ?? "Unknown product";
      const category = productCategories?.get(productId) ?? "Other";

      const existing = productMap.get(productId);
      if (existing) {
        existing.units += qty;
        existing.revenue += lineRevenue;
      } else {
        productMap.set(productId, {
          productId,
          name,
          category,
          units: qty,
          revenue: lineRevenue,
          share: 0,
        });
      }

      const cat = categoryMap.get(category);
      if (cat) {
        cat.units += qty;
        cat.revenue += lineRevenue;
      } else {
        categoryMap.set(category, {
          category,
          units: qty,
          revenue: lineRevenue,
        });
      }
    }
  }

  const products = Array.from(productMap.values())
    .map((p) => ({
      ...p,
      share: goods > 0 ? p.revenue / goods : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.units - a.units);

  const categories = Array.from(categoryMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  const statuses = Array.from(statusMap.values()).sort(
    (a, b) => b.count - a.count
  );

  return {
    metrics: {
      revenue,
      orders: orderCount,
      aov: orderCount > 0 ? revenue / orderCount : 0,
      units,
      discount,
      shipping,
      goods,
      cancelledCount,
      cancelledValue,
      refundedCount,
      pendingCount,
      customerCount: customers.size,
    },
    daily: Array.from(dailyMap.values()),
    products,
    categories,
    statuses,
  };
}

/* -------------------------------------------------------------------------- */
/* Comparison                                                                 */
/* -------------------------------------------------------------------------- */

export interface Comparison {
  revenueDelta: number | null;
  ordersDelta: number | null;
  aovDelta: number | null;
  unitsDelta: number | null;
}

/** Percentage change between the current and previous period. */
export function compareMetrics(
  current: Metrics,
  previous: Metrics
): Comparison {
  const pct = (now: number, before: number): number | null => {
    if (!before) return null;
    return ((now - before) / before) * 100;
  };

  return {
    revenueDelta: pct(current.revenue, previous.revenue),
    ordersDelta: pct(current.orders, previous.orders),
    aovDelta: pct(current.aov, previous.aov),
    unitsDelta: pct(current.units, previous.units),
  };
}

/** Compact currency helper for the admin UI. */
export function rupees(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
