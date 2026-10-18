-- ============================================================================
-- UGCOrigin, Row-Level Security
-- Default deny on every table. Public read only where it belongs (live creator
-- profiles, open briefs, reviews, jolts). Money tables have NO user write
-- policies → only the service role (edge functions / webhooks) can write them.
-- ============================================================================

-- RLS helpers ----------------------------------------------------------------
create or replace function public.is_gig_participant(g uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.gigs x
    where x.id = g and (x.brand_id = auth.uid() or x.creator_id = auth.uid())
  );
$$;

create or replace function public.creator_is_live(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_live from public.creator_profiles where id = c), false);
$$;

-- Enable RLS -----------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.admin_users          enable row level security;
alter table public.creator_profiles     enable row level security;
alter table public.social_accounts      enable row level security;
alter table public.packages             enable row level security;
alter table public.brand_profiles       enable row level security;
alter table public.saved_creators       enable row level security;
alter table public.briefs               enable row level security;
alter table public.applications         enable row level security;
alter table public.offers               enable row level security;
alter table public.gigs                 enable row level security;
alter table public.deliverables         enable row level security;
alter table public.deliverable_comments enable row level security;
alter table public.escrow_transactions  enable row level security;
alter table public.ledger_entries       enable row level security;
alter table public.payouts              enable row level security;
alter table public.disputes             enable row level security;
alter table public.reviews              enable row level security;
alter table public.verifications        enable row level security;
alter table public.jolts                enable row level security;
alter table public.jolt_reactions       enable row level security;
alter table public.notifications        enable row level security;
alter table public.audit_log            enable row level security;

-- profiles -------------------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- admin_users ----------------------------------------------------------------
create policy admin_all on public.admin_users for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- creator_profiles -----------------------------------------------------------
create policy creator_select on public.creator_profiles for select to anon, authenticated
  using (is_live = true or id = auth.uid() or public.is_admin());
create policy creator_insert on public.creator_profiles for insert to authenticated
  with check (id = auth.uid());
create policy creator_update on public.creator_profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- social_accounts ------------------------------------------------------------
create policy social_select on public.social_accounts for select to anon, authenticated
  using (public.creator_is_live(creator_id) or creator_id = auth.uid() or public.is_admin());
create policy social_write on public.social_accounts for all to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());

-- packages -------------------------------------------------------------------
create policy packages_select on public.packages for select to anon, authenticated
  using ((public.creator_is_live(creator_id) and active) or creator_id = auth.uid() or public.is_admin());
create policy packages_write on public.packages for all to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());

-- brand_profiles (company info is semi-public so offers/gigs can render) ------
create policy brand_select on public.brand_profiles for select to anon, authenticated
  using (true);
create policy brand_insert on public.brand_profiles for insert to authenticated
  with check (id = auth.uid());
create policy brand_update on public.brand_profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- saved_creators -------------------------------------------------------------
create policy saved_write on public.saved_creators for all to authenticated
  using (brand_id = auth.uid()) with check (brand_id = auth.uid());

-- briefs ---------------------------------------------------------------------
create policy briefs_select on public.briefs for select to anon, authenticated
  using (status = 'open' or brand_id = auth.uid() or public.is_admin());
create policy briefs_write on public.briefs for all to authenticated
  using (brand_id = auth.uid() or public.is_admin()) with check (brand_id = auth.uid() or public.is_admin());

-- applications ---------------------------------------------------------------
create policy applications_select on public.applications for select to authenticated
  using (
    creator_id = auth.uid()
    or exists (select 1 from public.briefs b where b.id = brief_id and b.brand_id = auth.uid())
    or public.is_admin()
  );
create policy applications_insert on public.applications for insert to authenticated
  with check (creator_id = auth.uid());
create policy applications_update on public.applications for update to authenticated
  using (
    creator_id = auth.uid()
    or exists (select 1 from public.briefs b where b.id = brief_id and b.brand_id = auth.uid())
    or public.is_admin()
  );

-- offers ---------------------------------------------------------------------
create policy offers_select on public.offers for select to authenticated
  using (brand_id = auth.uid() or creator_id = auth.uid() or public.is_admin());
create policy offers_insert on public.offers for insert to authenticated
  with check (brand_id = auth.uid());
create policy offers_update on public.offers for update to authenticated
  using (brand_id = auth.uid() or creator_id = auth.uid() or public.is_admin());

-- gigs -----------------------------------------------------------------------
create policy gigs_select on public.gigs for select to authenticated
  using (brand_id = auth.uid() or creator_id = auth.uid() or public.is_admin());
create policy gigs_insert on public.gigs for insert to authenticated
  with check (brand_id = auth.uid());
create policy gigs_update on public.gigs for update to authenticated
  using (brand_id = auth.uid() or creator_id = auth.uid() or public.is_admin());

-- deliverables ---------------------------------------------------------------
create policy deliverables_select on public.deliverables for select to authenticated
  using (public.is_gig_participant(gig_id) or public.is_admin());
create policy deliverables_insert on public.deliverables for insert to authenticated
  with check (exists (select 1 from public.gigs g where g.id = gig_id and g.creator_id = auth.uid()));
create policy deliverables_update on public.deliverables for update to authenticated
  using (public.is_gig_participant(gig_id) or public.is_admin());

-- deliverable_comments -------------------------------------------------------
create policy comments_select on public.deliverable_comments for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.deliverables d where d.id = deliverable_id and public.is_gig_participant(d.gig_id)
    )
  );
create policy comments_insert on public.deliverable_comments for insert to authenticated
  with check (
    author_id = auth.uid() and exists (
      select 1 from public.deliverables d where d.id = deliverable_id and public.is_gig_participant(d.gig_id)
    )
  );

-- escrow_transactions, READ only for participants; writes: service role only -
create policy escrow_select on public.escrow_transactions for select to authenticated
  using (public.is_gig_participant(gig_id) or public.is_admin());

-- ledger_entries, immutable; read for participants; writes: service role only
create policy ledger_select on public.ledger_entries for select to authenticated
  using ((gig_id is not null and public.is_gig_participant(gig_id)) or user_id = auth.uid() or public.is_admin());

-- payouts, read own; writes: service role only --------------------------------
create policy payouts_select on public.payouts for select to authenticated
  using (creator_id = auth.uid() or public.is_admin());

-- disputes -------------------------------------------------------------------
create policy disputes_select on public.disputes for select to authenticated
  using (public.is_gig_participant(gig_id) or public.is_admin());
create policy disputes_insert on public.disputes for insert to authenticated
  with check (opened_by = auth.uid() and public.is_gig_participant(gig_id));
create policy disputes_update on public.disputes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- reviews, public reputation ------------------------------------------------
create policy reviews_select on public.reviews for select to anon, authenticated
  using (true);
create policy reviews_insert on public.reviews for insert to authenticated
  with check (author_id = auth.uid() and public.is_gig_participant(gig_id));

-- verifications, own read/insert; status updates: service role only ----------
create policy verifications_select on public.verifications for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy verifications_insert on public.verifications for insert to authenticated
  with check (user_id = auth.uid());

-- jolts ----------------------------------------------------------------------
create policy jolts_select on public.jolts for select to anon, authenticated using (true);
create policy jolts_write on public.jolts for all to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());

-- jolt_reactions -------------------------------------------------------------
create policy reactions_select on public.jolt_reactions for select to anon, authenticated using (true);
create policy reactions_write on public.jolt_reactions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notifications --------------------------------------------------------------
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- audit_log, admin read; writes: service role only --------------------------
create policy audit_select on public.audit_log for select to authenticated
  using (public.is_admin());
