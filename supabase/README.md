# SNR Naturals — Setup Guide (Supabase)

This project uses **Supabase** (Postgres + Auth + Storage) for both the storefront and admin panel. Nothing runs end-to-end until these are configured.

## 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → **New project** (free tier is fine).
2. Choose a region close to your customers (e.g. **Mumbai** for India).
3. Note the project's **Project URL** and **anon public key** from **Settings → API**.

## 2. Set environment variables
Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=<your project url, e.g. https://xxxx.supabase.co>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key — admin-only ops, keep secret>
```

## 3. Run the database migrations & seed
Open **SQL Editor** in Supabase and run, in order:
1. `supabase/migrations/0001_init.sql` — tables, RLS, settings
2. `supabase/migrations/0002_seed.sql` — placeholder products + delivery slabs

## 4. Create the storage bucket
In **Storage → New bucket**: name it `product-images`, set it **Public**.

(Or run the commented bucket insert at the bottom of `0001_init.sql`.)

## 5. Create the storage bucket
In **Storage → New bucket**: name it `product-images`, set it **Public**.

## 6. Create an admin user
In **Authentication → Users → Add user**, create the shop owner's email/password login. That account can sign in at `/admin/login` and is treated as admin (any authenticated user is admin in this build).

## 7. Create the admin user (Supabase Auth)
1. **Authentication → Users → Add user** with the owner's email + a strong password.
2. Return to the app → `/admin/login` → sign in.

## Running locally
```bash
npm install
npm run dev
```

## Deploying (Vercel)
- Connect the repo to Vercel, add the same env vars, deploy. Free tier is fine for normal order volume.

---

## Third-party stubs (Phase 3)
- **Razorpay**: keys go in `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID`. In dev, payment is stubbed.
- **SMS (MSG91)**: keys + DLT template IDs go in the `MSG91_*` vars. In dev, SMS is logged to console instead.
