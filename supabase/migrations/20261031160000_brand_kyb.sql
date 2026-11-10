-- Manual brand KYB: tie a company to a real, named person, reviewed by an
-- admin, pending automated checks (Dojah / Smile ID) and legal sign-off later.
--
-- Captures the registered business address and the authorised person's full
-- name plus a one-time NIMC code (Virtual NIN or Share Code), tokenized the
-- same way as a creator's. The raw 11-digit NIN is never stored. `person_
-- verified` defaults false, so existing verified brands show up as "business
-- verified, person not yet tied" for follow-up.

alter table public.brand_profiles
  add column if not exists registered_address  text,
  add column if not exists director_name       text,
  add column if not exists director_id_token   text,  -- vNIN / Share Code; cleared after review
  add column if not exists director_id_hash    text,  -- kept for audit / de-dupe
  add column if not exists director_consent_at timestamptz,
  add column if not exists person_verified     boolean not null default false;

-- PII: the anon key is public, so keep these off anon/authenticated reads. The
-- service role (admin console, verification action) reads and writes them.
revoke select (registered_address, director_name, director_id_token, director_id_hash)
  on public.brand_profiles from anon, authenticated;

-- These are set only through the service-role verification path, never by the
-- brand updating its own row directly.
revoke update (director_id_token, director_id_hash, director_consent_at, person_verified)
  on public.brand_profiles from authenticated;
