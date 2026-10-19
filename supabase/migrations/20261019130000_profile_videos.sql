-- ============================================================================
-- UGCOrigin, creator profile showcase videos (stored on Cloudinary).
-- We keep the Cloudinary public_id + optimized delivery URL + poster here.
-- A small number per creator (app enforces the cap); heavy transcoding and
-- adaptive delivery live on Cloudinary, images stay on Supabase + next/image.
-- ============================================================================

create table public.profile_videos (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references public.creator_profiles(id) on delete cascade,
  public_id   text not null,
  url         text not null,
  poster_url  text,
  position    smallint not null default 0,
  created_at  timestamptz not null default now()
);
create index profile_videos_creator_idx on public.profile_videos (creator_id, position);

alter table public.profile_videos enable row level security;

-- Public can view a live creator's videos; owner + admin always.
create policy profile_videos_select on public.profile_videos for select to anon, authenticated
  using (public.creator_is_live(creator_id) or creator_id = auth.uid() or public.is_admin());
create policy profile_videos_insert on public.profile_videos for insert to authenticated
  with check (creator_id = auth.uid());
create policy profile_videos_delete on public.profile_videos for delete to authenticated
  using (creator_id = auth.uid() or public.is_admin());

grant select on public.profile_videos to anon, authenticated;
grant insert, delete on public.profile_videos to authenticated;
