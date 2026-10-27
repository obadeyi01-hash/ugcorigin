import type { TierKey } from "@/lib/tiers";

// Same cutoffs as compute_eps: 0–20 Origin, 21–45 Rising, 46+ Pro.
// Entry never places anyone above Pro.
export function entryTierFromSignals(input: {
  followers?: number;
  priorWork?: number;
  portfolioCount?: number;
  nicheDemand?: number;
  verified?: boolean;
}): { tier: TierKey; score: number } {
  const followers = Math.max(0, input.followers ?? 0);
  const priorWork = Math.max(0, Math.min(100, input.priorWork ?? 0));
  const portfolioCount = Math.max(0, input.portfolioCount ?? 0);
  const nicheDemand = Math.max(0, Math.min(100, input.nicheDemand ?? 0));
  const following = Math.min(25, Math.round(6 * Math.log10(followers + 1)));
  const portfolio = Math.min(25, portfolioCount * 5);
  const prior = Math.min(25, Math.round((priorWork * 25) / 100));
  const niche = Math.min(15, Math.round((nicheDemand * 15) / 100));
  const verified = input.verified === false ? 0 : 10;
  const score = Math.min(100, following + portfolio + prior + niche + verified);
  const tier: TierKey = score <= 20 ? "origin" : score <= 45 ? "rising" : "pro";
  return { tier, score };
}
