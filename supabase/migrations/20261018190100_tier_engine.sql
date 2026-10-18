-- ============================================================================
-- UGCOrigin, tier + pricing engine (the economic core)
-- Implements the model in docs/tiering-and-ranking.md:
--   * 7 tiers with per-tier price FLOORS (creators can't price below their tier)
--   * EPS (entry placement, capped at `pro`) + head-start decay
--   * ERS (earned reputation) from real on-platform outcomes
--   * tier recompute with ±1-step movement (NO jumping) + weekly standings
--   * event-driven triggers (gig completion, reviews, entry signals)
-- All scoring/tier writes happen in SECURITY DEFINER functions (service role);
-- creators can never self-set tier, scores, is_live, etc.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tier configuration (labels, floors, blurbs), admin-editable later.
-- ---------------------------------------------------------------------------
create table if not exists public.tier_config (
  tier                creator_tier primary key,
  rank                smallint not null unique,         -- 1..7
  label               text not null,
  tagline             text not null,
  floor_naira         integer not null,                 -- minimum starting rate at this tier
  impression_cap_pct  smallint not null default 20,     -- max share of a niche's weekly impressions
  updated_at          timestamptz not null default now()
);

insert into public.tier_config (tier, rank, label, tagline, floor_naira, impression_cap_pct) values
  ('origin',    1, 'Origin',    'Verified human, your starting line.',        10000, 20),
  ('rising',    2, 'Rising',    'Gaining traction with real brands.',          20000, 20),
  ('pro',       3, 'Pro',       'Proven, reliable, repeatably hired.',         35000, 22),
  ('standout',  4, 'Standout',  'Consistently top-rated, standout work.',      55000, 24),
  ('elite',     5, 'Elite',     'Among the very best in your niche.',          85000, 26),
  ('signature', 6, 'Signature', 'Rare, highly selective, signature talent.',  130000, 28),
  ('luminary',  7, 'Luminary',  'The apex, the best on UGCOrigin.',          200000, 30)
on conflict (tier) do update set
  rank = excluded.rank, label = excluded.label, tagline = excluded.tagline,
  floor_naira = excluded.floor_naira, impression_cap_pct = excluded.impression_cap_pct,
  updated_at = now();

alter table public.tier_config enable row level security;
drop policy if exists tier_config_read on public.tier_config;
create policy tier_config_read on public.tier_config for select to anon, authenticated using (true);
grant select on public.tier_config to anon, authenticated;
-- writes: service role only (no policy).

-- ---------------------------------------------------------------------------
-- 2. Tier rank helpers (enum order is the ladder order).
-- ---------------------------------------------------------------------------
create or replace function public.tier_rank(t creator_tier)
returns int language sql stable as $$
  select array_position(enum_range(null::creator_tier)::creator_tier[], t);
$$;

create or replace function public.tier_at_rank(r int)
returns creator_tier language sql stable as $$
  select (enum_range(null::creator_tier))[greatest(1, least(7, r))];
$$;

create or replace function public.tier_floor(t creator_tier)
returns int language sql stable as $$
  select coalesce((select floor_naira from public.tier_config where tier = t), 0);
$$;

-- ---------------------------------------------------------------------------
-- 3. Entry Placement Score (EPS), the capped, decaying head start.
--    Reads verified signals from entry_signals; writes placement + head start.
-- ---------------------------------------------------------------------------
create or replace function public.compute_eps(cid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  s            public.entry_signals%rowtype;
  cp           public.creator_profiles%rowtype;
  following_pts int; portfolio_pts int; prior_pts int; niche_pts int; verified_pts int;
  eps          int;
  place_rank   int;
  place_tier   creator_tier;
  h0           numeric(4,3);
  done         int;
begin
  select * into s from public.entry_signals where creator_id = cid;
  if not found then return; end if;
  select * into cp from public.creator_profiles where id = cid;
  if not found then return; end if;

  following_pts := least(25, round(6 * log(10, s.verified_followers + 1))::int);
  portfolio_pts := least(25, s.portfolio_count * 5);
  prior_pts     := least(25, round(s.prior_work_score * 25.0 / 100.0)::int);
  niche_pts     := least(15, round(s.niche_demand_score * 15.0 / 100.0)::int);
  verified_pts  := case when cp.identity_verified and cp.bank_verified then 10 else 0 end;

  eps := least(100, following_pts + portfolio_pts + prior_pts + niche_pts + verified_pts);

  -- Placement: 0-20 origin, 21-45 rising, 46+ pro, CAPPED at pro (no buying Elite+).
  place_rank := case when eps <= 20 then 1 when eps <= 45 then 2 else 3 end;
  place_tier := public.tier_at_rank(place_rank);
  h0 := case place_rank when 1 then 1.000 when 2 then 1.150 else 1.300 end;

  update public.entry_signals
    set computed_eps = eps, placement_tier = place_tier, computed_at = now()
    where creator_id = cid;

  select coalesce(gigs_completed, 0) into done from public.creator_metrics where creator_id = cid;
  done := coalesce(done, 0);

  update public.creator_profiles set
    entry_placement_score = eps,
    head_start_multiplier = h0,
    head_start_remaining  = case when place_rank > 1 then 5 else 0 end,
    -- Only set the *initial* tier at placement; never demote an already-earning
    -- creator just because they re-linked socials.
    tier = case when done < 1 then place_tier else tier end
    where id = cid;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Recompute rolling outcome metrics from REAL gig/review data (no fakes).
-- ---------------------------------------------------------------------------
create or replace function public.recompute_creator_metrics(cid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  completed      int;
  concluded      int;
  disputed_cnt   int;
  distinct_brands int;
  rq             numeric;
  rc             int;
  ar             numeric(3,2);
begin
  select
    count(*) filter (where status in ('released','completed')),
    count(*) filter (where status in ('released','completed','cancelled')),
    count(*) filter (where status = 'disputed'),
    count(distinct brand_id) filter (where status in ('released','completed'))
    into completed, concluded, disputed_cnt, distinct_brands
  from public.gigs where creator_id = cid;

  completed := coalesce(completed, 0);
  concluded := coalesce(concluded, 0);
  disputed_cnt := coalesce(disputed_cnt, 0);
  distinct_brands := coalesce(distinct_brands, 0);

  select
    avg((rating_speed + rating_comms + rating_quality) / 3.0),
    count(*)
    into ar, rc
  from public.reviews where subject_id = cid;
  rc := coalesce(rc, 0);

  insert into public.creator_metrics as m (creator_id, gigs_completed, approval_rate,
      dispute_rate, repeat_hire_rate, avg_rating, review_count, updated_at)
  values (
    cid,
    completed,
    case when concluded > 0 then round(100.0 * completed / concluded, 2) else 0 end,
    case when (completed + disputed_cnt) > 0 then round(100.0 * disputed_cnt / (completed + disputed_cnt), 2) else 0 end,
    case when completed > 0 then round(100.0 * (completed - distinct_brands) / completed, 2) else 0 end,
    ar,
    rc,
    now()
  )
  on conflict (creator_id) do update set
    gigs_completed   = excluded.gigs_completed,
    approval_rate    = excluded.approval_rate,
    dispute_rate     = excluded.dispute_rate,
    repeat_hire_rate = excluded.repeat_hire_rate,
    avg_rating       = excluded.avg_rating,
    review_count     = excluded.review_count,
    updated_at       = now();
  -- on_time_rate, acceptance_rate, response_time_mins are populated once we
  -- track delivery timestamps; left at their stored values for now (not faked).
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Earned Reputation Score (ERS 0..100) from the rolling metrics.
-- ---------------------------------------------------------------------------
create or replace function public.compute_ers(cid uuid)
returns numeric language plpgsql security definer set search_path = public as $$
declare
  m   public.creator_metrics%rowtype;
  rqual numeric; ers numeric(5,2);
begin
  select * into m from public.creator_metrics where creator_id = cid;
  if not found then return 0; end if;

  rqual := case when m.review_count > 0 and m.avg_rating is not null then m.avg_rating / 5.0 else 0 end;

  ers := 100 * (
      0.30 * (m.approval_rate    / 100.0)
    + 0.20 * (m.on_time_rate     / 100.0)
    + 0.20 * (m.repeat_hire_rate / 100.0)
    + 0.15 * rqual
    + 0.10 * (1 - (m.dispute_rate / 100.0))
    + 0.05 * (m.acceptance_rate  / 100.0)
  );
  ers := greatest(0, least(100, round(ers, 2)));

  update public.creator_metrics set earned_reputation = ers, updated_at = now() where creator_id = cid;
  update public.creator_profiles set earned_reputation = ers where id = cid;
  return ers;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Recompute tier, the progression engine. Moves at most ±1 rung (NO
--    jumping), applies head-start decay, writes a weekly standings snapshot.
-- ---------------------------------------------------------------------------
create or replace function public.recompute_creator_tier(cid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  cp          public.creator_profiles%rowtype;
  place_tier  creator_tier;
  h0          numeric(4,3);
  h           numeric(4,3);
  ers         numeric(5,2);
  done        int;
  w_new       numeric;
  eps_blend   numeric;
  base        numeric;
  standing    numeric;
  target_rank int;
  cur_rank    int;
  new_rank    int;
  new_tier    creator_tier;
  wk          date := date_trunc('week', now())::date;
  last_rank   int;
begin
  perform public.recompute_creator_metrics(cid);
  ers := public.compute_ers(cid);

  select * into cp from public.creator_profiles where id = cid;
  if not found then return; end if;
  select coalesce(gigs_completed, 0) into done from public.creator_metrics where creator_id = cid;
  done := coalesce(done, 0);

  -- Head-start multiplier decays with gigs remaining (H0 derived from placement).
  select placement_tier into place_tier from public.entry_signals where creator_id = cid;
  h0 := case public.tier_rank(coalesce(place_tier, 'origin'))
          when 1 then 1.000 when 2 then 1.150 else 1.300 end;
  h := round(1 + (h0 - 1) * (cp.head_start_remaining::numeric / 5.0), 3);
  h := greatest(1.000, least(h0, h));

  -- Cold-start blend: lean on (capped) EPS early, ERS takes over by ~3 gigs.
  w_new := greatest(0, least(1, 1 - done / 3.0));
  eps_blend := least(cp.entry_placement_score, 60);
  base := w_new * eps_blend + (1 - w_new) * ers;
  standing := least(100, base * h);

  target_rank := case
    when standing < 30 then 1
    when standing < 45 then 2
    when standing < 60 then 3
    when standing < 72 then 4
    when standing < 84 then 5
    when standing < 94 then 6
    else 7 end;

  cur_rank := public.tier_rank(cp.tier);
  -- ±1 step only, no jumping tiers up or down.
  new_rank := greatest(cur_rank - 1, least(cur_rank + 1, target_rank));
  new_rank := greatest(1, least(7, new_rank));
  new_tier := public.tier_at_rank(new_rank);

  update public.creator_profiles
    set tier = new_tier, head_start_multiplier = h
    where id = cid;

  select public.tier_rank(tier) into last_rank
    from public.tier_standings
    where creator_id = cid and week_start < wk
    order by week_start desc limit 1;

  insert into public.tier_standings (creator_id, week_start, tier, score, movement, impressions, in_redemption)
  values (cid, wk, new_tier, standing, new_rank - coalesce(last_rank, cur_rank),
          coalesce((select impressions_7d from public.creator_metrics where creator_id = cid), 0),
          new_rank < coalesce(last_rank, cur_rank))
  on conflict (creator_id, week_start) do update set
    tier = excluded.tier, score = excluded.score, movement = excluded.movement,
    impressions = excluded.impressions, in_redemption = excluded.in_redemption;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Price floor enforcement, a creator can never price below their tier.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_rate_floor()
returns trigger language plpgsql set search_path = public as $$
declare f int;
begin
  if new.starting_rate_naira is not null then
    f := public.tier_floor(new.tier);
    if new.starting_rate_naira < f then
      new.starting_rate_naira := f;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_rate_floor on public.creator_profiles;
create trigger trg_enforce_rate_floor
  before insert or update of starting_rate_naira, tier on public.creator_profiles
  for each row execute function public.enforce_rate_floor();

-- ---------------------------------------------------------------------------
-- 8. Event triggers that drive the engine.
-- ---------------------------------------------------------------------------
-- Entry signals filled/updated → (re)place the creator.
create or replace function public.trg_entry_signals_fn()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.compute_eps(new.creator_id);
  perform public.recompute_creator_tier(new.creator_id);
  return new;
end;
$$;
drop trigger if exists trg_entry_signals on public.entry_signals;
create trigger trg_entry_signals
  after insert or update on public.entry_signals
  for each row execute function public.trg_entry_signals_fn();

-- Gig reaches a terminal success / dispute → decay head start + recompute tier.
create or replace function public.trg_gig_status_fn()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('released','completed') then
      update public.creator_profiles
        set head_start_remaining = greatest(0, head_start_remaining - 1)
        where id = new.creator_id;
      perform public.recompute_creator_tier(new.creator_id);
    elsif new.status = 'disputed' then
      perform public.recompute_creator_tier(new.creator_id);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_gig_status on public.gigs;
create trigger trg_gig_status
  after update of status on public.gigs
  for each row execute function public.trg_gig_status_fn();

-- New review about a creator → recompute their metrics + tier.
create or replace function public.trg_review_fn()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.creator_profiles where id = new.subject_id) then
    perform public.recompute_creator_tier(new.subject_id);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_review on public.reviews;
create trigger trg_review
  after insert on public.reviews
  for each row execute function public.trg_review_fn();

-- ---------------------------------------------------------------------------
-- 9. Lock down direct execution, the engine runs via triggers + service role.
-- ---------------------------------------------------------------------------
revoke execute on function
  public.compute_eps(uuid), public.compute_ers(uuid),
  public.recompute_creator_metrics(uuid), public.recompute_creator_tier(uuid)
  from public, anon, authenticated;
grant execute on function
  public.compute_eps(uuid), public.compute_ers(uuid),
  public.recompute_creator_metrics(uuid), public.recompute_creator_tier(uuid)
  to service_role;
