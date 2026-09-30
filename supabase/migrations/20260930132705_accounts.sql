-- Customer accounts: saved addresses and named measurement profiles. Customers manage
-- their own rows; admins can read them (to help with an order). Orders are matched to an
-- account by user_id, or by the verified email for orders placed as a guest.

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  first_name text not null check (length(first_name) between 1 and 80),
  last_name text not null check (length(last_name) between 1 and 80),
  line1 text not null check (length(line1) between 1 and 160),
  line2 text check (length(line2) <= 160),
  city text not null check (length(city) between 1 and 80),
  postal_code text check (length(postal_code) <= 20),
  region text check (length(region) <= 80),
  country text not null check (country ~ '^[A-Z]{2}$'),
  phone text check (length(phone) <= 30),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id, created_at);
create unique index addresses_one_default on public.addresses (user_id) where is_default;
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

create table public.measurement_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  unit text not null default 'cm' check (unit in ('cm', 'in')),
  -- { "<measurement id>": <cm>, ... }
  measurements jsonb not null check (jsonb_typeof(measurements) = 'object'),
  notes text check (length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index measurement_profiles_user_idx on public.measurement_profiles (user_id, updated_at desc);
create trigger measurement_profiles_updated_at before update on public.measurement_profiles
  for each row execute function public.set_updated_at();

-- Guest orders are shown in the account whose verified email placed them.
create index orders_email_idx on public.orders (email, created_at desc);

alter table public.addresses enable row level security;
alter table public.measurement_profiles enable row level security;

create policy "Addresses: owner or admin reads" on public.addresses for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "Addresses: owner inserts" on public.addresses for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Addresses: owner updates" on public.addresses for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Addresses: owner deletes" on public.addresses for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Profiles: owner or admin reads" on public.measurement_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "Profiles: owner inserts" on public.measurement_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Profiles: owner updates" on public.measurement_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Profiles: owner deletes" on public.measurement_profiles for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.addresses, public.measurement_profiles to authenticated;
