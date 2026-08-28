/**
 * Central business constants for SNR Naturals.
 * Stored as code defaults; overridable via Supabase `settings` table at runtime.
 */
export const STORE = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Sundergar Naturals",
  shortName: process.env.NEXT_PUBLIC_STORE_SHORT_NAME || "snrnaturals",
  domain: process.env.NEXT_PUBLIC_STORE_DOMAIN || "snrnaturalsfpc.com",
  phone: process.env.NEXT_PUBLIC_STORE_PHONE || "",
  city: "Sundergar",
  district: "Mandi",
  state: "Himachal Pradesh",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

/** Default economic constants; overridable via settings table. */
export const DEFAULTS = {
  // Razorpay fee fraction (~2.36% — includes 2% MDR + 0.18% GST on MDR)
  razorpayFeeRate: 0.0236,
  // Flat per-order SMS cost in rupees (smeared across price calc)
  smsCostPerOrder: 1.0,
  // Low-stock alert threshold (qty)
  lowStockThreshold: 10,
  // Order statuses
  orderStatuses: [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ] as const,
};
