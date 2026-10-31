-- Passive fraud / integrity signals captured at key account events (signup,
-- verification) and on first sight of an existing account. IP + approximate
-- geolocation (from the edge, no browser prompt) + device string. Admin-only.
--
-- This is the data layer for tying a signup to a place and device so patterns
-- (many brands from one IP, a mismatch against the stated business location)
-- are visible to reviewers. It does NOT by itself verify a company to a person;
-- that is the KYB layer (registered address, director identity, CAC lookup).

create table if not exists public.account_signals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  event       text not null,
  ip          text,
  country     text,
  region      text,
  city        text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists account_signals_user_created_idx
  on public.account_signals (user_id, created_at desc);

-- Signals are sensitive and reviewer-only: written by the service role, read in
-- the admin console (service role). No direct anon/authenticated access.
alter table public.account_signals enable row level security;
revoke all on public.account_signals from anon, authenticated;
