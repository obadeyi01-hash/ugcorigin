-- ============================================================================
-- UGCOrigin, brand verification (anti-impersonation).
-- Brands submit a business/RC (CAC) number; Trust & Safety reviews and marks
-- them verified. A "Verified brand" badge then shows to creators. brand_profiles
-- already has verification_status (unverified | pending | verified).
-- ============================================================================

alter table public.brand_profiles add column if not exists rc_number         text;
alter table public.brand_profiles add column if not exists verification_note text;
alter table public.brand_profiles add column if not exists verification_submitted_at timestamptz;

create index if not exists brand_profiles_verif_idx
  on public.brand_profiles (verification_status) where verification_status = 'pending';
