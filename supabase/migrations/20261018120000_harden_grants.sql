-- ============================================================================
-- UGCOrigin, harden write access (airtight verification gate)
-- RLS lets owners edit their own profile row, but Postgres column privileges
-- restrict WHICH columns they may write. Verification/tier/go-live columns are
-- writable ONLY by the service role (edge functions / server actions). This
-- stops a creator from self-setting is_live / identity_verified via the API.
-- ============================================================================

-- Agreements acceptance (set server-side when the user accepts).
alter table public.creator_profiles add column if not exists agreements_accepted_at timestamptz;
alter table public.brand_profiles   add column if not exists agreements_accepted_at timestamptz;

-- creator_profiles: creators may write ONLY these columns -----------------------
revoke insert, update on public.creator_profiles from anon, authenticated;
grant insert (id, handle, display_name, bio, niches, location, starting_rate_naira, completeness)
  on public.creator_profiles to authenticated;
grant update (handle, display_name, bio, niches, location, starting_rate_naira, completeness)
  on public.creator_profiles to authenticated;
-- (service_role keeps full access and writes: identity_verified, bank_verified,
--  verification_status, tier, is_live, featured, earned_reputation, head_start_*,
--  entry_placement_score, opportunity_eligible, agreements_accepted_at)

-- brand_profiles: brands may write ONLY these columns ---------------------------
revoke insert, update on public.brand_profiles from anon, authenticated;
grant insert (id, company_name, website, store_url, logo_url) on public.brand_profiles to authenticated;
grant update (company_name, website, store_url, logo_url) on public.brand_profiles to authenticated;
-- (verification_status, trust_tier, agreements_accepted_at → service role only)

-- verifications: users may REQUEST a verification, never self-approve -----------
revoke insert, update on public.verifications from anon, authenticated;
grant insert (user_id, kind, provider, reference) on public.verifications to authenticated;
-- status defaults 'pending'; only the service role may update it.
