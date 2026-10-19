-- ============================================================================
-- UGCOrigin, brand reliability metrics (pay transparency for creators).
-- Just as brands see a creator's delivery track record, creators can see how a
-- brand behaves: how many gigs it posts vs actually funds, completion, disputes,
-- and its rating from creators. Recomputed from source tables via triggers.
-- ============================================================================

create table if not exists public.brand_metrics (
  brand_id       uuid primary key references public.brand_profiles(id) on delete cascade,
  gigs_posted    integer not null default 0,
  gigs_funded    integer not null default 0,
  gigs_completed integer not null default 0,
  disputes       integer not null default 0,
  avg_rating     numeric(3,2),
  review_count   integer not null default 0,
  updated_at     timestamptz not null default now()
);

alter table public.brand_metrics enable row level security;

drop policy if exists brand_metrics_select on public.brand_metrics;
create policy brand_metrics_select on public.brand_metrics for select to anon, authenticated using (true);
grant select on public.brand_metrics to anon, authenticated;

create or replace function public.recompute_brand_metrics(brand uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_posted integer; v_funded integer; v_completed integer; v_disputes integer;
  v_reviews integer; v_avg numeric(3,2);
begin
  select count(*),
         count(*) filter (where status in ('funded','in_progress','in_review','revision','approved','released','completed')),
         count(*) filter (where status in ('approved','released','completed'))
    into v_posted, v_funded, v_completed
  from public.gigs where brand_id = brand;

  select count(*) into v_disputes
  from public.disputes d join public.gigs g on g.id = d.gig_id
  where g.brand_id = brand;

  select count(*), avg((rating_speed + rating_comms + rating_quality) / 3.0)
    into v_reviews, v_avg
  from public.reviews where subject_id = brand and role = 'brand';

  insert into public.brand_metrics as m
    (brand_id, gigs_posted, gigs_funded, gigs_completed, disputes, avg_rating, review_count, updated_at)
  values (brand, v_posted, v_funded, v_completed, v_disputes, v_avg, coalesce(v_reviews,0), now())
  on conflict (brand_id) do update set
    gigs_posted = excluded.gigs_posted,
    gigs_funded = excluded.gigs_funded,
    gigs_completed = excluded.gigs_completed,
    disputes = excluded.disputes,
    avg_rating = excluded.avg_rating,
    review_count = excluded.review_count,
    updated_at = now();
end;
$$;

create or replace function public.trg_recompute_brand_from_gig()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recompute_brand_metrics(coalesce(new.brand_id, old.brand_id));
  return null;
end;
$$;

create or replace function public.trg_recompute_brand_from_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.role, old.role) = 'brand' then
    perform public.recompute_brand_metrics(coalesce(new.subject_id, old.subject_id));
  end if;
  return null;
end;
$$;

create or replace function public.trg_recompute_brand_from_dispute()
returns trigger language plpgsql security definer set search_path = public as $$
declare b uuid;
begin
  select brand_id into b from public.gigs where id = coalesce(new.gig_id, old.gig_id);
  if b is not null then perform public.recompute_brand_metrics(b); end if;
  return null;
end;
$$;

drop trigger if exists gigs_recompute_brand on public.gigs;
create trigger gigs_recompute_brand
  after insert or update of status or delete on public.gigs
  for each row execute function public.trg_recompute_brand_from_gig();

drop trigger if exists reviews_recompute_brand on public.reviews;
create trigger reviews_recompute_brand
  after insert or update or delete on public.reviews
  for each row execute function public.trg_recompute_brand_from_review();

drop trigger if exists disputes_recompute_brand on public.disputes;
create trigger disputes_recompute_brand
  after insert or update or delete on public.disputes
  for each row execute function public.trg_recompute_brand_from_dispute();

do $$
declare r record;
begin
  for r in select id from public.brand_profiles loop
    perform public.recompute_brand_metrics(r.id);
  end loop;
end $$;
