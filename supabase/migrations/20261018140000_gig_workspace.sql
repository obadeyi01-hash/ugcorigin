-- ============================================================================
-- UGCOrigin, gig workspace storage + payout details
-- ============================================================================

-- Private bucket for creator deliverables (drafts/finals). Access is via
-- service-role-generated signed URLs only (the server authorizes per gig), so
-- no storage.objects RLS policies are needed for the signed-URL flow.
insert into storage.buckets (id, name, public)
values ('deliverables', 'deliverables', false)
on conflict (id) do nothing;

-- Creator payout details (service-role only, not in the authenticated column
-- grants, so creators cannot write these). Populated during bank verification.
alter table public.creator_profiles
  add column if not exists payout_bank_code       text,
  add column if not exists payout_account_number  text,
  add column if not exists payout_recipient_code  text;
