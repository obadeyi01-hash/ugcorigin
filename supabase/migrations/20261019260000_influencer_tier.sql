-- ============================================================================
-- UGCOrigin, "Influencer" designation.
-- Advanced creators with real reach are badged Influencers. It's granted
-- automatically at the top tiers, and admins can designate it manually for a
-- creator with a notable following before they've climbed the tiers.
-- ============================================================================

alter table public.creator_profiles add column if not exists is_influencer boolean not null default false;

comment on column public.creator_profiles.is_influencer is
  'Admin-set Influencer designation. The badge also shows automatically at top tiers.';
