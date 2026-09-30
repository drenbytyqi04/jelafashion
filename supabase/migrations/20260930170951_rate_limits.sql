-- Rate limits for public Server Actions (contact, newsletter, sign-in links, discount
-- checks, orders, payment proofs). One row per action and hashed client address per
-- fixed window; shared by every serverless instance. Only the server (service role)
-- touches it: no RLS policies, no API grants.

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from public, anon, authenticated;

create index rate_limits_window_idx on public.rate_limits (window_start);

-- Counts one hit and answers whether the caller is still within the limit. Atomic: the
-- upsert takes the row lock, so parallel requests can't slip past the count.
create function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;

  -- Opportunistic clean-up of windows older than a day, about once per hundred calls.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
