-- ============================================================================
-- UGCOrigin — dual-control on large escrow releases & refunds.
--
-- Escrow release/refund move real money via Paystack. For amounts at or above a
-- configurable threshold (env ADMIN_DUAL_CONTROL_THRESHOLD_NAIRA, default
-- ₦100,000) a single admin may no longer move the money alone: the first admin
-- files a request here, and a SECOND, DISTINCT finance/super_admin must approve
-- before the transfer executes. Below the threshold the one-step path is kept.
--
-- This table is the request ledger. Like audit_log it is ADMIN-READ (finance
-- page) and SERVICE-ROLE-WRITE only: the app writes it exclusively through the
-- service-role admin client (createAdminClient), which bypasses RLS. There is no
-- authenticated write policy, so an admin can never self-insert/approve from the
-- client. The full who/requested/approved/executed trail is also mirrored into
-- audit_log by the server actions.
-- ============================================================================

create table if not exists public.release_approvals (
  id            uuid primary key default gen_random_uuid(),
  gig_id        uuid not null references public.gigs(id) on delete cascade,
  kind          text not null check (kind in ('release', 'refund')),
  amount_naira  integer not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected', 'executed')),
  requested_by  uuid references auth.users(id) on delete set null,  -- initiating admin
  approved_by   uuid references auth.users(id) on delete set null,  -- the 2nd admin who decided
  note          text,                                                -- optional reject reason
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,                                         -- approved/rejected at
  executed_at   timestamptz                                          -- money actually moved at
);

-- At most one OPEN request per gig+kind — a second "Release" click while one is
-- already pending fails the insert instead of stacking duplicate requests.
create unique index if not exists release_approvals_one_pending
  on public.release_approvals (gig_id, kind)
  where status = 'pending';

-- Fast "pending approvals" lookup + recent-activity ordering.
create index if not exists release_approvals_status_idx
  on public.release_approvals (status, created_at desc);

alter table public.release_approvals enable row level security;

-- Admin-read: finance/super_admin view the queue on /admin/finance. Writes have
-- NO policy, so only the service role (which bypasses RLS) can create/decide
-- them — mirrors the audit_log model.
create policy release_approvals_select on public.release_approvals
  for select to authenticated
  using (public.is_admin());
