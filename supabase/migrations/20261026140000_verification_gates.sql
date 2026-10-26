-- Unverified brands cannot publish. Creators who are not live cannot apply.
-- Public rows only exist when the other side has passed that check.
-- Private work (an offer, a gig, a conversation) can still read the company name.

create or replace function public.brand_is_verified(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select verification_status = 'verified' from public.brand_profiles where id = uid),
    false
  );
$$;

drop policy if exists brand_select on public.brand_profiles;
create policy brand_select on public.brand_profiles
  for select to anon, authenticated
  using (
    verification_status = 'verified'
    or id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.offers o
      where o.brand_id = brand_profiles.id and o.creator_id = auth.uid()
    )
    or exists (
      select 1 from public.gigs g
      where g.brand_id = brand_profiles.id and g.creator_id = auth.uid()
    )
    or exists (
      select 1 from public.conversations c
      where c.brand_id = brand_profiles.id and c.creator_id = auth.uid()
    )
  );

drop policy if exists campaigns_select on public.campaigns;
create policy campaigns_select on public.campaigns
  for select to anon, authenticated
  using (
    (status <> 'draft' and public.brand_is_verified(brand_id))
    or brand_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists campaigns_insert on public.campaigns;
create policy campaigns_insert on public.campaigns
  for insert to authenticated
  with check (brand_id = auth.uid() and public.brand_is_verified(auth.uid()));

drop policy if exists briefs_select on public.briefs;
create policy briefs_select on public.briefs
  for select to anon, authenticated
  using (
    (status = 'open' and public.brand_is_verified(brand_id))
    or brand_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists briefs_write on public.briefs;
create policy briefs_insert on public.briefs
  for insert to authenticated
  with check (brand_id = auth.uid() and public.brand_is_verified(auth.uid()));
create policy briefs_update on public.briefs
  for update to authenticated
  using (brand_id = auth.uid() or public.is_admin())
  with check (brand_id = auth.uid() or public.is_admin());
create policy briefs_delete on public.briefs
  for delete to authenticated
  using (brand_id = auth.uid() or public.is_admin());

drop policy if exists offers_insert on public.offers;
create policy offers_insert on public.offers
  for insert to authenticated
  with check (
    brand_id = auth.uid()
    and public.brand_is_verified(auth.uid())
    and public.creator_is_live(creator_id)
  );

drop policy if exists offers_creator_decide on public.offers;
create policy offers_creator_decide on public.offers
  for update to authenticated
  using (
    creator_id = auth.uid()
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  )
  with check (
    creator_id = auth.uid()
    and (
      status = 'declined'
      or (status = 'accepted' and public.creator_is_live(auth.uid()))
    )
  );

drop policy if exists applications_insert on public.applications;
create policy applications_insert on public.applications
  for insert to authenticated
  with check (creator_id = auth.uid() and public.creator_is_live(auth.uid()));

drop policy if exists submissions_insert on public.campaign_submissions;
create policy submissions_insert on public.campaign_submissions
  for insert to authenticated
  with check (creator_id = auth.uid() and public.creator_is_live(auth.uid()));
