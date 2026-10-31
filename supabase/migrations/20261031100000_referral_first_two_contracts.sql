-- Referral economy: pay the inviter for an invited creator's FIRST TWO funded
-- contracts, not just the first.
--
-- Previously `referred_id` was UNIQUE, so only one reward could ever exist per
-- invited creator. Drop that, and instead make a reward idempotent per
-- (invited creator, gig) so the same contract is never double-paid. The
-- "at most two" cap is enforced in application code (lib/referrals/award.ts),
-- which counts existing rewards before creating a new one.
--
-- Additive and idempotent. Existing single-reward rows stay valid and still
-- count toward the new cap.

alter table public.referral_rewards
  drop constraint if exists referral_rewards_referred_id_key;

create unique index if not exists referral_rewards_referred_gig_key
  on public.referral_rewards (referred_id, gig_id);
