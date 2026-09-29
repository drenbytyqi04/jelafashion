-- RLS checks for the local test database (after local-shim.sql, migrations and seed.sql).
-- Every block raises on failure. Run: psql ... -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
\set QUIET on
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'customer@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000002';
update public.products set published = false where slug = 'era';

-- Anonymous visitor
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  if (select count(*) from public.products) <> 11 then raise exception 'anon should see 11 published products'; end if;
  if exists (select 1 from public.product_colors c join public.products p on p.id = c.product_id where p.slug = 'era')
    then raise exception 'anon sees colours of an unpublished product'; end if;
  if (select count(*) from public.measurement_definitions) <> 17 then raise exception 'measurement definitions not readable'; end if;
  if (select count(*) from public.payment_methods) <> 4 then raise exception 'payment methods not readable'; end if;
  perform public.subscribe_newsletter('Reader@Example.com', 'en', 'test');
  perform public.subscribe_newsletter('reader@example.com', 'sq', 'test'); -- duplicate is silent
end $$;
do $$ begin
  perform 1 from public.discount_codes;
  raise exception 'anon must not read discount codes';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform 1 from public.newsletter_subscribers;
  raise exception 'anon must not read the newsletter list';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.subscribe_newsletter('not-an-email');
  raise exception 'invalid email accepted';
exception when invalid_parameter_value then null;
end $$;

-- Signed-in customer
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
do $$ begin
  if (select count(*) from public.discount_codes) <> 0 then raise exception 'customer sees discount codes'; end if;
  if (select count(*) from public.newsletter_subscribers) <> 0 then raise exception 'customer sees newsletter list'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'customer should only see own profile'; end if;
  update public.products set price_cents = 1 where slug = 'drita';
  if (select price_cents from public.products where slug = 'drita') = 1 then raise exception 'customer changed a product'; end if;
  update public.profiles set full_name = 'Test Customer' where id = auth.uid();
  if (select full_name from public.profiles where id = auth.uid()) <> 'Test Customer' then raise exception 'customer cannot edit own profile'; end if;
end $$;
do $$ begin
  update public.profiles set role = 'admin' where id = auth.uid();
  raise exception 'customer promoted themselves to admin';
exception when insufficient_privilege then null;
end $$;

-- Admin
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
do $$ begin
  if (select count(*) from public.products) <> 12 then raise exception 'admin should see all 12 products'; end if;
  if (select count(*) from public.discount_codes) <> 1 then raise exception 'admin cannot read discount codes'; end if;
  if (select count(*) from public.newsletter_subscribers) <> 1 then raise exception 'newsletter should hold one deduplicated address'; end if;
  update public.products set featured = true where slug = 'era';
  if not (select featured from public.products where slug = 'era') then raise exception 'admin cannot edit products'; end if;
end $$;

rollback;
\echo 'RLS checks passed'
