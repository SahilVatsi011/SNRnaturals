"use client";

import * as XLSX from "xlsx";
import type { AnalyticsSummary, DateRange } from "@/lib/analytics";

export default function AnalyticsExport({
  summary,
  range,
  previousSummary,
}: {
  summary: AnalyticsSummary;
  range: DateRange;
  previousSummary?: AnalyticsSummary | null;
}) {
  const download = () => {
    const wb = XLSX.utils.book_new();

    // ---- Summary ----
    const m = summary.metrics;
    const prev = previousSummary?.metrics;
    const summaryRows: (string | number)[][] = [
      ["SNR Naturals — Sales Analytics"],
      [],
      ["Period", `${range.from} to ${range.to} (IST)`],
      ["Metric", "Value"],
      ["Revenue", m.revenue],
      ["Paid Orders", m.orders],
      ["Average Order Value", Math.round(m.aov)],
      ["Units Sold", m.units],
      ["Product Sales (gross)", Math.round(m.goods)],
      ["Discounts Given", m.discount],
      ["Shipping Collected", m.shipping],
      ["Unique Customers", m.customerCount],
      ["Cancelled Orders", m.cancelledCount],
      ["Cancelled Value", Math.round(m.cancelledValue)],
      ["Refunded Orders", m.refundedCount],
      ["Pending / Failed Orders", m.pendingCount],
    ];
    if (prev) {
      summaryRows.push([], ["Previous Period Comparison", ""]);
      summaryRows.push(["Previous Revenue", prev.revenue]);
      summaryRows.push(["Previous Paid Orders", prev.orders]);
      summaryRows.push(["Previous AOV", Math.round(prev.aov)]);
      summaryRows.push(["Previous Units", prev.units]);
    }
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 28 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // ---- Daily revenue ----
    const dailyRows: (string | number)[][] = [
      ["Date", "Day", "Orders", "Revenue", "Units"],
      ...summary.daily.map((d) => [d.date, d.label, d.orders, d.revenue, d.units]),
    ];
    const wsDaily = XLSX.utils.aoa_to_sheet(dailyRows);
    wsDaily["!cols"] = [
      { wch: 14 },
      { wch: 12 },
      { wch: 10 },
      { wch: 14 },
      { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Revenue");

    // ---- Products ----
    const productRows: (string | number)[][] = [
      [
        "#",
        "Product",
        "Category",
        "Units Sold",
        "Revenue",
        "Share of Sales",
      ],
      ...summary.products.map((p, i) => [
        i + 1,
        p.name,
        p.category,
        p.units,
        Math.round(p.revenue),
        `${(p.share * 100).toFixed(1)}%`,
      ]),
    ];
    const wsProducts = XLSX.utils.aoa_to_sheet(productRows);
    wsProducts["!cols"] = [
      { wch: 5 },
      { wch: 32 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsProducts, "Top Products");

    // ---- Categories ----
    if (summary.categories.length > 0) {
      const catRows: (string | number)[][] = [
        ["Category", "Units Sold", "Revenue"],
        ...summary.categories.map((c) => [
          c.category,
          c.units,
          Math.round(c.revenue),
        ]),
      ];
      const wsCats = XLSX.utils.aoa_to_sheet(catRows);
      wsCats["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsCats, "Categories");
    }

    const file = `snr-analytics_${range.from}_to_${range.to}.xlsx`;
    XLSX.writeFile(wb, file);
  };

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
    >
      <span aria-hidden>⬇</span> Export Excel
    </button>
  );
}
