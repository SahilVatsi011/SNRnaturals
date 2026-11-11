# SNR Naturals — Online Store: Technical Specification & Build Prompt

> Extracted from Quotation SV-ECOM-001 (10 Aug 2026). This is the pure technical scope — no pricing/payment terms — meant to be handed directly to a coding agent as the build brief.

---

## 1. Project Summary

Build a **prepaid-only online store** for SNR Naturals (Sundernagar, Mandi, HP) — a customer-facing storefront with guest checkout + an admin panel to manage products, orders, and dispatch. No user accounts anywhere (neither customer nor... well, admin has one secure login).

**Core principle:** No login for customers. Everything (cart, order history, reorder, tracking) works via **guest sessions + phone number lookup**, not accounts.

---

## 2. Customer-Facing Store — Features

| Feature | Details |
|---|---|
| Product catalogue | Up to 50 items, schema should support easy expansion beyond that |
| Product detail pages | Images + full details |
| Cart | No login — guest cart (session/local-storage backed) |
| Checkout | Delivery address form, guest checkout only |
| Payments | **Razorpay** integration — UPI, cards, netbanking |
| Delivery pricing | Calculated by **weight & dimensions** of items in cart |
| Order tracking | Private link (unique token per order, not tied to login) |
| Order history | Lookup **by phone number**, no login required |
| Reorder | "Reorder same items" from a past order |
| Search | Product search across catalogue |
| Notifications | SMS to customer on order confirmation |
| Responsiveness | Mobile-responsive design throughout |

## 3. Admin Panel — Features

| Feature | Details |
|---|---|
| Auth | Secure admin login (this is the one place login exists) |
| Dashboard | Orders, revenue, low-stock alerts |
| Product management | Add/edit products — images, weight, size |
| Stock control | Live inventory, instantly reflected on storefront |
| Price calculator | Auto-calculates price including baked-in Razorpay fee + SMS fee |
| Order queue | Status management (pending → processing → shipped → delivered, etc.) |
| Courier entry | Manual courier name + tracking ID entry per order |
| Admin alerts | SMS to admin when a new order comes in |
| WhatsApp dispatch | One-click "Send on WhatsApp" — opens a pre-filled WhatsApp message for dispatch updates (NOT the WhatsApp Business API — just a `wa.me` deep link with pre-filled text) |
| Packing slip | Printable packing slip per order |
| Delivery settings | Editable delivery-fee slabs (admin-configurable, not hardcoded) |

## 4. Explicitly OUT of Scope (do not build)

- Cash on delivery (COD) — prepaid only
- Customer login / accounts
- Discount coupons
- Automated WhatsApp Business API messaging (only manual `wa.me` link button)
- Courier API integration (tracking ID entry is manual)
- GST invoicing
- Mobile app (web only, responsive)

## 5. Third-Party Integrations Required

1. **Razorpay** — payment gateway (UPI/cards/netbanking). Account/KYC/keys provided by client; developer only integrates.
2. **SMS provider** (e.g., MSG91 or similar) — order confirmation to customer + new-order alert to admin. Requires client's DLT registration.
3. **WhatsApp** — no API, just `wa.me` deep-link button pre-filled with dispatch message text.

## 6. Data Model — Rough Entities to Plan For

- **Product**: name, description, images[], price, weight, dimensions, stock qty, category
- **Order**: items[], customer name/phone, delivery address, delivery fee (calculated), Razorpay payment status/id, order status, courier name, tracking id, created_at
- **Customer** (not an account — just a lookup key): phone number → linked orders (for order history / reorder)
- **Delivery fee slabs**: admin-editable weight/price rules
- **Admin user**: single (or few) secure login(s)

## 7. Key Technical Notes for the Build

- Price calculator on admin side must **bake in Razorpay's ~2.36% fee and SMS cost** into the displayed/charged price — so margins aren't eaten silently.
- Delivery pricing engine needs to be **weight & dimension based**, and slabs must be editable from admin settings, not hardcoded.
- Order tracking page should work via a **unique unguessable link/token**, since there's no login to gate it.
- "Reorder" and "order history" both hinge on **phone-number based lookup** — design this as the primary customer identifier instead of an account system.
- Keep everything within free-tier hosting limits at normal order volume (per the quote, hosting is budgeted at ₹0/month for year 1).

## 8. Non-Technical Constraints Worth Knowing (context, not build tasks)

- 45-day delivery timeline from kickoff, assuming client supplies Razorpay KYC, SMS/DLT registration, and product data on time.
- Product photos, descriptions, pricing data are all client-supplied.
- Returns/damage handling is manual (shop owner deals with it directly) — no returns flow needed in the app.

---

**Suggested first prompt to your code agent**, once you paste this in:

> Build a prepaid e-commerce store (customer storefront + admin panel) per the spec above. Suggested stack: [your choice — e.g. Next.js + a lightweight DB like Postgres/Supabase or SQLite, Razorpay SDK, an SMS provider SDK]. Start with the data model (Section 6), then customer storefront (Section 2), then admin panel (Section 3), then wire up Razorpay + SMS (Section 5).
