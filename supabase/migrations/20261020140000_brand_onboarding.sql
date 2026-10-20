-- ============================================================================
-- UGCOrigin, richer brand onboarding profile.
-- What the brand is trying to do, where their ads run, what content they need,
-- their business type, the person's role and team size. All editable later in
-- settings, and used to seed dashboard creator recommendations.
-- ============================================================================

alter table public.brand_profiles add column if not exists goal          text;        -- ugc | sponsored | affiliate | local_events | other
alter table public.brand_profiles add column if not exists ad_platforms  text[] not null default '{}'; -- meta | tiktok | youtube | google
alter table public.brand_profiles add column if not exists content_types text[] not null default '{}'; -- video | photo
alter table public.brand_profiles add column if not exists business_type text;        -- ecommerce | app | creator | local | other
alter table public.brand_profiles add column if not exists contact_role  text;        -- founder | marketing | agency | other
alter table public.brand_profiles add column if not exists team_size     text;        -- solo | 2-10 | 11-50 | 50+
