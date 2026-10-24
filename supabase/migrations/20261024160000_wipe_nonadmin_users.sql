-- ============================================================================
-- UGCOrigin — ONE-TIME DATA WIPE (founder-requested, pre-launch).
--
-- Remove every user and all their data EXCEPT the Dream Intrepid super-admin, so
-- the platform starts from a clean slate. This is destructive and irreversible.
-- Runs once (tracked migration). FK enforcement is disabled for the operation
-- (session_replication_role = replica) so deletion order can't block on the
-- restrict FKs in the money/gig chain; it's restored at the end.
-- Aborts safely (whole migration rolls back) if no super-admin is found.
-- ============================================================================

do $$
declare keep uuid;
begin
  select user_id into keep from public.admin_users where role = 'super_admin' limit 1;
  if keep is null then
    raise exception 'No super_admin found in admin_users; aborting wipe to avoid deleting everyone.';
  end if;

  set session_replication_role = replica;

  -- Money / gig chain (all test data).
  delete from public.ledger_entries;
  delete from public.escrow_transactions;
  delete from public.payouts;
  delete from public.deliverable_comments;
  delete from public.deliverables;
  delete from public.disputes;
  delete from public.media_reviews;
  delete from public.reviews;
  delete from public.meetings;
  delete from public.applications;
  delete from public.offers;
  delete from public.gigs;
  delete from public.briefs;

  -- Campaigns / boosts / subscriptions.
  delete from public.campaign_submissions;
  delete from public.campaigns;
  delete from public.boosts;
  delete from public.subscriptions;

  -- Messaging, social graph, media, packages.
  delete from public.messages;
  delete from public.conversations;
  delete from public.saved_creators;
  delete from public.social_accounts;
  delete from public.packages;
  delete from public.portfolio_links;
  delete from public.profile_videos;
  delete from public.jolt_reactions;
  delete from public.jolts;

  -- Scoring / verification / support / reports.
  delete from public.entry_signals;
  delete from public.creator_metrics;
  delete from public.brand_metrics;
  delete from public.tier_standings;
  delete from public.verifications;
  delete from public.support_tickets;
  delete from public.reports;

  -- Per-user state (keep only the super-admin's).
  delete from public.notifications where user_id is distinct from keep;
  delete from public.user_settings  where user_id is distinct from keep;
  delete from public.audit_log       where actor_id is distinct from keep;
  delete from public.creator_profiles where id <> keep;
  delete from public.brand_profiles   where id <> keep;
  delete from public.admin_users      where user_id <> keep;
  delete from public.profiles         where id <> keep;

  -- Finally the auth users themselves.
  delete from auth.users where id <> keep;

  set session_replication_role = default;
end $$;
