-- Foundation: extensions, updated_at trigger, profiles and the admin check used by RLS.

-- Extensions live in their own schema (Supabase's convention; keeps public clean).
create schema if not exists extensions;
create extension if not exists citext with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- One profile per auth user. `role` is only writable by admins (see policies).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  locale text not null default 'sq' check (locale in ('sq', 'en')),
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- security definer so policies can call it without recursing into profiles' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, locale)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'sq' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Profiles: owner reads" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Profiles: owner updates" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Owners may edit their details but never their role. A trigger, not a policy, because a
-- policy reading profiles from inside a profiles policy would recurse. Sessions without a
-- signed-in user (SQL editor, service role) may change roles: that is how the first admin
-- is created.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

create policy "Profiles: admin manages" on public.profiles
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

grant select, update on public.profiles to authenticated;
