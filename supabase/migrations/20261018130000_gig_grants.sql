-- ============================================================================
-- UGCOrigin, gigs are money-bound: created/updated by the service role only.
-- A gig is created when escrow is funded (Paystack webhook) and transitions
-- through the workspace via server actions. Users never write gigs directly.
-- (escrow_transactions / ledger_entries / payouts already have no user write
--  policies, so they are service-role-only.)
-- ============================================================================
revoke insert, update, delete on public.gigs from anon, authenticated;
-- SELECT stays (RLS gigs_select lets participants + admins read).
