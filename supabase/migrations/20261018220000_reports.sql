-- ============================================================================
-- UGCOrigin, content reports (moderation)
-- Any signed-in user can report a profile, review, campaign submission or
-- deliverable. Reports are reviewed and actioned by Trust & Safety / admins.
-- Users insert their own reports; status/resolution are service-role only.
-- ============================================================================

create type report_target_type as enum ('profile', 'review', 'campaign_submission', 'deliverable');
create type report_status      as enum ('open', 'actioned', 'dismissed');

create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references auth.users(id) on delete cascade,
  target_type  report_target_type not null,
  target_id    uuid not null,
  reason       text not null,            -- short category (e.g. "Spam", "Fake/AI", "Abuse")
  details      text,
  status       report_status not null default 'open',
  resolution   text,
  resolved_by  uuid references auth.users(id) on delete set null,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at desc);
create index reports_target_idx on public.reports (target_type, target_id);

alter table public.reports enable row level security;

-- Reporter can file a report as themselves and see their own; admins see all.
revoke insert, update on public.reports from anon, authenticated;
grant insert (reporter_id, target_type, target_id, reason, details) on public.reports to authenticated;

create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
-- status/resolution updates: service role only (admin actions).
