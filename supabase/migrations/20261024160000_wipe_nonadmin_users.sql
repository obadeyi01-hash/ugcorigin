-- ============================================================================
-- UGCOrigin — the one-time user wipe already ran in production.
--
-- This file used to delete every auth user except one super_admin. Leaving
-- that body in the chain meant a fresh `supabase db push` (a new environment,
-- a restore, a teammate's first setup) would destroy the database again.
--
-- It is now a no-op. If `supabase db push` reports a checksum mismatch on
-- version 20261024160000, the remote already applied the old body. Confirm
-- that, then repair the history without re-running it:
--   supabase migration repair --status applied 20261024160000
-- Do not restore the DELETE statements.
-- ============================================================================

do $$
begin
  raise notice '20261024160000 user wipe is retired. No rows were deleted.';
end $$;
