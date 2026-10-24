-- ============================================================================
-- UGCOrigin — surface Creator Pro for ranking.
--
-- subscriptions RLS only lets a user read their OWN row, so the public directory
-- can't tell which creators are Pro from that table. Denormalise an active-Pro
-- marker onto creator_profiles (public-readable, like `featured`), written only
-- by the service role from the Paystack webhook when a subscription activates.
-- `pro_until` in the future = active Pro; nothing to clean up on expiry.
-- ============================================================================

alter table public.creator_profiles
  add column if not exists pro_until timestamptz;

create index if not exists creator_profiles_pro_until_idx
  on public.creator_profiles (pro_until) where pro_until is not null;

-- Backfill from any currently-active subscriptions.
update public.creator_profiles cp
  set pro_until = s.current_period_end
  from public.subscriptions s
  where s.user_id = cp.id
    and s.status = 'active'
    and (s.current_period_end is null or s.current_period_end > now());
