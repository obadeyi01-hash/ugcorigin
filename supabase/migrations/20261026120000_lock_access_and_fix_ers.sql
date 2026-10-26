-- ============================================================================
-- UGCOrigin — close the holes the app-layer checks do not cover.
-- The anon key is public. RLS and column grants are the real boundary.
-- ============================================================================

-- Admin membership is readable. Role changes are service-role only, so a
-- support session cannot PATCH itself to super_admin.
drop policy if exists admin_all on public.admin_users;
drop policy if exists admin_select on public.admin_users;
create policy admin_select on public.admin_users
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke insert, update, delete on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

-- is_admin() used to ignore min_role. Rank is only applied when a caller
-- passes one. Existing policies call is_admin() with no argument and stay
-- "any admin".
create or replace function public.is_admin(min_role text default null)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  have text;
  rank_have int;
  rank_need int;
begin
  select a.role into have from public.admin_users a where a.user_id = auth.uid();
  if have is null then
    return false;
  end if;
  if min_role is null or length(btrim(min_role)) = 0 then
    return true;
  end if;
  rank_have := case have
    when 'analyst' then 1
    when 'support' then 2
    when 'growth' then 3
    when 'trust_safety' then 4
    when 'finance' then 5
    when 'super_admin' then 6
    else 0
  end;
  rank_need := case min_role
    when 'analyst' then 1
    when 'support' then 2
    when 'growth' then 3
    when 'trust_safety' then 4
    when 'finance' then 5
    when 'super_admin' then 6
    else 99
  end;
  return rank_have >= rank_need;
end;
$$;

-- PII on world-readable profile rows. Column grants do not restrict SELECT,
-- so revoke the columns themselves. Owners and gig parties read them through
-- the service role after an app-level relationship check.
revoke select (phone, payout_bank_code, payout_account_number, payout_recipient_code)
  on public.creator_profiles from anon, authenticated;
revoke select (phone, rc_number, verification_note)
  on public.brand_profiles from anon, authenticated;

-- Legal name, handle, and the Pro/avatar counters are not self-serve via the
-- Data API. Settings writes them with the service role after the quota check.
revoke update (handle, first_name, last_name, middle_name, username_changes, avatar_changes, avatar_last_changed_at)
  on public.creator_profiles from authenticated;
revoke update (rc_number) on public.brand_profiles from authenticated;

-- A takedown sticks. goLiveAction refuses while suspended is true.
alter table public.creator_profiles
  add column if not exists suspended boolean not null default false;
revoke update (suspended) on public.creator_profiles from anon, authenticated;

-- Offers: either party could rewrite price_naira. They may only move status,
-- and only along the legal edge.
revoke update on public.offers from anon, authenticated;
grant update (status) on public.offers to authenticated;

drop policy if exists offers_update on public.offers;
create policy offers_creator_decide on public.offers
  for update to authenticated
  using (
    creator_id = auth.uid()
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  )
  with check (
    creator_id = auth.uid()
    and status in ('accepted', 'declined')
  );
create policy offers_brand_withdraw on public.offers
  for update to authenticated
  using (brand_id = auth.uid() and status = 'pending')
  with check (brand_id = auth.uid() and status = 'withdrawn');

-- Deliverables are written by the service role only. A participant used to be
-- able to set status = approved and unlock the clean file.
revoke insert, update, delete on public.deliverables from anon, authenticated;
drop policy if exists deliverables_insert on public.deliverables;
drop policy if exists deliverables_update on public.deliverables;

-- Reviews: completed gig, and the subject is the other party.
drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.gigs g
      where g.id = gig_id
        and g.status = 'completed'
        and (
          (g.brand_id = auth.uid() and subject_id = g.creator_id and role = 'brand')
          or (g.creator_id = auth.uid() and subject_id = g.brand_id and role = 'creator')
        )
    )
  );

-- Showcase videos: `verified` is not an insertable column. The completed-gig
-- path writes it with the service role.
revoke insert on public.profile_videos from authenticated;
grant insert (creator_id, public_id, url, poster_url, position, caption, gig_id)
  on public.profile_videos to authenticated;

-- A creator cannot mark their own social handle verified.
revoke insert, update on public.social_accounts from authenticated;
grant insert (creator_id, platform, handle, url) on public.social_accounts to authenticated;
grant update (handle, url) on public.social_accounts to authenticated;

-- ERS was averaging the creator's review of the brand (role = 'creator').
-- A brand's review of the creator is stored as role = 'brand'.
create or replace function public.recompute_creator_metrics(creator uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_gigs       integer;
  v_completed  integer;
  v_concluded  integer;
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

  v_approval := case when v_concluded > 0 then round(100.0 * v_completed / v_concluded, 2) else 0 end;
  v_dispute  := case when (v_completed + v_disputed) > 0 then round(100.0 * v_disputed / (v_completed + v_disputed), 2) else 0 end;

  -- Brand reviewing this creator. role 'creator' is the creator reviewing the brand.
  select avg((rating_speed + rating_comms + rating_quality) / 3.0), count(*)
    into v_avg, v_reviews
  from public.reviews where subject_id = creator and role = 'brand';
  v_reviews := coalesce(v_reviews, 0);

  select count(distinct brand_id), count(distinct brand_id) filter (where cnt > 1)
    into v_brands, v_repeaters
  from (
    select brand_id, count(*) as cnt from public.gigs
    where creator_id = creator and status in ('approved','released','completed')
    group by brand_id
  ) b;
  v_repeat := case when v_brands > 0 then round(100.0 * v_repeaters / v_brands, 1) else null end;

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

-- Refresh scores so the corrected review role takes effect on existing rows.
do $$
declare r record;
begin
  for r in select id from public.creator_profiles loop
    perform public.recompute_creator_tier(r.id);
  end loop;
end $$;
