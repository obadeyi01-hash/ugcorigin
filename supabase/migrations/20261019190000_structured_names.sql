-- ============================================================================
-- UGCOrigin, structured names + privacy.
-- Creators enter a real first/last (middle optional). Publicly we show only
-- "First L." (first name + last initial); the full name is revealed to a brand
-- once a funded contract exists between them (same trust gate as contact-sharing
-- and social unlock). Brands store a contact first/last the creator sees only
-- after a contract too.
-- ============================================================================

alter table public.creator_profiles add column if not exists first_name  text;
alter table public.creator_profiles add column if not exists middle_name text;
alter table public.creator_profiles add column if not exists last_name   text;

alter table public.brand_profiles add column if not exists contact_first_name text;
alter table public.brand_profiles add column if not exists contact_last_name  text;
