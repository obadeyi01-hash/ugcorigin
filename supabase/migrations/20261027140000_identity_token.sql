-- The identity token is a Virtual NIN, not the raw 11-digit NIN.
-- Plaintext stays only while a review is open. After review it is deleted
-- and the hash remains so the same code cannot be reused.

alter table public.identity_submissions
  add column if not exists nin_hash text,
  add column if not exists nin_consent_at timestamptz;

create unique index if not exists identity_submissions_nin_hash_key
  on public.identity_submissions (nin_hash)
  where nin_hash is not null;

comment on column public.identity_submissions.nin is
  'Plaintext Virtual NIN. Present only while status is pending. Cleared after review.';
comment on column public.identity_submissions.nin_hash is
  'HMAC of the token. Kept after the plaintext is deleted.';
