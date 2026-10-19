-- ============================================================================
-- UGCOrigin, AI / false-media review queue.
-- When a creator posts media (showcase/verified work, avatar), we score it for
-- AI-generation likelihood through a pluggable provider and queue anything
-- suspicious for Trust & Safety to review. The provider is optional: with none
-- configured, items are queued with a null score for manual review only.
-- ============================================================================

create type media_review_status as enum ('pending', 'cleared', 'flagged', 'actioned');

create table public.media_reviews (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references public.creator_profiles(id) on delete cascade,
  media_url   text not null,
  kind        text not null default 'video',   -- video | image | avatar
  ai_score    smallint,                          -- 0..100 likelihood, null if unscored
  status      media_review_status not null default 'pending',
  note        text,
  created_at  timestamptz not null default now()
);
create index media_reviews_status_idx on public.media_reviews (status, created_at desc);

alter table public.media_reviews enable row level security;
-- Staff-only (service role / admin). No anon or self access.
create policy media_reviews_admin on public.media_reviews for select to authenticated
  using (public.is_admin());
grant select on public.media_reviews to authenticated;
