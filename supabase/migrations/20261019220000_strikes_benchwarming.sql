-- ============================================================================
-- UGCOrigin, strikes + benchwarming.
-- Creators accrue strikes for breaking trust: ghosting after agreeing, pulling
-- delivered work, taking deals off-platform, repeated contact-sharing before a
-- contract. Strikes lower search ranking; a benched creator is pushed to the
-- very bottom until they recover. Issued by Trust & Safety (admin), with room
-- for automated triggers later.
-- ============================================================================

alter table public.creator_profiles add column if not exists strikes    smallint not null default 0;
alter table public.creator_profiles add column if not exists benched    boolean  not null default false;
alter table public.creator_profiles add column if not exists strike_note text;

comment on column public.creator_profiles.strikes is
  'Trust strikes; each lowers search ranking. 3+ typically benches the creator.';

create index if not exists creator_profiles_benched_idx
  on public.creator_profiles (benched) where benched;
