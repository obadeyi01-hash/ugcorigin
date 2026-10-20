-- ============================================================================
-- UGCOrigin, on-location / in-store shoots.
-- Some brands need the creator to show up in person (a store, venue, event) to
-- shoot. An offer can flag that with the venue address; the funded gig tracks a
-- simple visit status. Address is only visible to the two gig participants.
-- ============================================================================

alter table public.offers add column if not exists needs_location   boolean not null default false;
alter table public.offers add column if not exists location_address text;

alter table public.gigs add column if not exists needs_location   boolean not null default false;
alter table public.gigs add column if not exists location_address text;
-- scheduled | visited
alter table public.gigs add column if not exists location_status  text;

comment on column public.gigs.location_status is 'In-person shoot: scheduled | visited.';
