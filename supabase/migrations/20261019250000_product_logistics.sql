-- ============================================================================
-- UGCOrigin, physical-product gigs + logistics.
-- Some UGC needs the real product in the creator's hands. An offer can flag
-- that; the resulting gig then tracks the creator's shipping address and a
-- simple status (brand ships via a local courier — Chowdeck, Glovo, inDrive,
-- Bolt). Address is only visible between the two parties (RLS already scopes
-- gigs to participants).
-- ============================================================================

alter table public.offers add column if not exists needs_product boolean not null default false;

alter table public.gigs add column if not exists needs_product    boolean not null default false;
alter table public.gigs add column if not exists shipping_address text;
-- awaiting_address | address_set | sent | received
alter table public.gigs add column if not exists shipping_status  text;

comment on column public.gigs.shipping_status is
  'Physical-product handoff: awaiting_address | address_set | sent | received.';
