-- ============================================================================
-- UGCOrigin, in-app messaging (brand <-> creator)
-- 1:1 conversations with text + attachments. Messages are inserted via a server
-- action (service role) so contact-detail redaction is enforced before storage;
-- participants and admins can READ. Admins can read everything (oversight).
-- ============================================================================

create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references auth.users(id) on delete cascade,
  creator_id      uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (brand_id, creator_id)
);
create index conversations_brand_idx   on public.conversations (brand_id, last_message_at desc);
create index conversations_creator_idx on public.conversations (creator_id, last_message_at desc);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references auth.users(id) on delete cascade,
  body            text not null default '',
  attachment_url  text,
  attachment_name text,
  flagged         boolean not null default false,   -- contact info was redacted
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index messages_conv_idx on public.messages (conversation_id, created_at);

-- Helper: is the current user a participant of this conversation? (SECURITY
-- DEFINER avoids RLS recursion.)
create or replace function public.is_conversation_participant(conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conv and (c.brand_id = auth.uid() or c.creator_id = auth.uid())
  );
$$;

-- Helper: do these two users already have a funded/active contract? (Governs
-- whether contact details may be shared in chat.)
create or replace function public.has_active_contract(b uuid, c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.gigs g
    where g.brand_id = b and g.creator_id = c
      and g.status in ('funded','in_progress','in_review','revision','approved','released','completed')
  );
$$;

alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

-- Conversations: participants + admins read; participants create their own.
create policy conversations_select on public.conversations for select to authenticated
  using (brand_id = auth.uid() or creator_id = auth.uid() or public.is_admin());
create policy conversations_insert on public.conversations for insert to authenticated
  with check (brand_id = auth.uid() or creator_id = auth.uid());

-- Messages: participants + admins read. INSERT is service-role only (the send
-- action redacts contact info first), so no authenticated insert policy.
create policy messages_select on public.messages for select to authenticated
  using (public.is_conversation_participant(conversation_id) or public.is_admin());

grant select on public.conversations to authenticated;
grant insert on public.conversations to authenticated;
grant select on public.messages to authenticated;

-- Realtime for live chat.
alter publication supabase_realtime add table public.messages;

-- Private attachments bucket; participants may read/write inside their own
-- conversation folder (chat/<conversation_id>/...).
insert into storage.buckets (id, name, public) values ('chat', 'chat', false)
on conflict (id) do nothing;

drop policy if exists "chat read" on storage.objects;
create policy "chat read" on storage.objects for select to authenticated
  using (bucket_id = 'chat' and public.is_conversation_participant(((storage.foldername(name))[1])::uuid));

drop policy if exists "chat write" on storage.objects;
create policy "chat write" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat' and public.is_conversation_participant(((storage.foldername(name))[1])::uuid));
