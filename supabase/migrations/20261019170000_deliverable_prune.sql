-- ============================================================================
-- UGCOrigin, deliverable storage cleanup.
-- Deliverables live on Cloudinary. Once a gig is finished (plus a grace window),
-- superseded draft versions and deliverables of cancelled/declined gigs are dead
-- weight — a scheduled job deletes those from Cloudinary and sets `pruned`. The
-- final approved deliverable of a completed gig is always kept.
-- ============================================================================

alter table public.deliverables
  add column if not exists pruned boolean not null default false;

comment on column public.deliverables.pruned is
  'True once the Cloudinary asset has been deleted by the cleanup job.';

create index if not exists deliverables_prune_idx
  on public.deliverables (pruned) where not pruned;
