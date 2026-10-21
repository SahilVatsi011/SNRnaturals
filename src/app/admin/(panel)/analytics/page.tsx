import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Card, CardHeader } from "@/components/ui/Card";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";
import DateRangePicker from "@/components/admin/DateRangePicker";
import AnalyticsExport from "@/components/admin/AnalyticsExport";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import TopProductsChart from "@/components/admin/charts/TopProductsChart";
import StatusChart from "@/components/admin/charts/StatusChart";
import {
  compareMetrics,
  daysBetween,
  istEndOfDay,
  istStartOfDay,
  previousRange,
  rangeLabel,
  resolveRange,
  rupees,
  summarize,
  type AnalyticsOrder,
  type DatePreset,
  type Metrics,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

const ORDER_COLUMNS =
  "created_at,total,subtotal,delivery_fee,discount_amount,payment_status,order_status,items,customer_phone";

/** Fetch every order in a range — PostgREST caps responses at 1000 rows. */
async function fetchOrders(
  supabase: Awaited<ReturnType<typeof createClient>>,
  from: string,
  to: string
): Promise<AnalyticsOrder[]> {
  const all: AnalyticsOrder[] = [];
  const pageSize = 1000;

  for (let offset = 0; offset < 20000; offset += pageSize) {
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .gte("created_at", istStartOfDay(from).toISOString())
      .lte("created_at", istEndOfDay(to).toISOString())
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("[analytics] order fetch failed:", error.message);
      break;
    }

    all.push(...((data ?? []) as AnalyticsOrder[]));
    if (!data || data.length < pageSize) break;
  }

  return all;
}

function Delta({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-xs font-normal text-stone-400">no comparison</span>
    );
  }
  const up = value >= 0;
  return (
    <span
      className={`text-xs font-semibold ${up ? "text-emerald-600" : "text-red-600"}`}
    >
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
      <span className="ml-1 font-normal text-stone-400">vs prev</span>
    </span>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
}) {
  const sp = await searchParams;
  const range = resolveRange({
    from: sp.from,
    to: sp.to,
    preset: sp.preset,
  });

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-stone-800">Analytics</h1>
        <NotConfiguredBanner />
      </div>
    );
  }

  const supabase = await createClient();
  const prev = previousRange(range);

  const [orders, prevOrders, productsRes] = await Promise.all([
    fetchOrders(supabase, range.from, range.to),
    fetchOrders(supabase, prev.from, prev.to),
    supabase.from("products").select("id,category"),
  ]);

  const productCategories = new Map<string, string>();
  for (const p of productsRes.data ?? []) {
    if (p.category) productCategories.set(p.id, p.category);
  }

  const summary = summarize(orders, {
    from: range.from,
    to: range.to,
    productCategories,
  });
  const prevSummary = summarize(prevOrders, {
    from: prev.from,
    to: prev.to,
    productCategories,
  });

  const comparison = compareMetrics(summary.metrics, prevSummary.metrics);
  const m: Metrics = summary.metrics;
  const clamped =
    daysBetween(range.from, range.to) >= 366 ||
    (sp.from && sp.to && sp.from !== range.from);

  const kpis: {
    label: string;
    value: string;
    delta: number | null;
    hint?: string;
  }[] = [
    { label: "Revenue", value: rupees(m.revenue), delta: comparison.revenueDelta },
    { label: "Paid Orders", value: String(m.orders), delta: comparison.ordersDelta },
    { label: "Average Order Value", value: rupees(Math.round(m.aov)), delta: comparison.aovDelta },
    { label: "Units Sold", value: String(m.units), delta: comparison.unitsDelta },
    {
      label: "Discounts Given",
      value: rupees(m.discount),
      delta: null,
      hint: "Coupons / offers",
    },
    {
      label: "Unique Customers",
      value: String(m.customerCount),
      delta: null,
    },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Analytics</h1>
          <p className="mt-1 text-sm text-stone-500">
            {rangeLabel(range.from, range.to)}
          </p>
        </div>
        <AnalyticsExport
          summary={summary}
          range={range}
          previousSummary={prevSummary}
        />
      </div>

      <DateRangePicker
        from={range.from}
        to={range.to}
        preset={range.preset as DatePreset}
      />

      {clamped ? (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Showing at most 366 days of data.
        </p>
      ) : null}

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="!p-4">
            <p className="text-sm text-stone-500">{k.label}</p>
            <p className="mt-1 text-2xl font-bold text-stone-800">{k.value}</p>
            <p className="mt-0.5">
              {k.delta !== null ? (
                <Delta value={k.delta} />
              ) : k.hint ? (
                <span className="text-xs font-normal text-stone-400">{k.hint}</span>
              ) : null}
            </p>
          </Card>
        ))}
      </div>

      {m.orders === 0 && m.cancelledCount === 0 && m.pendingCount === 0 ? (
        <Card>
          <div className="py-14 text-center">
            <p className="text-base font-medium text-stone-600">
              No orders in this period
            </p>
            <p className="mt-1 text-sm text-stone-400">
              Pick a different date range to see revenue and product sales.
            </p>
            <Link
              href="/admin/analytics"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Last 30 days
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Revenue trend */}
          <Card className="mb-6">
            <CardHeader
              title="Revenue Trend"
              subtitle="Day-wise performance (IST)"
            />
            <RevenueChart data={summary.daily} />
          </Card>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Top Products"
                subtitle="Ranked by sales in this period"
              />
              <TopProductsChart products={summary.products} />
            </Card>

            <Card>
              <CardHeader
                title="Order Status"
                subtitle="Payment and fulfilment breakdown"
              />
              <StatusChart statuses={summary.statuses} />
            </Card>
          </div>

          {/* Product table */}
          <Card className="mb-6">
            <CardHeader
              title="Product Sales"
              subtitle={`${summary.products.length} products sold in this period`}
            />
            {summary.products.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-500">
                No paid product sales in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Units</th>
                      <th className="px-4 py-3 text-right">Sales</th>
                      <th className="px-4 py-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.products.map((p, i) => (
                      <tr
                        key={p.productId}
                        className="border-b border-stone-100 last:border-0 hover:bg-stone-50"
                      >
                        <td className="px-4 py-3 text-stone-400">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-stone-800">
                          {p.name}
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {p.category}
                        </td>
                        <td className="px-4 py-3 text-right text-stone-700">
                          {p.units}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-stone-800">
                          {rupees(p.revenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-stone-500">
                          {(p.share * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Daily table */}
          <Card>
            <CardHeader
              title="Day-wise Breakdown"
              subtitle="Every day in the selected range"
            />
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-stone-50">
                  <tr className="border-b border-stone-200 text-left text-stone-500">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3 text-right">Orders</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Units</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.daily.map((d) => (
                    <tr
                      key={d.date}
                      className="border-b border-stone-100 last:border-0"
                    >
                      <td className="px-4 py-2.5 text-stone-600">{d.date}</td>
                      <td className="px-4 py-2.5 text-stone-500">{d.label}</td>
                      <td className="px-4 py-2.5 text-right text-stone-700">
                        {d.orders}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-stone-800">
                        {rupees(d.revenue)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-stone-700">
                        {d.units}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
