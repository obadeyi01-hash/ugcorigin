-- ============================================================================
-- UGCOrigin, directory/search performance indexes.
-- The directory filters on is_live + niches + rate + location/text, then ranks
-- the candidate set in app code. These indexes keep the filtering query fast.
-- ============================================================================

-- Niche (category) membership filter: niches @> array[...]
create index if not exists creator_profiles_niches_gin
  on public.creator_profiles using gin (niches);

-- Live + budget range, and live + default reputation ordering.
create index if not exists creator_profiles_live_rate
  on public.creator_profiles (is_live, starting_rate_naira);
create index if not exists creator_profiles_live_ers
  on public.creator_profiles (is_live, earned_reputation desc);

-- Trigram indexes for fast case-insensitive name/location search (ilike %...%).
create extension if not exists pg_trgm;
create index if not exists creator_profiles_name_trgm
  on public.creator_profiles using gin (display_name gin_trgm_ops);
create index if not exists creator_profiles_location_trgm
  on public.creator_profiles using gin (location gin_trgm_ops);

-- Platform filter joins social_accounts by platform.
create index if not exists social_accounts_platform_idx
  on public.social_accounts (platform, creator_id);
