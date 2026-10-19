-- ============================================================================
-- UGCOrigin, username (handle) governance.
-- The handle a creator picks at onboarding is their assigned username. They get
-- ONE free change after that; further changes are a paid (subscription) perk,
-- enforced in the app. We track how many changes they have spent here.
-- ============================================================================

alter table public.creator_profiles
  add column if not exists username_changes smallint not null default 0;

comment on column public.creator_profiles.username_changes is
  'Count of handle changes made after the initial onboarding handle. 1 free, then paid.';
