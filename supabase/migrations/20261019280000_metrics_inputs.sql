-- ============================================================================
-- UGCOrigin, inputs for richer metrics + auto-moderation.
--   - gigs.deadline      : the agreed delivery date (from the offer), so we can
--                          compute an on-time rate.
--   - creator_profiles.contact_flags : count of pre-contract contact-sharing
--                          attempts, used to auto-warn / auto-strike.
-- ============================================================================

alter table public.gigs add column if not exists deadline date;

alter table public.creator_profiles add column if not exists contact_flags smallint not null default 0;

-- Backfill gig deadlines from their originating offers.
update public.gigs g
set deadline = o.deadline
from public.offers o
where g.offer_id = o.id and g.deadline is null and o.deadline is not null;
