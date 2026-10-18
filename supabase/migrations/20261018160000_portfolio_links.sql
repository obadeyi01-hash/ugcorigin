-- ============================================================================
-- UGCOrigin, portfolio links: creators link specific posts (X/IG/TikTok/YouTube)
-- that render as live embeds on their profile.
-- ============================================================================
create table public.portfolio_links (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references public.creator_profiles(id) on delete cascade,
  platform    social_platform not null,  -- instagram | tiktok | youtube | twitch | x
  url         text not null,
  position    smallint not null default 0,
  created_at  timestamptz not null default now()
);
create index on public.portfolio_links (creator_id, position);

alter table public.portfolio_links enable row level security;

create policy portfolio_select on public.portfolio_links for select to anon, authenticated
  using (public.creator_is_live(creator_id) or creator_id = auth.uid() or public.is_admin());

create policy portfolio_write on public.portfolio_links for all to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());
