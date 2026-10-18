-- ============================================================================
-- UGCOrigin, anti-AI enforcement flags.
-- `ai_flagged`: profile text claims AI-generated / not-the-real-creator work
--   (set by the save action; the creator is warned to remove it).
-- `shadowbanned`: hidden from search/discovery (set by admins, or by policy
--   after repeated AI claims). Both are service-role only (not in the
--   authenticated column grants), so creators can't self-clear them.
-- ============================================================================

alter table public.creator_profiles add column if not exists ai_flagged   boolean not null default false;
alter table public.creator_profiles add column if not exists shadowbanned boolean not null default false;

-- Common directory query is "live and not shadowbanned".
create index if not exists creator_profiles_live_visible
  on public.creator_profiles (is_live) where not shadowbanned;
