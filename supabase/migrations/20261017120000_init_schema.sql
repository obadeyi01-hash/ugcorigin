-- ============================================================================
-- UGCOrigin, initial schema
-- Two-sided UGC marketplace: identity, creator/brand profiles, briefs/offers,
-- gigs, deliverables, escrow ledger, reviews, jolts, verification, admin RBAC.
-- Money-moving tables are written by service-role / edge functions only (RLS in
-- the companion rls migration denies direct writes from anon/authenticated).
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "citext";         -- case-insensitive handles/emails

-- Enums ----------------------------------------------------------------------
create type verification_status as enum ('unverified','pending','verified','rejected');
create type creator_tier        as enum ('origin','rising','pro','elite','signature');
create type social_platform     as enum ('instagram','tiktok','youtube','twitch','x');
create type package_type        as enum ('gifted','paid');
create type brief_status        as enum ('draft','open','closed','filled');
create type gig_type            as enum ('original','affiliate','other');
create type application_status  as enum ('applied','shortlisted','selected','rejected','withdrawn');
create type offer_status        as enum ('pending','accepted','declined','countered','expired','withdrawn');
create type gig_status          as enum (
  'pending_acceptance','funded','in_progress','in_review','revision',
  'approved','released','completed','disputed','cancelled','declined'
);
create type deliverable_status  as enum ('submitted','approved','revision_requested');
create type ledger_entry_type   as enum ('escrow_in','hold','fee','release','payout','refund','credit');
create type payout_status       as enum ('pending','processing','paid','failed');
create type dispute_status      as enum ('open','under_review','resolved_release','resolved_refund','resolved_partial');
create type review_role         as enum ('brand','creator');

-- Helpers --------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- Identity -------------------------------------------------------------------
-- 1:1 with auth.users. Shared account fields.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       citext,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile row automatically on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin RBAC -----------------------------------------------------------------
create table public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'support',   -- super_admin | finance | trust_safety | support | growth | analyst
  permissions text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin(min_role text default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid());
$$;

-- Creator side ---------------------------------------------------------------
create table public.creator_profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  handle              citext unique,
  display_name        text,
  bio                 text,
  niches              text[] not null default '{}',
  location            text,
  starting_rate_naira integer,
  completeness        smallint not null default 0,   -- 0..100
  identity_verified   boolean not null default false,
  bank_verified       boolean not null default false,
  verification_status verification_status not null default 'unverified',
  tier                creator_tier not null default 'origin',
  is_live             boolean not null default false, -- discoverable only when gate passed
  featured            boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on public.creator_profiles using gin (niches);
create index on public.creator_profiles (is_live);
create trigger trg_creator_updated before update on public.creator_profiles
  for each row execute function public.set_updated_at();

create table public.social_accounts (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references public.creator_profiles(id) on delete cascade,
  platform    social_platform not null,
  handle      text not null,
  url         text,
  verified    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (creator_id, platform)
);

