const statusColors: Record<string, { pill: string; dot: string }> = {
  pending: { pill: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  processing: { pill: "bg-sky-50 text-sky-700 ring-sky-600/20", dot: "bg-sky-500" },
  shipped: { pill: "bg-violet-50 text-violet-700 ring-violet-600/20", dot: "bg-violet-500" },
  delivered: { pill: "bg-brand-50 text-brand-700 ring-brand-600/20", dot: "bg-brand-600" },
  cancelled: { pill: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-500" },
};

const defaultColor = { pill: "bg-stone-100 text-stone-600 ring-stone-500/20", dot: "bg-stone-400" };

export function OrderStatusBadge({ status }: { status: string }) {
  const c = statusColors[status] ?? defaultColor;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${c.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}
