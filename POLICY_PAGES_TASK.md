# Task: Build Policy Pages for SNR Naturals (Razorpay Activation)

> Hand this file to Claude Code. Place it in the project root and say:
> **"Read POLICY_PAGES_TASK.md and implement it."**

---

## 0. Goal

Create **7 static policy pages** required for Razorpay live-mode activation. Client details are **not final yet**, so build them as a **template**: all business-specific values come from **one config file** with placeholder values. When the client sends details, only the config file changes — no page edits.

**Hard rules**
- ❌ Do NOT modify any payment, Razorpay, order, cart, checkout, admin, or API/backend code.
- ❌ Do NOT rephrase the legal text below. Render it as written (only replace `{{TOKENS}}` with config values).
- ✅ Reuse the site's existing layout, header, footer, fonts and styles (follow `DESIGN.md` if it exists).
- ✅ Pages must be crawlable: server-rendered or statically generated, visible **without JavaScript and without login**. (Razorpay's crawler checks these URLs.)
- ✅ Mobile-friendly and readable (max content width ~720px, comfortable line height).

---

## 1. Step 1 — Detect the stack first

Before writing anything, inspect the project and tell me:
1. Framework (Next.js App Router / Next.js Pages Router / React + Vite / plain HTML / other)
2. Where existing pages live and how routing works
3. Where the footer component is

Then place files according to this table:

| Stack | Where pages go | Example |
|---|---|---|
| Next.js App Router | `app/<route>/page.tsx` | `app/refund-policy/page.tsx` |
| Next.js Pages Router | `pages/<route>.tsx` | `pages/refund-policy.tsx` |
| React + Vite / React Router | `src/pages/<Name>.tsx` + add route in the router file | `src/pages/RefundPolicy.tsx` → `/refund-policy` |
| Plain HTML | `<route>.html` or `<route>/index.html` in the public/root folder | `refund-policy/index.html` |
| Other | Follow the project's existing page convention | — |

⚠️ If the stack is a **client-only SPA (React + Vite)**, these pages will look blank to crawlers. Add prerendering for these 7 routes (e.g. `vite-plugin-prerender` / `react-snap`), or tell me the options before proceeding.

---

## 2. Step 2 — Create the config file (single source of truth)

Create a config file (adapt path/extension to the stack):
- Next.js / React: `src/config/business.ts` (or `config/business.ts` if no `src/`)
- Plain HTML: `business.json` + a small build/replace step, or hardcode tokens and list them in a comment block at the top of each page

```ts
// src/config/business.ts
// ⚠️ PLACEHOLDERS — replace with real client details before going live.
// Business name/address/phone/email MUST match Razorpay dashboard + PAN/GST exactly.

export const business = {
  brandName: "SNR Naturals",
  legalName: "[LEGAL BUSINESS NAME]",          // as per PAN / GST / bank
  ownerName: "[OWNER NAME]",
  gstin: "",                                     // leave "" to hide GSTIN line
  websiteUrl: "[https://www.example.com]",

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
    products: "[pure, minimally processed natural products — e.g. pahadi ghee, honey, spices, pulses]",
    sourcing: "[local farmers and producers of Himachal Pradesh]",
  },

  pricing: {
    taxNote: "inclusive of all applicable taxes",   // or "exclusive of GST"
    freeShippingAbove: 999,                          // null = no free shipping
    shippingCharge: 60,
    shippingNoteOutsideHP: "",                       // e.g. "₹100 for orders outside Himachal Pradesh"
  },

  shipping: {
    deliveryArea: "across India",                    // or "within Himachal Pradesh only"
    dispatchTime: "1–3 working days",
    deliveryWithinHP: "3–5 working days",
    deliveryRestOfIndia: "5–10 working days",
    nonDispatchDays: "Sundays and public holidays",
  },

  refund: {
    // Cancellation mode: "window" = allowed within X hours & before dispatch; "none" = no cancellation after order
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
```

Also add a **dev-only warning**: if any config value still contains `[` (placeholder), log a console warning in development listing which fields are unfilled. Never show this warning in production.

---

## 3. Step 3 — Create the 7 pages

| # | Page | Route | Suggested file (Next.js App Router) |
|---|---|---|---|
| 1 | About Us | `/about` | `app/about/page.tsx` |
| 2 | Contact Us | `/contact` | `app/contact/page.tsx` |
| 3 | Pricing | `/pricing` | `app/pricing/page.tsx` |
| 4 | Terms & Conditions | `/terms` | `app/terms/page.tsx` |
| 5 | Privacy Policy | `/privacy-policy` | `app/privacy-policy/page.tsx` |
| 6 | Cancellation & Refund Policy | `/refund-policy` | `app/refund-policy/page.tsx` |
| 7 | Shipping & Delivery Policy | `/shipping-policy` | `app/shipping-policy/page.tsx` |

**Shared structure for every page**
- Create one reusable `PolicyLayout` component: page title (H1), "Last updated: {{legal.lastUpdated}}" (policy pages only), content area, and a small "Questions? Contact us" box at the bottom showing phone, WhatsApp link (`https://wa.me/<digits>`), and email (`mailto:`).
- Each page sets its own `<title>` and meta description, e.g. `Refund Policy | SNR Naturals`.
- Full address block = `line1, city, district, state – pin, country`.

`{{token}}` below = value from `business` config.

---

### 3.1 About Us (`/about`)

**{{brandName}}** is a natural products store based in {{address.city}}, {{address.district}}, {{address.state}}. We bring {{about.products}} sourced from {{about.sourcing}}.

Our aim is simple: honest products, clearly labelled, delivered fresh to your door.

- **Business name:** {{legalName}}
- **Address:** {{full address}}
- **GSTIN:** {{gstin}} *(render this line only if gstin is not empty)*

---

### 3.2 Contact Us (`/contact`)

We're happy to help with orders, delivery or product questions.

- **Business name:** {{legalName}}
- **Address:** {{full address}}
- **Phone:** {{contact.phone}} (tap-to-call `tel:` link)
- **WhatsApp:** {{contact.whatsapp}} (wa.me link)
- **Email:** {{contact.email}} (mailto link)
- **Support hours:** {{contact.hours}}

We usually reply within {{contact.replyTime}}. For order-related queries, please mention your **Order ID**.

*(No contact form needed — keep it static.)*

---

### 3.3 Pricing (`/pricing`)

- All product prices are listed on the respective product pages in **Indian Rupees (INR)**.
- Prices are {{pricing.taxNote}}.
- Shipping: *(if freeShippingAbove is set)* Free shipping on orders above ₹{{pricing.freeShippingAbove}}; ₹{{pricing.shippingCharge}} for orders below that. *(else)* A flat shipping charge of ₹{{pricing.shippingCharge}} applies. {{pricing.shippingNoteOutsideHP}}
- The exact shipping charge is shown at checkout before payment. There are no hidden charges — the amount shown at checkout is the final amount you pay.
- Prices may change without prior notice, but the price at the time of order confirmation applies to your order.
- We accept **prepaid orders only** via Razorpay (UPI, debit/credit cards, net banking and wallets). **Cash on Delivery is not available.**

---

### 3.4 Terms & Conditions (`/terms`)

These Terms & Conditions apply to your use of {{websiteUrl}} ("Website"), operated by {{legalName}}, {{full address}} ("{{brandName}}", "we", "us"). By using this Website or placing an order, you agree to these terms.

**1. Eligibility.** You must be at least 18 years old, or use the Website under the supervision of a parent or guardian, to place an order.

**2. Orders.** Orders are placed as a guest; no account is required. You are responsible for providing a correct name, phone number, email and delivery address. An order is confirmed only after successful payment. We may cancel an order in case of stock unavailability, pricing errors or suspected fraud; in such cases a full refund is issued as per our Cancellation & Refund Policy.

**3. Payments.** All payments are processed securely through Razorpay. We do not store your card, UPI or bank details. Orders are prepaid only.

**4. Product information.** We try to describe products, weights and ingredients accurately. Being natural products, colour, texture, aroma and taste may vary slightly between batches. Product images are for representation.

**5. Health disclaimer.** Our products are food/natural products and are not intended to diagnose, treat, cure or prevent any disease. Please check ingredients for allergies before use and consult a doctor if you have specific health concerns.

**6. Shipping, cancellation and refunds.** These are governed by our [Shipping & Delivery Policy](/shipping-policy) and [Cancellation & Refund Policy](/refund-policy), which form part of these terms.

**7. Intellectual property.** All content on this Website (text, images, logo, design) belongs to {{brandName}} and may not be copied without written permission.

**8. Limitation of liability.** Our liability for any order is limited to the amount paid for that order. We are not liable for delays caused by courier partners, natural events or other circumstances beyond our control.

**9. Changes.** We may update these terms at any time. The version on this page at the time of your order applies.

**10. Governing law.** These terms are governed by the laws of India. Disputes are subject to the jurisdiction of courts in {{legal.jurisdiction}}.

**11. Contact.** {{contact.email}} | {{contact.phone}}

---

### 3.5 Privacy Policy (`/privacy-policy`)

{{legalName}} ("{{brandName}}") respects your privacy. This policy explains what information we collect on {{websiteUrl}} and how we use it.

**1. Information we collect.** When you place an order, we collect your name, phone number, email address and delivery address. We also collect basic technical data (such as browser type and pages visited) to keep the Website working properly.

**2. Payment information.** Payments are processed by **Razorpay**. We do not collect or store your card numbers, UPI PIN, CVV or net-banking credentials. Razorpay's own privacy policy applies to the payment process.

**3. How we use your information.**
- To process, pack and deliver your order
- To send order confirmations and updates by SMS, email or WhatsApp
- To respond to your queries and complaints
- To comply with legal and tax requirements

We do **not** sell or rent your personal information to anyone.

**4. Sharing.** We share only the necessary details with: Razorpay (payment processing), our courier/delivery partners (name, phone, address for delivery), and our SMS service provider (order notifications). We may disclose information if required by law.

**5. Data storage and security.** Your data is stored on secure servers and access is limited to people who need it to fulfil your order. We keep order records for as long as needed for delivery, customer support and legal/tax purposes.

**6. Cookies.** The Website may use essential cookies/local storage to remember your cart. We do not use them to track you across other websites.

**7. Your rights.** You can ask us to access, correct or delete your personal data (subject to legal record-keeping requirements) by writing to {{contact.email}}.

**8. Grievance Officer.** In line with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023:
{{grievanceOfficer.name}}, {{grievanceOfficer.email}}, {{grievanceOfficer.phone}}, {{full address}}. We will acknowledge complaints within {{grievanceOfficer.ackTime}}.

**9. Changes.** We may update this policy; the latest version will always be on this page.

---

### 3.6 Cancellation & Refund Policy (`/refund-policy`)

**1. Cancellation by customer.**
*(if cancellationMode === "window")*
- You can cancel your order within **{{refund.cancellationWindow}}** of placing it, **provided it has not been dispatched**, by contacting us on WhatsApp/phone/email with your Order ID.
- Orders cancelled within this window receive a **full refund**.
- After {{refund.cancellationWindow}} or once the order is dispatched, it cannot be cancelled.

*(if cancellationMode === "none")*
- Since we pack fresh natural products for every order, **orders cannot be cancelled once payment is confirmed**.

**2. Cancellation by us.** If a product is out of stock or we cannot deliver to your PIN code, we will cancel the order (fully or partially) and give a full refund for the cancelled items.

**3. Returns and replacements.** Since our products are food and natural consumables, we **do not accept returns for change of mind or once a package is opened/used**. We offer a **replacement or refund** if:
- You received a damaged, leaking or tampered product
- You received the wrong product
- The product is past its expiry date on delivery

Please report the issue within **{{refund.reportIssueWithin}} of delivery** with your Order ID and {{refund.proofRequired}} of the product and package.

**4. Refund process and timeline.**
- Approved refunds are initiated within **{{refund.refundInitiation}}** of approval.
- Refunds are credited to the **original payment method** (UPI/card/bank/wallet) within **{{refund.refundCredit}}**, depending on your bank.
- Shipping charges are refunded if the issue was our mistake (damaged/wrong/expired item) or the order was cancelled by us or within the cancellation window.

**5. Contact.** {{contact.email}} | {{contact.phone}} | WhatsApp: {{contact.whatsapp}}

---

### 3.7 Shipping & Delivery Policy (`/shipping-policy`)

**1. Delivery area.** We currently deliver {{shipping.deliveryArea}} to serviceable PIN codes.

**2. Processing time.** Orders are packed and dispatched within **{{shipping.dispatchTime}}** after payment confirmation. Orders are not dispatched on {{shipping.nonDispatchDays}}.

**3. Delivery time.**
- Within Himachal Pradesh: **{{shipping.deliveryWithinHP}}** after dispatch
- Rest of India: **{{shipping.deliveryRestOfIndia}}** after dispatch *(hide this line if deliveryArea is HP only)*

Delivery to remote/hilly areas may take longer due to weather and road conditions.

**4. Shipping charges.** Same logic as Pricing page. The exact charge is shown at checkout before payment.

**5. Order updates.** You will receive order and dispatch updates via SMS/WhatsApp on the phone number given at checkout. Tracking details (if available) are shared once the order is dispatched.

**6. Delivery issues.** Please make sure the address and phone number are correct. If a delivery fails because of an incorrect address or the recipient being unavailable, re-shipping charges may apply. If your order hasn't arrived within the stated time, contact us at {{contact.email}} / {{contact.phone}}.

---

## 4. Step 4 — Footer links (required by Razorpay)

Update the **existing footer** (don't create a second one) to include a "Policies" / "Help" column with links to all 7 pages:

About Us · Contact Us · Pricing · Terms & Conditions · Privacy Policy · Cancellation & Refund Policy · Shipping Policy

Also show in the footer: `{{legalName}}`, city/state, phone and email from config.

Optional but recommended: on the checkout page, add one small line near the pay button — *"By placing this order you agree to our Terms, Refund Policy and Shipping Policy"* with links. **Only add text/links; do not touch checkout logic.**

---

## 5. Step 5 — Verify before finishing

- [ ] All 7 routes load without errors and without login
- [ ] View page source (or `curl <url>`) shows the actual policy text in HTML — not an empty root div
- [ ] Footer links work on every page, desktop and mobile
- [ ] GSTIN line hidden when `gstin` is empty
- [ ] Switching `cancellationMode` between `"window"` and `"none"` changes the refund page correctly
- [ ] Changing a value in the config updates every page
- [ ] No changes in payment / Razorpay / order / API files (`git diff --stat` to confirm)
- [ ] `npm run build` (or equivalent) passes

When done, give me: list of files created/changed, the 7 URLs, and a list of config fields still holding placeholders.

---

## 6. After client sends details (for later — not now)

1. Fill `business` config from the client checklist (Excel).
2. Set `legal.lastUpdated` to the go-live date.
3. Deploy, open each URL in incognito, then submit links in Razorpay Dashboard → Account & Settings → Business website detail.
