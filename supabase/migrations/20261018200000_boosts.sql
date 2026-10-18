-- ============================================================================
-- UGCOrigin, Featured Boosts (paid, bounded visibility for creators & brands)
-- A boost floats a creator profile / brief / campaign into a small, LABELLED
-- "Featured" band for a fixed number of days. It NEVER touches the ranking
-- engine (ERS/tier) or the newcomer exploration reservation, it only adds a
-- capped featured band on top of organic results. The `boosts` table is the
-- single source of truth (active = status 'active' AND ends_at > now()).
-- Funded via Paystack; activated by the webhook (service role).
-- ============================================================================

create type boost_target_type as enum ('creator', 'brief', 'campaign');
create type boost_status      as enum ('pending', 'active', 'cancelled');

create table public.boosts (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade, -- who paid
  target_type   boost_target_type not null,
  target_id     uuid not null,                       -- creator_profiles.id | briefs.id | campaigns.id
  days          smallint not null,
  amount_naira  integer not null,
  status        boost_status not null default 'pending',
  starts_at     timestamptz,
  ends_at       timestamptz,
  provider      text not null default 'paystack',
  provider_ref  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index boosts_active_idx on public.boosts (target_type, status, ends_at);
create index boosts_owner_idx  on public.boosts (owner_id, created_at desc);
create index boosts_target_idx on public.boosts (target_id, status);

alter table public.boosts enable row level security;

-- Owners see their own boosts; admins see all. Writes are service-role only
-- (created pending by the checkout action, activated by the webhook), a user
-- can never self-activate a boost they didn't pay for.
create policy boosts_owner_select on public.boosts for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

grant select on public.boosts to authenticated;

-- Placement reads: expose ONLY the target ids that are currently boosted (which
-- are publicly featured anyway), never owner/amount. SECURITY DEFINER so the
-- public directory/boards can float featured items without broad table access.
create or replace function public.active_boost_target_ids(ttype boost_target_type)
returns setof uuid language sql stable security definer set search_path = public as $$
  select target_id from public.boosts
  where target_type = ttype and status = 'active' and ends_at > now();
$$;
grant execute on function public.active_boost_target_ids(boost_target_type) to anon, authenticated;
