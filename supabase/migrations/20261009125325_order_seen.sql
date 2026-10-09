-- "New order" tracking for the admin panel: seen_at is set the first time an admin opens
-- the order. Null means new (dashboard panel, menu badge, "E re" label in the list).
-- Written only by the server (service role); customers never see it.

alter table public.orders add column seen_at timestamptz;

create index orders_unseen_idx on public.orders (created_at desc) where seen_at is null;
