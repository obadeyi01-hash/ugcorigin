-- UGCOrigin — money-loop idempotency guards.
--
-- The Paystack webhook creates exactly one gig per funded offer, and the
-- approve→release path creates exactly one payout per gig. Both currently rely
-- on an app-level "does it already exist?" check, which has a time-of-check /
-- time-of-use race if two webhook deliveries (or two approvals) land at once.
-- These partial unique indexes make the guarantee hold at the database, so a
-- concurrent duplicate fails the insert instead of creating a second gig/payout.

-- One gig per offer (offer_id is nullable for brief-sourced gigs).
create unique index if not exists gigs_offer_id_unique
  on public.gigs (offer_id)
  where offer_id is not null;

-- One payout per gig (gig_id is nullable for per-view campaign payouts).
create unique index if not exists payouts_gig_id_unique
  on public.payouts (gig_id)
  where gig_id is not null;
