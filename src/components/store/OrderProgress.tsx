const STEPS = [
  {
    key: "pending",
    label: "Placed",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    key: "processing",
    label: "Preparing",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    key: "shipped",
    label: "Shipped",
    icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: "M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9.5z",
  },
];

/** Number of completed steps (1 = placed … 4 = delivered). */
export function orderStep(status: string): number {
  const i = STEPS.findIndex((s) => s.key === status);
  return i === -1 ? 1 : i + 1;
}

/** Friendly one-line description of where the order is. */
export function orderStatusMessage(status: string): string {
  switch (status) {
    case "pending":
      return "We've received your order and will start preparing it soon.";
    case "processing":
      return "Your order is being packed by hand in Sundernagar.";
    case "shipped":
      return "Your order is on its way to you.";
    case "delivered":
      return "Your order has been delivered. Enjoy!";
    case "cancelled":
      return "This order was cancelled.";
    default:
      return "";
  }
}

/** Horizontal Placed → Preparing → Shipped → Delivered tracker. */
export function OrderProgress({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
        This order was cancelled.
      </div>
    );
  }

  const step = orderStep(status);
  return (
    <ol className="flex items-start" aria-label="Order progress">
      {STEPS.map((s, i) => {
        const done = i < step;
        const current = i === step - 1;
        return (
          <li key={s.key} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                className={`absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2 ${
                  i < step ? "bg-brand-600" : "bg-stone-200"
                }`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition ${
                done ? "bg-brand-700 text-white" : "bg-white text-stone-300 ring-2 ring-stone-200"
              } ${current ? "ring-4 ring-brand-100" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon} />
              </svg>
            </span>
            <span className={`mt-2 text-[11px] font-medium sm:text-xs ${done ? "text-ink" : "text-stone-400"}`}>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
