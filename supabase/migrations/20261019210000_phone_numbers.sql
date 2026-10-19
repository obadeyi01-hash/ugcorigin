-- ============================================================================
-- UGCOrigin, phone numbers (E.164, e.g. +2348012345678).
-- One number per persona: a creator number on creator_profiles and a brand
-- number on brand_profiles. Since both profiles share one auth account, an
-- account holds at most two numbers. Nigeria-first, Africa-ready.
-- ============================================================================

alter table public.creator_profiles add column if not exists phone text;
alter table public.brand_profiles   add column if not exists phone text;
