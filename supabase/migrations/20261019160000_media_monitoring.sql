-- ============================================================================
-- UGCOrigin, profile media monitoring.
-- We track how often a creator swaps their avatar. Genuine creators settle on a
-- face; frequent swaps are a signal of catfishing / recycled or AI stock faces,
-- so rapid changes raise a flag for admin review. (Automated AI-image detection
-- is a later integration; this is the heuristic layer that ships now.)
-- ============================================================================

alter table public.creator_profiles
  add column if not exists avatar_changes smallint not null default 0;
alter table public.creator_profiles
  add column if not exists avatar_last_changed_at timestamptz;
alter table public.creator_profiles
  add column if not exists media_flagged boolean not null default false;

comment on column public.creator_profiles.media_flagged is
  'Set when avatar churn (or future AI-image detection) warrants admin media review.';

create index if not exists creator_profiles_media_flagged_idx
  on public.creator_profiles (media_flagged) where media_flagged;
