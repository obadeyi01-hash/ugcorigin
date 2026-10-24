-- ============================================================================
-- UGCOrigin — fix Earned Reputation Score (ERS) scoring.
--
-- Two regressions had quietly broken ERS (and, since the directory ranker leans
-- ~60% on earned_reputation, the whole recommendation ordering):
--
--  1. The on-time/response migration (20261019290000) REPLACED
--     recompute_creator_metrics but stopped writing approval_rate and
--     dispute_rate (and acceptance_rate was never computed). Those columns are
--     `not null default 0`, so ERS's biggest intended signal — approval_rate,
--     weighted 0.30 — sat permanently at 0 for everyone.
--
--  2. compute_ers was not null-safe: recompute writes NULL for on_time_rate /
--     repeat_hire_rate when a creator has no deadline gigs / no repeat brand
--     (i.e. almost every creator early on), and a single NULL made the whole
--     ERS expression NULL → earned_reputation came out NULL, not a number.
--
-- This migration restores all six ERS inputs in recompute_creator_metrics
-- (computing acceptance_rate honestly from the offers the creator acted on),
-- makes compute_ers null-safe, and backfills every creator so corrected scores
-- and tiers propagate. Triggers already call these by name — no trigger change.
-- ============================================================================

-- on_time_rate / repeat_hire_rate were NOT NULL DEFAULT 0, which forces "no data
-- yet" to read as a damning 0%. Make them nullable like avg_rating so absence of
-- evidence is representable; compute_ers coalesces to 0 for the score itself.
alter table public.creator_metrics alter column on_time_rate     drop not null;
alter table public.creator_metrics alter column repeat_hire_rate drop not null;

