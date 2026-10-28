-- Cached audience size for a creator's attached social profile.
-- The creator can attach the account. Only the service role writes the count.

alter table public.social_accounts
  add column if not exists follower_count integer,
  add column if not exists followers_checked_at timestamptz;

alter type public.social_platform add value if not exists 'facebook';

revoke insert (follower_count, followers_checked_at) on public.social_accounts from anon, authenticated;
revoke update (follower_count, followers_checked_at) on public.social_accounts from anon, authenticated;
