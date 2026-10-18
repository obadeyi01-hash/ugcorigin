-- ============================================================================
-- UGCOrigin, tiering & entry-leveling
-- Entry placement ("leveler") inputs, rolling performance metrics, and weekly
-- tier standings. All scores are COMPUTED SERVER-SIDE (jobs / edge functions):
-- no user write policies. See docs/tiering-and-ranking.md for the model.
-- ============================================================================

-- Head-start fields on the creator profile (the decaying "leveler" boost) ------
alter table public.creator_profiles
  add column entry_placement_score  smallint  not null default 0,   -- EPS 0..100 at onboarding
  add column head_start_multiplier  numeric(4,3) not null default 1.000, -- decays toward 1.000
  add column head_start_remaining   smallint  not null default 0,   -- gigs left before head-start fully decays
  add column earned_reputation      numeric(5,2) not null default 0, -- ERS 0..100, the real engine
  add column opportunity_eligible   boolean   not null default true; -- newcomer exploration protection

-- Verified onboarding signals used to compute the entry placement score --------
create table public.entry_signals (
  creator_id          uuid primary key references public.creator_profiles(id) on delete cascade,
  verified_followers  integer not null default 0,   -- summed across linked+verified socials
  portfolio_count     smallint not null default 0,  -- verified samples
  prior_work_score    smallint not null default 0,  -- 0..100, evidence of past brand/UGC work
  niche_demand_score  smallint not null default 0,  -- 0..100, demand in their niches
  computed_eps        smallint not null default 0,  -- resulting EPS 0..100
  placement_tier      creator_tier not null default 'origin',
  computed_at         timestamptz not null default now()
);

-- Rolling performance metrics (updated by scheduled rollups) -------------------
create table public.creator_metrics (
  creator_id          uuid primary key references public.creator_profiles(id) on delete cascade,
  gigs_completed      integer not null default 0,
  approval_rate       numeric(5,2) not null default 0,   -- %
  on_time_rate        numeric(5,2) not null default 0,   -- %
  dispute_rate        numeric(5,2) not null default 0,   -- %
  repeat_hire_rate    numeric(5,2) not null default 0,   -- %
  avg_rating          numeric(3,2),                      -- 1..5, null until real reviews exist
  review_count        integer not null default 0,
  response_time_mins  integer,
  acceptance_rate     numeric(5,2) not null default 0,   -- %
  impressions_7d      integer not null default 0,
  earned_reputation   numeric(5,2) not null default 0,   -- ERS 0..100 (mirror of profile for querying)
  updated_at          timestamptz not null default now()
);

-- Weekly tier snapshots (history + movement + exploration accounting) ----------
create table public.tier_standings (
  id                  uuid primary key default gen_random_uuid(),
  creator_id          uuid not null references public.creator_profiles(id) on delete cascade,
  week_start          date not null,
  tier                creator_tier not null,
  score               numeric(6,2) not null,            -- composite ranking score that week
  movement            smallint not null default 0,      -- tiers moved vs last week (+/-)
  impressions         integer not null default 0,
  opportunity_slots   integer not null default 0,       -- exploration placements granted (the "leveler tax" redistribution)
  in_redemption       boolean not null default false,
  created_at          timestamptz not null default now(),
  unique (creator_id, week_start)
);
create index on public.tier_standings (creator_id, week_start desc);

-- RLS ------------------------------------------------------------------------
alter table public.entry_signals   enable row level security;
alter table public.creator_metrics enable row level security;
alter table public.tier_standings  enable row level security;

-- entry_signals: owner + admin read; writes service-role only
create policy entry_signals_select on public.entry_signals for select to authenticated
  using (creator_id = auth.uid() or public.is_admin());

-- creator_metrics: public read for live creators (so real stats can show once
-- they exist); owner + admin always. Writes service-role only.
create policy creator_metrics_select on public.creator_metrics for select to anon, authenticated
  using (public.creator_is_live(creator_id) or creator_id = auth.uid() or public.is_admin());

-- tier_standings: owner + admin read; writes service-role only
create policy tier_standings_select on public.tier_standings for select to authenticated
  using (creator_id = auth.uid() or public.is_admin());
