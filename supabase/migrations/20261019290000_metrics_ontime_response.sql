-- ============================================================================
-- UGCOrigin, compute on-time rate + response time in creator metrics.
-- Replaces recompute_creator_metrics to also fill on_time_rate (share of
-- completed gigs with a deadline that were delivered on time) and
-- response_time_mins (average minutes to the creator's first reply in chat).
-- Triggers already call this function; no trigger changes needed.
-- ============================================================================

create or replace function public.recompute_creator_metrics(creator uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_gigs      integer;
  v_avg       numeric(3,2);
  v_reviews   integer;
  v_repeat    numeric(5,2);
  v_brands    integer;
  v_repeaters integer;
  v_ontime    numeric(5,2);
  v_resp      integer;
  v_den       integer;
  v_num       integer;
begin
  select count(*) into v_gigs
  from public.gigs
  where creator_id = creator and status in ('approved','released','completed');

  select count(*),
         avg((rating_speed + rating_comms + rating_quality) / 3.0)
    into v_reviews, v_avg
  from public.reviews
  where subject_id = creator and role = 'creator';

  select count(distinct brand_id),
         count(distinct brand_id) filter (where cnt > 1)
    into v_brands, v_repeaters
  from (
    select brand_id, count(*) as cnt
    from public.gigs
    where creator_id = creator and status in ('approved','released','completed')
    group by brand_id
  ) b;
  v_repeat := case when v_brands > 0 then round(100.0 * v_repeaters / v_brands, 1) else null end;

  -- On-time rate: among finished gigs that had a deadline, the share whose first
  -- deliverable was submitted on or before the deadline.
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

  -- Response time: average minutes from an incoming message to the creator's
  -- next reply, across their conversations (ignoring gaps over 7 days).
  select round(avg(extract(epoch from (next_at - created_at)) / 60.0))::int
    into v_resp
  from (
    select m.created_at, m.sender_id,
           lead(m.sender_id) over w as next_sender,
           lead(m.created_at) over w as next_at
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where c.creator_id = creator
    window w as (partition by m.conversation_id order by m.created_at)
  ) s
  where s.sender_id <> creator
    and s.next_sender = creator
    and s.next_at is not null
    and s.next_at - s.created_at < interval '7 days';

  insert into public.creator_metrics as m
    (creator_id, gigs_completed, avg_rating, review_count, repeat_hire_rate, on_time_rate, response_time_mins, updated_at)
  values
    (creator, v_gigs, v_avg, coalesce(v_reviews, 0), v_repeat, v_ontime, v_resp, now())
  on conflict (creator_id) do update set
    gigs_completed     = excluded.gigs_completed,
    avg_rating         = excluded.avg_rating,
    review_count       = excluded.review_count,
    repeat_hire_rate   = excluded.repeat_hire_rate,
    on_time_rate       = excluded.on_time_rate,
    response_time_mins = excluded.response_time_mins,
    updated_at         = now();
end;
$$;

-- Backfill all creators once with the new fields.
do $$
declare r record;
begin
  for r in select id from public.creator_profiles loop
    perform public.recompute_creator_metrics(r.id);
  end loop;
end $$;
