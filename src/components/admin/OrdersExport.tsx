"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DEFAULTS } from "@/lib/constants";

function formatOrderNo(orderNo: number) {
  return `SNR-${(10000 + orderNo).toString()}`;
}

function dateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isoDateInputValue() {
  const now = new Date();
  const end = dateStr(now);
  const start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  return { start: dateStr(start), end };
}

function localDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} ${d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function itemsSummary(items?: { name?: string; qty?: number }[]) {
  return (items ?? [])
    .map((i) => `${i.name || "Item"} × ${i.qty ?? 1}`)
    .join(", ");
}

function itemsCount(items?: { qty?: number }[]) {
  return (items ?? []).reduce((s, i) => s + (i.qty || 0), 0);
}

type ExportOrder = {
  order_no: number | null;
  order_token: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  email: string | null;
  items?: { name?: string; qty?: number }[];
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  coupon_code: string | null;
  total: number;
  payment_status: string;
  payment_method: string | null;
  order_status: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
};

function toExcelRows(orders: ExportOrder[]) {
  return orders.map((o) => ({
    "Order No": formatOrderNo(o.order_no ?? 0),
    "Date/Time": localDateTime(o.created_at),
    Customer: o.customer_name,
    Phone: o.customer_phone,
    Email: o.email || "",
    "Items Detail": itemsSummary(o.items),
    Items: itemsCount(o.items),
    Subtotal: o.subtotal,
    Discount: o.discount_amount,
    Delivery: o.delivery_fee,
    Coupon: o.coupon_code || "",
    Total: o.total,
    Payment: o.payment_status,
    "Pay Method": o.payment_method || "",
    Status: o.order_status,
    Address: o.address_line1,
    City: o.city,
    State: o.state,
    Pincode: o.pincode,
  }));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function OrdersExport({ initialStatus = "" }: { initialStatus?: string }) {
  const defaults = useMemo(() => isoDateInputValue(), []);
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [status, setStatus] = useState(initialStatus || "all");
  const [busy, setBusy] = useState<"excel" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchOrders() {
    if (!start || !end) {
      setError("Select both start and end dates.");
      return null;
    }
    if (start > end) {
      setError("Start date cannot be after end date.");
      return null;
    }
    setError(null);
    const params = new URLSearchParams({ start, end, status: status || "all" });
    const res = await fetch(`/api/admin/orders/export?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Export failed. Please try again.");
      return null;
    }
    if (!Array.isArray(data.orders)) {
      setError("No data returned for this range.");
      return null;
    }
    return data.orders as ExportOrder[];
  }

  function exportExcel(orders: ExportOrder[]) {
    const rows = toExcelRows(orders);
    const wb = XLSX.utils.book_new();

    const paid = orders.filter((o) => o.payment_status === "paid");
    const totalRevenue = paid.reduce((s, o) => s + Number(o.total || 0), 0);
    const summary: (string | number)[][] = [
      ["SNR Naturals — Orders Report"],
      ["Period", `${start} to ${end}`],
      ["Status filter", status === "all" ? "All" : status],
      ["Total orders", orders.length],
      ["Paid orders", paid.length],
      ["Revenue (paid)", totalRevenue.toFixed(2)],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const ws = XLSX.utils.json_to_sheet(
      rows.length ? rows : [{ "Order No": "", "Date/Time": "" }]
    );
    ws["!cols"] = [
      { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 22 },
      { wch: 46 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 32 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Orders");

    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(blob, `snr_orders_${start}_${end}.xlsx`);
  }

  function exportPdf(orders: ExportOrder[]) {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(5, 150, 105);
    doc.text("SNR Naturals — Orders Report", 40, 36);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    const paid = orders.filter((o) => o.payment_status === "paid");
    const totalRevenue = paid.reduce((s, o) => s + Number(o.total || 0), 0);
    doc.text(
      `Period: ${start} to ${end}  |  Status: ${
        status === "all" ? "All" : status
      }  |  Generated: ${localDateTime(new Date().toISOString())}`,
      40,
      52
    );
    doc.text(
      `Total orders: ${orders.length}   Paid: ${paid.length}   Revenue: Rs. ${totalRevenue.toFixed(
        2
      )}`,
      40,
      66
    );

    autoTable(doc, {
      startY: 78,
      head: [["Order", "Date", "Customer", "Phone", "Items", "Total (Rs.)", "Payment", "Status"]],
      body: orders.map((o) => [
        formatOrderNo(o.order_no ?? 0),
        localDateTime(o.created_at),
        o.customer_name,
        o.customer_phone,
        itemsSummary(o.items),
        Number(o.total).toFixed(2),
        o.payment_status,
        o.order_status,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [5, 150, 105], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 40, right: 40 },
    });

    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `SNR Naturals  ·  Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: "center" }
      );
    }
    doc.save(`snr_orders_${start}_${end}.pdf`);
  }

  async function handleExport(kind: "excel" | "pdf") {
    setBusy(kind);
    try {
      const orders = await fetchOrders();
      if (orders === null) return;
      if (orders.length === 0) {
        window.alert("No orders found for this range.");
        return;
      }
      if (kind === "excel") exportExcel(orders);
      else exportPdf(orders);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3">
      <div className="flex flex-wrap items-end gap-3">
        <span className="text-sm font-semibold text-stone-700">Export orders</span>
        <label className="flex flex-col text-xs text-stone-500">
          From
          <input
            type="date"
            value={start}
            max={end}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-800"
          />
        </label>
        <label className="flex flex-col text-xs text-stone-500">
          To
          <input
            type="date"
            value={end}
            min={start}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-800"
          />
        </label>
        <label className="flex flex-col text-xs text-stone-500">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-800"
          >
            <option value="all">All</option>
            {DEFAULTS.orderStatuses.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        {error && <span className="text-xs font-medium text-red-600">{error}</span>}
        <button
          type="button"
          onClick={() => handleExport("excel")}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {busy === "excel" ? "Exporting..." : "⬇ Excel"}
        </button>
        <button
          type="button"
          onClick={() => handleExport("pdf")}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {busy === "pdf" ? "Exporting..." : "⬇ PDF"}
        </button>
      </div>
    </div>
  );
}