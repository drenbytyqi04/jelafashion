-- Hardening from the Supabase security and performance advisors.

-- 1. is_admin() moves out of the exposed API schema. Policies reference functions by OID,
--    so every existing policy keeps working after the move.
create schema if not exists private;
grant usage on schema private to anon, authenticated;
alter function public.is_admin() set schema private;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not private.is_admin() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- 2. Trigger functions are not API endpoints. Triggers still fire after the revoke.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;

-- subscribe_newsletter() stays executable by anon on purpose: it is how visitors subscribe
-- without being able to read the list.

-- 3. One permissive policy per role and action. Public read policies already include
--    "or is_admin()", so the admin policies only need insert, update and delete.
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'measurement_definitions', 'products', 'product_colors', 'product_images',
    'product_sizes', 'product_measurements', 'collections', 'collection_products',
    'shipping_zones', 'shipping_rates', 'payment_methods'
  ] loop
    execute format('drop policy "%1$s: admin manages" on public.%1$I', t);
    execute format('create policy "%1$s: admin inserts" on public.%1$I for insert to authenticated with check ((select private.is_admin()))', t);
    execute format('create policy "%1$s: admin updates" on public.%1$I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t);
    execute format('create policy "%1$s: admin deletes" on public.%1$I for delete to authenticated using ((select private.is_admin()))', t);
  end loop;
end $$;

-- Site content and testimonials: public read covers admins too.
drop policy "Site content: admin manages" on public.site_content;
create policy "Site content: admin inserts" on public.site_content for insert to authenticated with check ((select private.is_admin()));
create policy "Site content: admin updates" on public.site_content for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Site content: admin deletes" on public.site_content for delete to authenticated using ((select private.is_admin()));

drop policy "Testimonials: admin manages" on public.testimonials;
create policy "Testimonials: admin inserts" on public.testimonials for insert to authenticated with check ((select private.is_admin()));
create policy "Testimonials: admin updates" on public.testimonials for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Testimonials: admin deletes" on public.testimonials for delete to authenticated using ((select private.is_admin()));

-- Profiles: owners read and update their own row, admins every row.
drop policy "Profiles: admin manages" on public.profiles;
drop policy "Profiles: owner updates" on public.profiles;
create policy "Profiles: owner or admin updates" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));
create policy "Profiles: admin deletes" on public.profiles for delete to authenticated
  using ((select private.is_admin()));

-- 4. Covering indexes for foreign keys.
create index if not exists collection_products_product_idx on public.collection_products (product_id);
create index if not exists product_images_color_idx on public.product_images (color_id);
create index if not exists product_measurements_measurement_idx on public.product_measurements (measurement_id);
create index if not exists shipping_rates_zone_idx on public.shipping_rates (zone_id);