create or replace function public.recompute_creator_metrics(creator uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_gigs       integer;   -- gigs_completed (approved/released/completed)
  v_completed  integer;   -- released/completed (approval/dispute numerator base)
  v_concluded  integer;   -- released/completed/cancelled
  v_disputed   integer;
  v_avg        numeric(3,2);
  v_reviews    integer;
  v_brands     integer;
  v_repeaters  integer;
  v_repeat     numeric(5,2);
  v_ontime     numeric(5,2);
  v_resp       integer;
  v_den        integer;
  v_num        integer;
  v_off_den    integer;
  v_off_acc    integer;
  v_approval   numeric(5,2);
  v_dispute    numeric(5,2);
  v_accept     numeric(5,2);
begin
  -- Gig counts in one pass.
  select
    count(*) filter (where status in ('approved','released','completed')),
    count(*) filter (where status in ('released','completed')),
    count(*) filter (where status in ('released','completed','cancelled')),
    count(*) filter (where status = 'disputed')
    into v_gigs, v_completed, v_concluded, v_disputed
  from public.gigs where creator_id = creator;

  v_gigs      := coalesce(v_gigs, 0);
  v_completed := coalesce(v_completed, 0);
  v_concluded := coalesce(v_concluded, 0);
  v_disputed  := coalesce(v_disputed, 0);

  -- Approval: share of concluded gigs that ended approved (vs cancelled).
  v_approval := case when v_concluded > 0 then round(100.0 * v_completed / v_concluded, 2) else 0 end;
  -- Dispute: share of (completed + disputed) that were disputed.
  v_dispute  := case when (v_completed + v_disputed) > 0 then round(100.0 * v_disputed / (v_completed + v_disputed), 2) else 0 end;

  -- Reviews (creator as subject).
  select avg((rating_speed + rating_comms + rating_quality) / 3.0), count(*)
    into v_avg, v_reviews
  from public.reviews where subject_id = creator and role = 'creator';
  v_reviews := coalesce(v_reviews, 0);

  -- Repeat hire: distinct brands that hired more than once.
  select count(distinct brand_id), count(distinct brand_id) filter (where cnt > 1)
    into v_brands, v_repeaters
  from (
    select brand_id, count(*) as cnt from public.gigs
    where creator_id = creator and status in ('approved','released','completed')
    group by brand_id
  ) b;
  v_repeat := case when v_brands > 0 then round(100.0 * v_repeaters / v_brands, 1) else null end;

  -- On-time: among finished gigs with a deadline, share delivered on or before it.
  select count(*), count(*) filter (where first_del::date <= deadline)
    into v_den, v_num
  from (
    select g.id, g.deadline, min(d.created_at) as first_del
    from public.gigs g
    join public.deliverables d on d.gig_id = g.id
    where g.creator_id = creator
      and g.status in ('approved','released','completed')
      and g.deadline is not null
    group by g.id, g.deadline
  ) x;
  v_ontime := case when v_den > 0 then round(100.0 * v_num / v_den, 1) else null end;

  -- Response time: avg minutes to the creator's first reply (gaps >7d ignored).
  select round(avg(extract(epoch from (next_at - created_at)) / 60.0))::int
    into v_resp
  from (
    select m.created_at, m.sender_id,
           lead(m.sender_id)   over w as next_sender,
           lead(m.created_at)  over w as next_at
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where c.creator_id = creator
    window w as (partition by m.conversation_id order by m.created_at)
  ) s
  where s.sender_id <> creator
    and s.next_sender = creator
    and s.next_at is not null
    and s.next_at - s.created_at < interval '7 days';

  -- Acceptance: of offers the creator actually had to decide on, the share
  -- accepted. (withdrawn = brand pulled it, countered/pending = still open —
  -- all excluded so a creator isn't dinged for the brand's inaction.)
  select count(*) filter (where status in ('accepted','declined','expired')),
         count(*) filter (where status = 'accepted')
    into v_off_den, v_off_acc
  from public.offers where creator_id = creator;
  v_accept := case when coalesce(v_off_den, 0) > 0 then round(100.0 * v_off_acc / v_off_den, 2) else 0 end;

  insert into public.creator_metrics as m
    (creator_id, gigs_completed, approval_rate, dispute_rate, acceptance_rate,
     avg_rating, review_count, repeat_hire_rate, on_time_rate, response_time_mins, updated_at)
  values
    (creator, v_gigs, v_approval, v_dispute, v_accept,
     v_avg, v_reviews, v_repeat, v_ontime, v_resp, now())
  on conflict (creator_id) do update set
    gigs_completed     = excluded.gigs_completed,
    approval_rate      = excluded.approval_rate,
    dispute_rate       = excluded.dispute_rate,
    acceptance_rate    = excluded.acceptance_rate,
    avg_rating         = excluded.avg_rating,
    review_count       = excluded.review_count,
    repeat_hire_rate   = excluded.repeat_hire_rate,
    on_time_rate       = excluded.on_time_rate,
    response_time_mins = excluded.response_time_mins,
    updated_at         = now();
end;
$$;

-- Null-safe ERS: a missing signal counts as "no evidence → no credit" rather
-- than nulling the whole score. (dispute coalesces to 0 → full clean-record
-- credit, which is correct.)
create or replace function public.compute_ers(cid uuid)
returns numeric language plpgsql security definer set search_path = public as $$
declare
  m     public.creator_metrics%rowtype;
  rqual numeric;
  ers   numeric(5,2);
begin
  select * into m from public.creator_metrics where creator_id = cid;
  if not found then return 0; end if;

  rqual := case when m.review_count > 0 and m.avg_rating is not null then m.avg_rating / 5.0 else 0 end;

  ers := 100 * (
      0.30 * (coalesce(m.approval_rate, 0)    / 100.0)
    + 0.20 * (coalesce(m.on_time_rate, 0)     / 100.0)
    + 0.20 * (coalesce(m.repeat_hire_rate, 0) / 100.0)
    + 0.15 * rqual
    + 0.10 * (1 - (coalesce(m.dispute_rate, 0) / 100.0))
    + 0.05 * (coalesce(m.acceptance_rate, 0)  / 100.0)
  );
  ers := greatest(0, least(100, round(ers, 2)));

  update public.creator_metrics set earned_reputation = ers, updated_at = now() where creator_id = cid;
  update public.creator_profiles  set earned_reputation = ers where id = cid;
  return ers;
end;
$$;

-- Backfill: recompute metrics + ERS + tier for every creator so the corrected
-- scores (and any resulting ±1 tier move) take effect now.
do $$
declare r record;
begin
  for r in select id from public.creator_profiles loop
    perform public.recompute_creator_tier(r.id);
  end loop;
end $$;
