-- ============================================================================
-- UGCOrigin, content formats a creator offers.
-- Beyond on-camera video, creators can offer voice-over, text/scripts and
-- photo. Stored as a small text[] so brands can see (and later filter by) what
-- a creator does.
-- ============================================================================

alter table public.creator_profiles add column if not exists content_formats text[] not null default '{}';

comment on column public.creator_profiles.content_formats is
  'What the creator offers: video | voiceover | text | photo.';
