-- Notes sent to a creator or brand (placement, verification rejection).
-- Service role only. Admins read them from the user dossier.

create table if not exists public.profile_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('placement', 'identity_rejection', 'brand_rejection')),
  subject text not null,
  body text not null,
  actor_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists profile_notes_user_created_idx
  on public.profile_notes (user_id, created_at desc);

alter table public.profile_notes enable row level security;
revoke all on public.profile_notes from anon, authenticated;
