-- ============================================================================
-- UGCOrigin, meetings & focus groups.
-- The two parties on a gig can schedule a call (or a focus-group session) with a
-- time + video link. One side proposes, the other confirms. Visible only to the
-- gig's participants.
-- ============================================================================

create type meeting_kind   as enum ('call', 'focus_group');
create type meeting_status as enum ('proposed', 'confirmed', 'declined', 'cancelled');

create table public.meetings (
  id           uuid primary key default gen_random_uuid(),
  gig_id       uuid not null references public.gigs(id) on delete cascade,
  proposed_by  uuid not null references auth.users(id) on delete cascade,
  kind         meeting_kind not null default 'call',
  title        text not null,
  scheduled_at timestamptz not null,
  link         text,
  notes        text,
  status       meeting_status not null default 'proposed',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index meetings_gig_idx on public.meetings (gig_id, scheduled_at);

create trigger trg_meetings_updated before update on public.meetings
  for each row execute function public.set_updated_at();

-- Participant check (SECURITY DEFINER avoids RLS recursion through gigs).
create or replace function public.is_gig_participant(g uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.gigs
    where id = g and (brand_id = auth.uid() or creator_id = auth.uid())
  );
$$;

alter table public.meetings enable row level security;

create policy meetings_select on public.meetings for select to authenticated
  using (public.is_gig_participant(gig_id) or public.is_admin());

grant select on public.meetings to authenticated;
