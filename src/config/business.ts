// src/config/business.ts
// ⚠️ PLACEHOLDERS — replace with real client details before going live.
// Business name/address/phone/email MUST match Razorpay dashboard + PAN/GST exactly.

export const business = {
  brandName: "SNR Naturals",
  legalName: "[LEGAL BUSINESS NAME]",
  ownerName: "[OWNER NAME]",
  gstin: "",
  websiteUrl: "https://snrnaturals.com",

  address: {
    line1: "[SHOP / BUILDING, STREET]",
    city: "Sundernagar",
    district: "Mandi",
    state: "Himachal Pradesh",
    pin: "[PIN]",
    country: "India",
  },

  contact: {
    phone: "+91 [PHONE]",
    whatsapp: "+91 [WHATSAPP]",
    email: "[support@example.com]",
    hours: "Monday to Saturday, 10:00 AM – 6:00 PM IST",
    replyTime: "24 working hours",
  },

  grievanceOfficer: {
    name: "[GRIEVANCE OFFICER NAME]",
    email: "[grievance@example.com]",
    phone: "+91 [PHONE]",
    ackTime: "48 hours",
  },

  about: {
    products: "pure, minimally processed natural products — e.g. pahadi ghee, honey, spices, pulses",
    sourcing: "local farmers and producers of Himachal Pradesh",
  },

  pricing: {
    taxNote: "inclusive of all applicable taxes",
    freeShippingAbove: 999 as number | null,
    shippingCharge: 60,
    shippingNoteOutsideHP: "",
  },

  shipping: {
    deliveryArea: "across India",
    dispatchTime: "1–3 working days",
    deliveryWithinHP: "3–5 working days",
    deliveryRestOfIndia: "5–10 working days",
    nonDispatchDays: "Sundays and public holidays",
  },

  refund: {
    cancellationMode: "window" as "window" | "none",
    cancellationWindow: "2 hours",
    reportIssueWithin: "48 hours",
    proofRequired: "clear photos and an unboxing video",
    refundInitiation: "2 working days",
    refundCredit: "5–7 working days",
  },

  legal: {
    jurisdiction: "Mandi, Himachal Pradesh",
    lastUpdated: "[DD Month YYYY]",
  },
} as const;

/** Full formatted address string */
export function fullAddress() {
  const a = business.address;
  return `${a.line1}, ${a.city}, ${a.district}, ${a.state} – ${a.pin}, ${a.country}`;
}

/** WhatsApp digits only (for wa.me link) */
export function whatsappDigits() {
  return business.contact.whatsapp.replace(/\D/g, "");
}

/** Shipping charge text for pricing / shipping pages */
export function shippingChargeText() {
  const p = business.pricing;
  let text = "";
  if (p.freeShippingAbove != null) {
    text = `Free shipping on orders above ₹${p.freeShippingAbove}; ₹${p.shippingCharge} for orders below that.`;
  } else {
    text = `A flat shipping charge of ₹${p.shippingCharge} applies.`;
  }
  if (p.shippingNoteOutsideHP) {
    text += " " + p.shippingNoteOutsideHP;
  }
  return text;
}

// Dev-only placeholder warning
if (process.env.NODE_ENV === "development") {
  const warnings: string[] = [];
  function checkPlaceholders(obj: Record<string, unknown>, path: string) {
    for (const [key, val] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      if (typeof val === "string" && val.includes("[")) {
        warnings.push(fullPath);
      } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        checkPlaceholders(val as Record<string, unknown>, fullPath);
      }
    }
  }
  checkPlaceholders(business as unknown as Record<string, unknown>, "business");
  if (warnings.length > 0) {
    console.warn(
      `⚠️  business.ts: ${warnings.length} placeholder(s) still need real values:\n` +
      warnings.map((w) => `   • ${w}`).join("\n")
    );
  }
}
