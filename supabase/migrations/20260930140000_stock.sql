-- Stock moves with orders: in-stock sizes are taken when an order is placed and returned
-- when it is cancelled. One atomic statement, so two customers can't buy the last piece.
create or replace function public.adjust_stock(p_product uuid, p_size text, p_delta integer)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with hit as (
    update public.product_sizes
       set stock = stock + p_delta
     where product_id = p_product
       and size = p_size
       and stock + p_delta >= 0
    returning 1
  )
  select exists (select 1 from hit);
$$;
revoke execute on function public.adjust_stock(uuid, text, integer) from public, anon, authenticated;
