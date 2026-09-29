-- Editable site content (homepage sections, contact details), testimonials and the
-- newsletter list.

-- One JSON document per content block, e.g. 'hero', 'marquee', 'contact'.
-- Bilingual fields are stored as { "sq": "...", "en": "..." } inside `value`.
create table public.site_content (
  key text primary key check (key ~ '^[a-z_]+$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger site_content_updated_at before update on public.site_content
  for each row execute function public.set_updated_at();

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote_sq text not null,
  quote_en text not null,
  author text not null,
  location text,
  published boolean not null default false,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null unique,
  locale text not null default 'sq' check (locale in ('sq', 'en')),
  source text not null default 'footer',
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

alter table public.site_content enable row level security;
alter table public.testimonials enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy "Site content: public read" on public.site_content for select to anon, authenticated using (true);
create policy "Site content: admin manages" on public.site_content for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Testimonials: public read published" on public.testimonials
  for select to anon, authenticated using (published or (select public.is_admin()));
create policy "Testimonials: admin manages" on public.testimonials for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- The list itself is admin-only; visitors subscribe through the function below, which
-- never reveals whether an address was already on the list.
create policy "Newsletter: admin manages" on public.newsletter_subscribers for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function public.subscribe_newsletter(p_email text, p_locale text default 'sq', p_source text default 'footer')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_email is null or length(p_email) > 254 or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  insert into public.newsletter_subscribers (email, locale, source)
  values (lower(trim(p_email)), case when p_locale = 'en' then 'en' else 'sq' end, left(coalesce(p_source, 'footer'), 32))
  on conflict (email) do update set unsubscribed_at = null;
end;
$$;

revoke all on function public.subscribe_newsletter(text, text, text) from public;
grant execute on function public.subscribe_newsletter(text, text, text) to anon, authenticated;

grant select on public.site_content, public.testimonials to anon, authenticated;
grant insert, update, delete on public.site_content, public.testimonials to authenticated;
grant select, insert, update, delete on public.newsletter_subscribers to authenticated;
