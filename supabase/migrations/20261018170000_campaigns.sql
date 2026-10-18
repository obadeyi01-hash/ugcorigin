-- ============================================================================
-- UGCOrigin, per-view funded-pool campaigns
-- Brands fund a pool; creators submit posts and report views (public); the brand
-- approves views and pays per-1000 from the pool, or forfeits inflated claims
-- (public). Money columns are service-role only.
-- ============================================================================
create type campaign_status   as enum ('draft', 'open', 'closed', 'completed');
create type submission_status as enum ('submitted', 'approved', 'paid', 'forfeited');

create table public.campaigns (
  id                   uuid primary key default gen_random_uuid(),
  brand_id             uuid not null references public.brand_profiles(id) on delete cascade,
  title                text not null,
  description          text,
  niches               text[] not null default '{}',
  pool_naira           integer not null,            -- total funded pool
  rate_per_1000_naira  integer not null,            -- payout per 1,000 views
  spent_naira          integer not null default 0,  -- running total paid out
  fee_naira            integer not null default 0,
  funded               boolean not null default false,
  provider_ref         text,
  status               campaign_status not null default 'draft',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index on public.campaigns (status);
create trigger trg_campaigns_updated before update on public.campaigns
  for each row execute function public.set_updated_at();

create table public.campaign_submissions (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references public.campaigns(id) on delete cascade,
  creator_id      uuid not null references public.creator_profiles(id) on delete cascade,
  url             text not null,
  platform        social_platform,
  claimed_views   integer not null default 0,   -- creator-reported (public)
  approved_views  integer not null default 0,   -- brand/admin-approved
  payout_naira    integer not null default 0,
  status          submission_status not null default 'submitted',
  forfeit_reason  text,
  created_at      timestamptz not null default now(),
  unique (campaign_id, creator_id)
);
create index on public.campaign_submissions (campaign_id);

-- RLS -----------------------------------------------------------------------
alter table public.campaigns            enable row level security;
alter table public.campaign_submissions enable row level security;

-- campaigns: funded ones are public; owner + admin always. Writes service-role
-- except the initial insert of safe columns.
create policy campaigns_select on public.campaigns for select to anon, authenticated
  using (status <> 'draft' or brand_id = auth.uid() or public.is_admin());
create policy campaigns_insert on public.campaigns for insert to authenticated
  with check (brand_id = auth.uid());

revoke insert, update, delete on public.campaigns from anon, authenticated;
grant insert (brand_id, title, description, niches, pool_naira, rate_per_1000_naira)
  on public.campaigns to authenticated;
-- (spent_naira, fee_naira, funded, provider_ref, status → service role only)

-- submissions: claims + forfeits are PUBLIC. Creators submit + edit their own
-- claim; approved_views/payout/status/forfeit are service-role only.
create policy submissions_select on public.campaign_submissions for select to anon, authenticated
  using (true);
create policy submissions_insert on public.campaign_submissions for insert to authenticated
  with check (creator_id = auth.uid());
create policy submissions_update on public.campaign_submissions for update to authenticated
  using (creator_id = auth.uid());

revoke insert, update, delete on public.campaign_submissions from anon, authenticated;
grant insert (campaign_id, creator_id, url, platform, claimed_views)
  on public.campaign_submissions to authenticated;
grant update (url, claimed_views) on public.campaign_submissions to authenticated;
