-- ============================================================================
-- UGCOrigin, creator identity lifecycle (manual KYC).
--
-- Adds the pieces the manual identity flow needs while there is no automated
-- KYC provider:
--   * phone uniqueness across creators (no two creators share a number)
--   * a selfie + NIN submission, stored OUTSIDE creator_profiles
--   * a photo_verified gate column that go-live checks
--
-- WHY A SEPARATE TABLE FOR NIN/SELFIE: the creator_select RLS policy makes any
-- LIVE creator's creator_profiles row world-readable (is_live = true lets anon
-- SELECT the whole row; column grants only restrict writes, not SELECT). So the
-- NIN cannot live on creator_profiles without leaking publicly. identity_submissions
-- has RLS enabled with NO anon/authenticated policy or grant: it is reachable
-- only through the service role (createAdminClient), which bypasses RLS. The
-- owner never reads their own NIN back; they only see a status flag on their
-- profile. Reviewers read it via the admin client.
-- ============================================================================

-- 1. Phone uniqueness ---------------------------------------------------------
-- Creator-scoped only (not cross-table with brand_profiles): a dual brand+creator
-- account legitimately reuses one personal number. Partial index: many NULLs ok.
create unique index if not exists creator_profiles_phone_key
  on public.creator_profiles (phone)
  where phone is not null;

-- 2. Photo-verified gate (service-role only; set when a reviewer approves) -----
alter table public.creator_profiles
  add column if not exists photo_verified boolean not null default false;

-- 3. Identity submissions (sensitive: NIN + selfie) ---------------------------
create table if not exists public.identity_submissions (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  nin           text,                                 -- National ID Number (sensitive)
  selfie_ref    text,                                 -- Cloudinary authenticated ref ("cld:...")
  phone         text,                                 -- snapshot of phone at submission
  status        text not null default 'pending',      -- pending | approved | rejected
  reject_reason text,
  submitted_at  timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewer_id   uuid references auth.users(id)
);

-- One NIN belongs to at most one user.
create unique index if not exists identity_submissions_nin_key
  on public.identity_submissions (nin)
  where nin is not null;

create index if not exists identity_submissions_status_idx
  on public.identity_submissions (status, submitted_at);

alter table public.identity_submissions enable row level security;

-- Intentionally NO policies for anon/authenticated. The table is reachable only
-- via the service role, which bypasses RLS. Revoke any inherited table
-- privileges from the API roles so the column data can never be read client-side.
revoke all on public.identity_submissions from anon, authenticated;
