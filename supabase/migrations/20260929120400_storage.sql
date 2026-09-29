-- Storage buckets. Product and site media are public to read; payment proofs are private
-- (their upload/read policies arrive with checkout in Phase 4).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('site-media', 'site-media', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm']),
  ('payment-proofs', 'payment-proofs', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "Media: admin uploads" on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images', 'site-media') and (select public.is_admin()));
create policy "Media: admin updates" on storage.objects for update to authenticated
  using (bucket_id in ('product-images', 'site-media') and (select public.is_admin()));
create policy "Media: admin deletes" on storage.objects for delete to authenticated
  using (bucket_id in ('product-images', 'site-media') and (select public.is_admin()));
