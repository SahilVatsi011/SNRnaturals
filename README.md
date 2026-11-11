# SNR Naturals — Online Store

Prepaid online store for **SNR Naturals** (Sundernagar, Himachal Pradesh): a guest-checkout
storefront and an admin panel for products, orders and dispatch. Live at
[snrnaturals.com](https://snrnaturals.com).

**Stack:** Next.js 15 (App Router, server actions) · React 19 · Tailwind CSS 4 · Supabase
(Postgres, Auth, Storage) · Razorpay · Recharts · Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Razorpay keys
npm run dev                  # http://localhost:3000
```

Database setup (migrations, first admin user) is described in [`supabase/README.md`](supabase/README.md).

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `node scripts/run-migrations.mjs` | Apply SQL migrations in `supabase/migrations/` |

## Project structure

```
src/
  app/
    (store)/          Storefront: home, product, cart, checkout, tracking, order history, policy pages
    admin/
      login/          Admin sign-in
      (panel)/        Admin panel: dashboard, analytics, orders, products, coupons, customers, settings
    api/admin/        Admin API routes (image upload, order export, notifications)
    icon.png          Favicon / app icon (generated from the logo)
  components/
    Logo.tsx          Brand logo — recolours to the surrounding text colour
    store/            Storefront components (header, mobile tab bar, product card, cart, checkout…)
    admin/            Admin components (sidebar + mobile nav, product table/form, charts, exports…)
    ui/               Shared primitives (Button, Card, Input)
  config/business.ts  Business / legal details used on policy pages and footer
  lib/                Domain logic: pricing, delivery fees, cart, analytics, Razorpay, auth guards, formatting
  middleware.ts       Protects /admin routes
public/
  brand/              Logo mask + square icon
  media/              Homepage media (honey video + poster)
supabase/migrations/  Database schema and seed SQL
docs/                 Original tech spec and task notes
assets/               Design source files (original logo)
```

## Key concepts

- **No customer accounts.** Cart lives in the browser; order history and reorder are looked up by
  phone number; each order has a private tracking link (`/track/<token>`).
- **Prices are re-validated on the server** at checkout (`src/app/(store)/checkout/actions.ts`).
- **Delivery fee** is computed from admin-editable weight slabs (`src/lib/delivery.ts`).
- **Admin access** requires a Supabase user who is either listed in `ADMIN_EMAILS` or has
  `app_metadata.role = "admin"`; every admin server action calls `requireAdmin()`.
- **Brand colours** are defined once as Tailwind theme tokens in `src/app/globals.css`
  (`brand-*` green from the logo, `cream-*`, `honey-*`, `ink`, `canvas`).
