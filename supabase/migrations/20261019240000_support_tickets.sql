-- ============================================================================
-- UGCOrigin, support tickets.
-- Signed-in users raise tickets; Trust & Safety / Support staff respond and
-- close them. One reply field keeps it simple for now (threaded replies later).
-- ============================================================================

create type support_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type support_category as enum ('account', 'payment', 'gig', 'trust_safety', 'bug', 'other');

create table public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    support_category not null default 'other',
  subject     text not null,
  body        text not null,
  status      support_status not null default 'open',
  response    text,
  responded_by uuid references auth.users(id) on delete set null,
  responded_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index support_tickets_user_idx   on public.support_tickets (user_id, created_at desc);
create index support_tickets_status_idx on public.support_tickets (status, created_at desc);

create trigger trg_support_updated before update on public.support_tickets
  for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;

-- Owner can read + create their own tickets; admins read all (via service role).
create policy support_select_own on public.support_tickets for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy support_insert_own on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid());

grant select, insert on public.support_tickets to authenticated;
