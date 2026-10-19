-- ============================================================================
-- UGCOrigin, verified portfolio works.
-- A creator's showcase videos live in profile_videos. We now distinguish:
--   - off-platform showcase clips the creator uploads freely (capped in-app)
--   - VERIFIED works tied to a real completed gig on UGCOrigin (uncapped, and
--     badged "Verified on UGCOrigin"). These carry the most weight for trust.
-- A short caption (rich-ish text) can describe each piece.
-- ============================================================================

alter table public.profile_videos add column if not exists verified boolean not null default false;
alter table public.profile_videos add column if not exists gig_id   uuid references public.gigs(id) on delete set null;
alter table public.profile_videos add column if not exists caption  text;

comment on column public.profile_videos.verified is
  'True when this showcase piece is tied to a completed on-platform gig.';

-- One verified entry per gig.
create unique index if not exists profile_videos_gig_unique
  on public.profile_videos (gig_id) where gig_id is not null;
