-- Delivery zones: different delivery rates depending on the customer's PIN code.
--
-- A zone is a named list of PIN-code prefixes (e.g. "1750", "1751" for Mandi,
-- "17" for all of Himachal). Each zone has its own weight slabs in
-- delivery_slabs (zone_id = the zone). Slabs with zone_id NULL are the
-- STANDARD rates, used for any PIN code that doesn't match a zone.
-- When several zones match, the one with the longest matching prefix wins.

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin_prefixes text[] not null default '{}',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.delivery_slabs
  add column if not exists zone_id uuid references public.delivery_zones(id) on delete cascade;

create index if not exists idx_delivery_slabs_zone on public.delivery_slabs (zone_id);

alter table public.delivery_zones enable row level security;

drop policy if exists "public read active zones" on public.delivery_zones;
create policy "public read active zones" on public.delivery_zones
  for select using (active = true);

drop policy if exists "authenticated full zones" on public.delivery_zones;
create policy "authenticated full zones" on public.delivery_zones
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
