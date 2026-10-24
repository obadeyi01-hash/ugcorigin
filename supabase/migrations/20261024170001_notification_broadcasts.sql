-- ============================================================================
-- UGCOrigin — admin broadcast metadata on notifications.
-- Admins can compose a notification + optional email to a targeted audience
-- (a user, all users, all brands/creators, or a filtered class). Tag those
-- rows with a `source` so broadcast sends are distinguishable from the
-- transactional notifications the app creates on its own (offers, payouts…).
-- The full who/what/audience/count trail lives in audit_log; this is just a
-- lightweight marker for grouping and support.
-- ============================================================================

alter table public.notifications add column if not exists source text;

-- Fast lookup of broadcast rows (e.g. "notifications from admin announcements").
create index if not exists notifications_source_idx
  on public.notifications (source) where source is not null;
