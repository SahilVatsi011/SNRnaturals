// src/config/business.ts
// Business details shown in the footer and on the About / Contact / policy pages.
// Name/address/phone/email should match the Razorpay dashboard.
// Leave a field "" to hide it (owner, GSTIN, WhatsApp, street address, PIN).

export const business = {
  brandName: "SNR Naturals",
  /** Registered business name; "" falls back to brandName (see businessName()). */
  legalName: "",
  ownerName: "",
  gstin: "",
  websiteUrl: "https://snrnaturals.com",

  address: {
    line1: "",
    city: "Sundernagar",
    district: "Mandi",
    state: "Himachal Pradesh",
    pin: "",
    country: "India",
  },

  contact: {
    phone: "+91 70187 81496",
    whatsapp: "",
    email: "sundernagarnaturals18881@gmail.com",
    hours: "Monday to Saturday, 10:00 AM – 6:00 PM IST",
    replyTime: "24 working hours",
  },

  grievanceOfficer: {
    name: "",
    email: "sundernagarnaturals18881@gmail.com",
    phone: "+91 70187 81496",
    ackTime: "48 hours",
  },

  about: {
    products: "pure, minimally processed natural products — e.g. pahadi ghee, honey, spices, pulses",
    sourcing: "local farmers and producers of Himachal Pradesh",
  },

  pricing: {
    taxNote: "inclusive of all applicable taxes",
    freeShippingAbove: null as number | null,
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
    lastUpdated: "17 November 2026",
  },
} as const;

/** Name to show for the business: the legal name if set, else the brand name. */
export function businessName(): string {
  return business.legalName || business.brandName;
}

/** Full formatted address string (empty parts are skipped). */
export function fullAddress() {
  const a = business.address;
  const state = a.pin ? `${a.state} – ${a.pin}` : a.state;
  return [a.line1, a.city, a.district, state, a.country].filter(Boolean).join(", ");
}

/** WhatsApp digits only (for wa.me link) */
export function whatsappDigits() {
  return business.contact.whatsapp.replace(/\D/g, "");
}

/** Shipping charge text for pricing / shipping pages */
export function shippingChargeText() {
  const p = business.pricing;
  // Checkout charges delivery by total cart weight (admin → Settings → delivery slabs).
  let text = "";
  if (p.freeShippingAbove != null) {
    text = `Free shipping on orders above ₹${p.freeShippingAbove}; ₹${p.shippingCharge} for orders below that.`;
  } else {
    text = "The delivery charge depends on the total weight of your order.";
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