create table public.packages (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references public.creator_profiles(id) on delete cascade,
  title         text not null,
  type          package_type not null default 'paid',
  format        text,
  price_naira   integer not null default 0,
  revisions     smallint not null default 1,
  usage_rights  text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on public.packages (creator_id);

-- Brand side -----------------------------------------------------------------
create table public.brand_profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  company_name        text,
  website             text,
  store_url           text,
  logo_url            text,
  verification_status verification_status not null default 'unverified',
  trust_tier          text not null default 'new',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_brand_updated before update on public.brand_profiles
  for each row execute function public.set_updated_at();

create table public.saved_creators (
  brand_id    uuid not null references public.brand_profiles(id) on delete cascade,
  creator_id  uuid not null references public.creator_profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (brand_id, creator_id)
);

-- Marketplace & work ---------------------------------------------------------
create table public.briefs (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references public.brand_profiles(id) on delete cascade,
  title         text not null,
  description   text,
  format        text,
  niches        text[] not null default '{}',
  budget_naira  integer,
  deadline      date,
  slots         smallint not null default 1,   -- "Need N"
  gig_type      gig_type not null default 'original',
  status        brief_status not null default 'open',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.briefs (status);
create trigger trg_briefs_updated before update on public.briefs
  for each row execute function public.set_updated_at();

create table public.applications (
  id          uuid primary key default gen_random_uuid(),
  brief_id    uuid not null references public.briefs(id) on delete cascade,
  creator_id  uuid not null references public.creator_profiles(id) on delete cascade,
  pitch       text,
  sample_url  text,
  status      application_status not null default 'applied',
  created_at  timestamptz not null default now(),
  unique (brief_id, creator_id)
);

create table public.offers (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references public.brand_profiles(id) on delete cascade,
  creator_id    uuid not null references public.creator_profiles(id) on delete cascade,
  title         text not null,
  brief         text,
  price_naira   integer not null,
  deadline      date,
  status        offer_status not null default 'pending',
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_offers_updated before update on public.offers
  for each row execute function public.set_updated_at();

create table public.gigs (
  id                 uuid primary key default gen_random_uuid(),
  brand_id           uuid not null references public.brand_profiles(id) on delete restrict,
  creator_id         uuid not null references public.creator_profiles(id) on delete restrict,
  brief_id           uuid references public.briefs(id) on delete set null,
  offer_id           uuid references public.offers(id) on delete set null,
  title              text not null,
  price_naira        integer not null,
  fee_naira          integer not null default 0,
  gig_type           gig_type not null default 'original',
  status             gig_status not null default 'pending_acceptance',
  review_window_days smallint not null default 7,
  review_due_at      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on public.gigs (brand_id);
create index on public.gigs (creator_id);
create index on public.gigs (status);
create trigger trg_gigs_updated before update on public.gigs
  for each row execute function public.set_updated_at();

create table public.deliverables (
  id          uuid primary key default gen_random_uuid(),
  gig_id      uuid not null references public.gigs(id) on delete cascade,
  version     smallint not null default 1,
  file_url    text,
  watermarked boolean not null default true,
  status      deliverable_status not null default 'submitted',
  note        text,
  created_at  timestamptz not null default now()
);
create index on public.deliverables (gig_id);

create table public.deliverable_comments (
  id              uuid primary key default gen_random_uuid(),
  deliverable_id  uuid not null references public.deliverables(id) on delete cascade,
  author_id       uuid not null references auth.users(id) on delete cascade,
  timecode_secs   numeric(8,2),       -- time-stamped video feedback
  body            text not null,
  created_at      timestamptz not null default now()
);
create index on public.deliverable_comments (deliverable_id);

-- Money ----------------------------------------------------------------------
create table public.escrow_transactions (
  id            uuid primary key default gen_random_uuid(),
  gig_id        uuid not null unique references public.gigs(id) on delete restrict,
  provider      text not null default 'paystack',
  provider_ref  text,
  amount_naira  integer not null,
  fee_naira     integer not null default 0,
  status        text not null default 'pending',  -- pending | held | released | refunded
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_escrow_updated before update on public.escrow_transactions
  for each row execute function public.set_updated_at();

-- Immutable double-entry ledger. No update/delete policies (see rls migration).
create table public.ledger_entries (
  id          uuid primary key default gen_random_uuid(),
  gig_id      uuid references public.gigs(id) on delete restrict,
  escrow_id   uuid references public.escrow_transactions(id) on delete restrict,
  user_id     uuid references auth.users(id) on delete set null,
  entry_type  ledger_entry_type not null,
  amount_naira integer not null,
  memo        text,
  created_at  timestamptz not null default now()
);
create index on public.ledger_entries (gig_id);

create table public.payouts (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references public.creator_profiles(id) on delete restrict,
  gig_id        uuid references public.gigs(id) on delete set null,
  provider      text not null default 'paystack',
  provider_ref  text,
  amount_naira  integer not null,
  status        payout_status not null default 'pending',
  retries       smallint not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_payouts_updated before update on public.payouts
  for each row execute function public.set_updated_at();

create table public.disputes (
  id            uuid primary key default gen_random_uuid(),
  gig_id        uuid not null unique references public.gigs(id) on delete cascade,
  opened_by     uuid not null references auth.users(id) on delete set null,
  reason        text,
  status        dispute_status not null default 'open',
  resolution    text,
  resolved_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_disputes_updated before update on public.disputes
  for each row execute function public.set_updated_at();

-- Trust & engagement ---------------------------------------------------------
-- Reviews only exist for completed gigs (enforced in app/edge layer). Two-way.
create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  gig_id         uuid not null references public.gigs(id) on delete cascade,
  author_id      uuid not null references auth.users(id) on delete cascade,
  subject_id     uuid not null references auth.users(id) on delete cascade,
  role           review_role not null,  -- who is being reviewed's counterpart role
  rating_speed   smallint check (rating_speed between 1 and 5),
  rating_comms   smallint check (rating_comms between 1 and 5),
  rating_quality smallint check (rating_quality between 1 and 5),
  body           text,
  created_at     timestamptz not null default now(),
  unique (gig_id, role)
);
create index on public.reviews (subject_id);

create table public.verifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null,   -- identity | bank | business
  provider    text,            -- smileid | dojah | paystack
  status      verification_status not null default 'pending',
  reference   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.verifications (user_id);
create trigger trg_verifications_updated before update on public.verifications
  for each row execute function public.set_updated_at();

create table public.jolts (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references public.creator_profiles(id) on delete cascade,
  body        text not null,
  media_url   text,
  created_at  timestamptz not null default now()
);
create index on public.jolts (creator_id, created_at desc);

create table public.jolt_reactions (
  jolt_id     uuid not null references public.jolts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (jolt_id, user_id)
);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  title       text,
  body        text,
  href        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.notifications (user_id, read);

create table public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references auth.users(id) on delete set null,
  action       text not null,
  target_type  text,
  target_id    uuid,
  before       jsonb,
  after        jsonb,
  created_at   timestamptz not null default now()
);
create index on public.audit_log (target_type, target_id);
