-- RLS checks for the local test database (after local-shim.sql, migrations and seed.sql).
-- Every block raises on failure. Run: psql ... -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
\set QUIET on
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'customer@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000002';
update public.products set published = false where slug = 'era';
-- Orders are written by the server (superuser/service role): one for the customer, one guest.
insert into public.orders (id, user_id, email, phone, payment_method, subtotal_cents, shipping_cents, total_cents, shipping_method, shipping_address)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'customer@test.local', '+38344000000', 'bank_transfer', 50000, 500, 50500, '{}', '{}'),
  ('10000000-0000-0000-0000-000000000002', null, 'guest@test.local', '+38344000001', 'wise', 40000, 500, 40500, '{}', '{}');
insert into public.order_items (order_id, product_slug, name, size, quantity, unit_price_cents)
values ('10000000-0000-0000-0000-000000000001', 'drita', 'Drita', 'M', 1, 50000);
insert into public.measurement_profiles (user_id, name, measurements)
values ('00000000-0000-0000-0000-000000000002', 'Admin profile', '{"bust": 88}');

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
-- Denied either by missing grants (plain Postgres) or by RLS returning no rows (Supabase,
-- where anon has table grants by default).
do $$ begin
  if (select count(*) from public.discount_codes) > 0 then raise exception 'anon must not read discount codes'; end if;
exception when insufficient_privilege then null;
end $$;
do $$ begin
  if (select count(*) from public.newsletter_subscribers) > 0 then raise exception 'anon must not read the newsletter list'; end if;
exception when insufficient_privilege then null;
end $$;
do $$ begin
  if (select count(*) from public.orders) > 0 then raise exception 'anon must not read orders'; end if;
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.redeem_discount('MIRESEVINI10');
  raise exception 'anon can redeem discount codes';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.adjust_stock((select id from public.products where slug = 'nata'), 'M', 5);
  raise exception 'anon can change stock';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.hit_rate_limit('contact:x', 1000, 60);
  raise exception 'anon can touch rate limits';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform 1 from public.rate_limits;
  raise exception 'anon can read rate limits';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.subscribe_newsletter('not-an-email');
  raise exception 'invalid email accepted';
exception when invalid_parameter_value then null;
end $$;
do $$ begin
  update public.products set price_cents = 1 where slug = 'drita';
  if (select price_cents from public.products where slug = 'drita') = 1 then raise exception 'anon changed a product'; end if;
exception when insufficient_privilege then null;
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
  update public.profiles set full_name = 'Hacked' where id = '00000000-0000-0000-0000-000000000002';
  if (select count(*) from public.orders) <> 1 then raise exception 'customer should see only own order'; end if;
  if (select count(*) from public.order_items) <> 1 then raise exception 'customer should see own order items'; end if;
  insert into public.addresses (user_id, first_name, last_name, line1, city, country, is_default)
  values (auth.uid(), 'Arta', 'K', 'Rruga 1', 'Prizren', 'XK', true);
  insert into public.measurement_profiles (user_id, name, measurements) values (auth.uid(), 'Masat e mia', '{"bust": 90}');
  if (select count(*) from public.measurement_profiles) <> 1 then raise exception 'customer sees other measurement profiles'; end if;
  update public.measurement_profiles set name = 'Hacked' where user_id <> auth.uid();
  update public.orders set status = 'paid';
  if exists (select 1 from public.orders where status = 'paid') then raise exception 'customer marked an order paid'; end if;
end $$;
do $$ begin
  insert into public.addresses (user_id, first_name, last_name, line1, city, country)
  values ('00000000-0000-0000-0000-000000000002', 'X', 'Y', 'Z', 'Prizren', 'XK');
  raise exception 'customer created an address for someone else';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  update public.profiles set role = 'admin' where id = auth.uid();
  raise exception 'customer promoted themselves to admin';
exception when insufficient_privilege then null;
end $$;

-- Admin
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
do $$ begin
  if (select full_name from public.profiles where id = auth.uid()) is not distinct from 'Hacked' then raise exception 'customer edited another profile'; end if;
  if (select count(*) from public.profiles) <> 2 then raise exception 'admin should see all profiles'; end if;
  if (select count(*) from public.products) <> 12 then raise exception 'admin should see all 12 products'; end if;
  if (select count(*) from public.discount_codes) <> 1 then raise exception 'admin cannot read discount codes'; end if;
  if (select count(*) from public.newsletter_subscribers) <> 1 then raise exception 'newsletter should hold one deduplicated address'; end if;
  update public.products set featured = true where slug = 'era';
  if not (select featured from public.products where slug = 'era') then raise exception 'admin cannot edit products'; end if;
  insert into public.testimonials (quote_sq, quote_en, author) values ('t', 't', 't');
  if (select count(*) from public.orders) <> 2 then raise exception 'admin should see all orders'; end if;
  update public.orders set status = 'paid' where id = '10000000-0000-0000-0000-000000000002';
  if (select status from public.orders where id = '10000000-0000-0000-0000-000000000002') <> 'paid' then raise exception 'admin cannot update orders'; end if;
  if (select count(*) from public.payment_callbacks) <> 0 then raise exception 'unexpected callbacks'; end if;
  if (select count(*) from public.addresses) <> 1 then raise exception 'admin should read addresses'; end if;
  if exists (select 1 from public.measurement_profiles where name = 'Hacked') then raise exception 'customer edited another profile'; end if;
end $$;

rollback;
\echo 'RLS checks passed'
