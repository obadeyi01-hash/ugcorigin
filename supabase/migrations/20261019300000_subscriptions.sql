-- ============================================================================
-- UGCOrigin, subscriptions (Creator Pro).
-- A paid membership that unlocks perks (extra username changes today; more
-- later). Billed through Paystack as a renewable 30-day period; the webhook
-- activates the row on charge.success. "Active" = status active and the period
-- hasn't ended.
-- ============================================================================

create type subscription_status as enum ('pending', 'active', 'expired', 'cancelled');

create table public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  plan               text not null default 'creator_pro',
  status             subscription_status not null default 'pending',
  current_period_end timestamptz,
  amount_naira       integer not null default 0,
  provider_ref       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id, status, current_period_end desc);

create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy subscriptions_select_own on public.subscriptions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

grant select on public.subscriptions to authenticated;

-- Is this user currently on an active, unexpired subscription?
create or replace function public.has_active_subscription(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = uid and status = 'active'
      and (current_period_end is null or current_period_end > now())
  );
$$;
