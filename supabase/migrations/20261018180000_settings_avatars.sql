-- ============================================================================
-- UGCOrigin, account settings: avatars, brand logos, notification prefs
-- Adds creator avatar_url (owner-writable), a public `avatars` storage bucket
-- with per-user folder RLS, and a user_settings table for notification prefs.
-- ============================================================================

-- Creator avatar (owner may write it, like other profile fields) ---------------
alter table public.creator_profiles add column if not exists avatar_url text;
grant update (avatar_url) on public.creator_profiles to authenticated;

-- Notification preferences (role-agnostic, one row per user) -------------------
create table if not exists public.user_settings (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  notify_offers   boolean not null default true,  -- offers, applications, gig updates
  notify_payouts  boolean not null default true,  -- escrow release, payouts
  notify_reviews  boolean not null default true,  -- new reviews, disputes
  notify_product  boolean not null default false, -- product news / tips (marketing)
  updated_at      timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "own settings select" on public.user_settings;
create policy "own settings select" on public.user_settings
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "own settings insert" on public.user_settings;
create policy "own settings insert" on public.user_settings
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "own settings update" on public.user_settings;
create policy "own settings update" on public.user_settings
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on public.user_settings to authenticated;

-- Public avatars / brand logos bucket -----------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can read (public bucket); users may write only inside their own folder
-- `avatars/<uid>/...` so no one can overwrite another user's image.
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'avatars');

drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
