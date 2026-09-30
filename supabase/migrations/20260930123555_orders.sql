-- Orders, their items (with measurements for custom sizes), payment proofs and the status
-- history. Orders are written only by the server (service role) after it recomputes every
-- price; customers can read their own; admins manage all.

create sequence if not exists public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Human-facing reference, e.g. JF-1001. Also the bank transfer reference.
  number text not null unique default ('JF-' || nextval('public.order_number_seq')),
  -- Secret for guest links (confirmation page, proof upload). Never shown in lists.
  access_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  user_id uuid references auth.users (id) on delete set null,
  email extensions.citext not null,
  phone text not null,
  locale text not null default 'sq' check (locale in ('sq', 'en')),
  marketing_opt_in boolean not null default false,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'paid', 'in_production', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null check (payment_method in ('paysera', 'bank_transfer', 'cash_agency', 'wise')),
  currency text not null default 'EUR' check (currency = 'EUR'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  discount_code text,
  shipping_rate_id uuid references public.shipping_rates (id) on delete set null,
  -- Snapshot of the chosen rate: { name: {sq,en}, minDays, maxDays }
  shipping_method jsonb not null,
  shipping_address jsonb not null,
  billing_address jsonb,
  customer_note text,
  paid_at timestamptz,
  payment_reference text,
  tracking_number text,
  tracking_carrier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_cents = subtotal_cents - discount_cents + shipping_cents)
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_shipping_rate_idx on public.orders (shipping_rate_id);

create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_slug text not null,
  -- Snapshots, so the order reads the same after the catalog changes.
  name text not null,
  color text,
  size text not null,
  quantity integer not null check (quantity between 1 and 10),
  unit_price_cents integer not null check (unit_price_cents > 0),
  -- Custom size: [{ id, cm, label: {sq,en} }] in wizard order.
  measurements jsonb,
  measurement_unit text check (measurement_unit in ('cm', 'in')),
  notes text,
  check ((size = 'custom') = (measurements is not null))
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  content_type text not null,
  -- MTCN/PIN for cash agencies, transfer reference for bank/Wise
  reference text,
  sender_name text,
  created_at timestamptz not null default now()
);
create index payment_proofs_order_idx on public.payment_proofs (order_id);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

-- Paysera callbacks are recorded once each, so a replayed callback can't mark twice.
create table public.payment_callbacks (
  id bigint generated always as identity primary key,
  order_id uuid references public.orders (id) on delete set null,
  provider text not null,
  payload jsonb not null,
  verified boolean not null,
  created_at timestamptz not null default now()
);
create index payment_callbacks_order_idx on public.payment_callbacks (order_id);

-- Discount redemption is atomic: the usage limit can't be exceeded by concurrent orders.
create or replace function public.redeem_discount(p_code text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with hit as (
    update public.discount_codes
       set used_count = used_count + 1
     -- search_path is empty, so name citext's operator explicitly (case-insensitive match).
     where code operator(extensions.=) p_code::extensions.citext
       and active
       and (starts_at is null or starts_at <= now())
       and (expires_at is null or expires_at > now())
       and (usage_limit is null or used_count < usage_limit)
    returning 1
  )
  select exists (select 1 from hit);
$$;
revoke execute on function public.redeem_discount(text) from public, anon, authenticated;

-- RLS --------------------------------------------------------------------------------

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.order_events enable row level security;
alter table public.payment_callbacks enable row level security;

create policy "Orders: owner or admin reads" on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "Orders: admin updates" on public.orders for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Order items: owner or admin reads" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select private.is_admin()))));

create policy "Payment proofs: owner or admin reads" on public.payment_proofs for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select private.is_admin()))));

create policy "Order events: owner or admin reads" on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select private.is_admin()))));
create policy "Order events: admin inserts" on public.order_events for insert to authenticated
  with check ((select private.is_admin()));

create policy "Payment callbacks: admin reads" on public.payment_callbacks for select to authenticated
  using ((select private.is_admin()));

-- Payment proofs bucket: only admins read through the API; the server (service role)
-- uploads after checking the order's access token.
create policy "Payment proofs: admin reads files" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (select private.is_admin()));

grant select on public.orders, public.order_items, public.payment_proofs, public.order_events to authenticated;
grant update on public.orders to authenticated;
grant insert on public.order_events to authenticated;
grant select on public.payment_callbacks to authenticated;
