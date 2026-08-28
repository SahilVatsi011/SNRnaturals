-- ============================================================
-- SNR Naturals Store — Data Model (Phase 0)
-- Run this in the Supabase SQL editor against your project.
-- ============================================================

-- ---------- PRODUCTS ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  mrp numeric(12,2) not null default 0,        -- original/list price
  price numeric(12,2) not null,                -- selling price
  weight_grams integer not null default 0,     -- for delivery calc
  length_cm numeric(6,2) default 0,
  width_cm numeric(6,2) default 0,
  height_cm numeric(6,2) default 0,
  stock_qty integer not null default 0,
  category text,
  images text[] not null default '{}',         -- storage/url paths
  active boolean not null default true,        -- show on storefront
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_slug on public.products (slug);
create index if not exists idx_products_active on public.products (active);
create index if not exists idx_products_category on public.products (category);

-- ---------- ORDERS ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigserial unique,                   -- human-friendly sequential no.
  order_token text unique not null,            -- unguessable token for tracking link
  customer_name text not null,
  customer_phone text not null,                -- primary customer identity (no login)
  email text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  items jsonb not null,                        -- [{product_id, name, price, qty, weight_grams}]
  subtotal numeric(12,2) not null,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null,                -- subtotal + delivery_fee
  payment_status text not null default 'pending', -- pending | paid | failed | refunded
  payment_id text,                             -- razorp pay order/payment id
  payment_method text,
  order_status text not null default 'pending', -- pending|processing|shipped|delivered|cancelled
  courier_name text,
  tracking_id text,
  dispatched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_phone on public.orders (customer_phone);
create index if not exists idx_orders_token on public.orders (order_token);
create index if not exists idx_orders_status on public.orders (order_status);
create index if not exists idx_orders_created on public.orders (created_at);

-- ---------- DELIVERY SLABS ----------
-- Weight-based shipping fee slabs, admin editable.
create table if not exists public.delivery_slabs (
  id uuid primary key default gen_random_uuid(),
  min_weight_grams integer not null default 0,  -- inclusive lower bound (grams)
  max_weight_grams integer,                     -- exclusive upper bound (grams), NULL = no upper bound
  price numeric(10,2) not null,                 -- fee in rupees for this slab
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_delivery_slabs_active on public.delivery_slabs (active);

-- ---------- SETTINGS ----------
-- Key/value runtime settings (price calc formula, SMS templates, etc.)
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  label text,
  updated_at timestamptz not null default now()
);

-- ---------- ADMIN USERS ----------
-- Admin auth handled by Supabase Auth (auth.users).
-- No table needed; gate admin by checking auth role/email metadata.

-- ============================================================
-- Default settings (business/branding + economic constants)
-- ============================================================
insert into public.settings (key, value, label) values
  ('store', '{"name":"Sundarnagar Naturals","shortName":"snrnaturals","domain":"snrnaturalsfpc.com","phone":"","city":"Sundarnagar","district":"Mandi","state":"Himachal Pradesh"}', 'Store branding/business info'),
  ('fees', '{"razorpayFeeRate":0.0236,"smsCostPerOrder":1.0}', 'Price calculation: Razorpay fee + SMS cost'),
  ('lowStockThreshold', '10', 'Low-stock alert threshold'),
  ('sms_templates', '{"customerOrderConfirmation":"Hi {name}, order {orderNo} of Rs {total} received. Track: {trackingUrl}","adminNewOrder":"New order {orderNo} Rs {total} from {name} ({phone}). View: {adminUrl}"}', 'SMS message templates')
on conflict (key) do nothing;

-- ============================================================
-- Storage bucket for product images (run in Storage if UI not used)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
-- on conflict (id) do nothing;

-- ============================================================
-- Row Level Security (RLS)
-- Public storefront reads products; admin writes via auth.
-- ============================================================
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.delivery_slabs enable row level security;
alter table public.settings enable row level security;

-- Public can read active products and delivery slabs
create policy "public read active products" on public.products
  for select using (active = true);
create policy "public read active slabs" on public.delivery_slabs
  for select using (active = true);

-- Admins (authenticated users) manage products
create policy "authenticated full products" on public.products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full orders" on public.orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full slabs" on public.delivery_slabs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read settings" on public.settings
  for select using (auth.role() = 'authenticated');
create policy "authenticated write settings" on public.settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
