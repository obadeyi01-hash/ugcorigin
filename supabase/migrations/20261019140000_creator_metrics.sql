-- ============================================================================
-- UGCOrigin, creator trust-signal metrics.
-- Real, on-platform outcomes aggregated per creator so brands see proof, not
-- claims. Populated by a SECURITY DEFINER recompute function fired on gig
-- completion and new reviews. Nothing is fabricated: a brand-new creator has
-- zero/NULL values and the profile snapshot renders nothing until they deliver.
-- Idempotent: the table may already exist from an earlier hotfix.
-- ============================================================================

create table if not exists public.creator_metrics (
  creator_id        uuid primary key references public.creator_profiles(id) on delete cascade,
  gigs_completed    integer not null default 0,
  avg_rating        numeric(3,2),
  review_count      integer not null default 0,
  on_time_rate      numeric(5,2),    -- reserved: wired when delivery timestamps land
  repeat_hire_rate  numeric(5,2),
  response_time_mins integer,        -- reserved: wired with messaging analytics
  updated_at        timestamptz not null default now()
);

-- Reconcile columns in case an earlier version of the table was thinner.
alter table public.creator_metrics add column if not exists gigs_completed integer not null default 0;
alter table public.creator_metrics add column if not exists avg_rating numeric(3,2);
alter table public.creator_metrics add column if not exists review_count integer not null default 0;
alter table public.creator_metrics add column if not exists on_time_rate numeric(5,2);
alter table public.creator_metrics add column if not exists repeat_hire_rate numeric(5,2);
alter table public.creator_metrics add column if not exists response_time_mins integer;
alter table public.creator_metrics add column if not exists updated_at timestamptz not null default now();

alter table public.creator_metrics enable row level security;

-- Trust signals are public for live creators; owner + admin always.
drop policy if exists creator_metrics_select on public.creator_metrics;
create policy creator_metrics_select on public.creator_metrics for select to anon, authenticated
  using (public.creator_is_live(creator_id) or creator_id = auth.uid() or public.is_admin());

grant select on public.creator_metrics to anon, authenticated;

-- Recompute all aggregates for one creator from source-of-truth tables.
-- SECURITY DEFINER so triggers can write regardless of the acting user's RLS.
-- Drop first: an earlier hotfix may have created it with a different arg name.
drop function if exists public.recompute_creator_metrics(uuid);
create or replace function public.recompute_creator_metrics(creator uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_gigs      integer;
  v_avg       numeric(3,2);
  v_reviews   integer;
  v_repeat    numeric(5,2);
  v_brands    integer;
  v_repeaters integer;
begin
  -- Completed gigs (money changed hands / work shipped).
  select count(*) into v_gigs
  from public.gigs
  where creator_id = creator
    and status in ('approved','released','completed');

  -- Reviews left on the creator (role = 'creator' means the creator is subject).
  select count(*),
         avg((rating_speed + rating_comms + rating_quality) / 3.0)
    into v_reviews, v_avg
  from public.reviews
  where subject_id = creator and role = 'creator';

  -- Repeat-hire rate: share of distinct brands who booked this creator twice+.
  select count(distinct brand_id),
         count(distinct brand_id) filter (where cnt > 1)
    into v_brands, v_repeaters
  from (
    select brand_id, count(*) as cnt
    from public.gigs
    where creator_id = creator
      and status in ('approved','released','completed')
    group by brand_id
  ) b;
  v_repeat := case when v_brands > 0 then round(100.0 * v_repeaters / v_brands, 1) else null end;

  insert into public.creator_metrics as m
    (creator_id, gigs_completed, avg_rating, review_count, repeat_hire_rate, updated_at)
  values
    (creator, v_gigs, v_avg, coalesce(v_reviews, 0), v_repeat, now())
  on conflict (creator_id) do update set
    gigs_completed   = excluded.gigs_completed,
    avg_rating       = excluded.avg_rating,
    review_count     = excluded.review_count,
    repeat_hire_rate = excluded.repeat_hire_rate,
    updated_at       = now();
end;
$$;

-- Trigger glue: recompute when a gig's status changes or a review lands.
create or replace function public.trg_recompute_from_gig()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recompute_creator_metrics(coalesce(new.creator_id, old.creator_id));
  return null;
end;
$$;

create or replace function public.trg_recompute_from_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.role, old.role) = 'creator' then
    perform public.recompute_creator_metrics(coalesce(new.subject_id, old.subject_id));
  end if;
  return null;
end;
$$;

drop trigger if exists gigs_recompute_metrics on public.gigs;
create trigger gigs_recompute_metrics
  after insert or update of status or delete on public.gigs
  for each row execute function public.trg_recompute_from_gig();

drop trigger if exists reviews_recompute_metrics on public.reviews;
create trigger reviews_recompute_metrics
  after insert or update or delete on public.reviews
  for each row execute function public.trg_recompute_from_review();

-- Backfill existing creators once.
do $$
declare r record;
begin
  for r in select id from public.creator_profiles loop
    perform public.recompute_creator_metrics(r.id);
  end loop;
end $$;
