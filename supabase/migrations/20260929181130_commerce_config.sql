-- Commerce configuration managed in the admin panel: shipping zones and rates, discount
-- codes and payment methods. Orders arrive in Phase 4.

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name_sq text not null,
  name_en text not null,
  -- ISO 3166-1 alpha-2 codes (XK for Kosovo). Exactly one zone may be the fallback.
  countries text[] not null default '{}',
  is_fallback boolean not null default false,
  sort integer not null default 0
);
create unique index shipping_zones_one_fallback on public.shipping_zones (is_fallback) where is_fallback;

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.shipping_zones (id) on delete cascade,
  name_sq text not null,
  name_en text not null,
  price_cents integer not null check (price_cents >= 0),
  free_over_cents integer check (free_over_cents > 0),
  min_days integer not null check (min_days > 0),
  max_days integer not null,
  active boolean not null default true,
  sort integer not null default 0,
  check (max_days >= min_days)
);

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code extensions.citext not null unique check (code ~ '^[A-Za-z0-9_-]{3,32}$'),
  kind text not null check (kind in ('percent', 'fixed')),
  -- percent: 1–100; fixed: cents
  value integer not null check (value > 0),
  min_subtotal_cents integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer check (usage_limit > 0),
  used_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (kind = 'fixed' or value <= 100)
);

create table public.payment_methods (
  id text primary key check (id in ('paysera', 'bank_transfer', 'cash_agency', 'wise')),
  enabled boolean not null default true,
  sort integer not null default 0,
  -- Method-specific details shown to customers (IBAN, recipient, Wise email, ...)
  details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger payment_methods_updated_at before update on public.payment_methods
  for each row execute function public.set_updated_at();

alter table public.shipping_zones enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.discount_codes enable row level security;
alter table public.payment_methods enable row level security;

create policy "Shipping zones: public read" on public.shipping_zones for select to anon, authenticated using (true);
create policy "Shipping rates: public read active" on public.shipping_rates
  for select to anon, authenticated using (active or (select public.is_admin()));
create policy "Payment methods: public read enabled" on public.payment_methods
  for select to anon, authenticated using (enabled or (select public.is_admin()));

-- Codes are never listed publicly; checkout validates one code at a time (Phase 4).
do $$
declare t text;
begin
  foreach t in array array['shipping_zones', 'shipping_rates', 'discount_codes', 'payment_methods'] loop
    execute format(
      'create policy "%1$s: admin manages" on public.%1$I for all to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

grant select on public.shipping_zones, public.shipping_rates, public.payment_methods to anon, authenticated;
grant select on public.discount_codes to authenticated;
