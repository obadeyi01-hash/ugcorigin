import { tierMeta } from "./tiers";

// Recommendation ranking for the creator directory. The DB does the heavy
// filtering (indexed WHERE clauses); this scores the bounded candidate set in
// memory so ordering can combine many signals cheaply. Mirrors the model in
// docs/tiering-and-ranking.md: outcome > fit > freshness > tier > verification,
// with paid boost as a small, bounded additive (never a takeover).

export type RankCreator = {
  id: string;
  handle: string | null;
  display_name: string | null;
  location: string | null;
  niches: string[];
  starting_rate_naira: number | null;
  featured: boolean;
  verification_status: string;
  tier: string;
  earned_reputation: number | null;
  updated_at: string;
  avg_rating?: number | null;
  review_count?: number;
  boosted?: boolean;
  strikes?: number;
  benched?: boolean;
};

export type RankOpts = { niche?: string; q?: string };

export function scoreCreator(c: RankCreator, { niche, q }: RankOpts): number {
  let s = 0;

  // Outcome: earned reputation (0..100) is the biggest lever.
  s += (c.earned_reputation ?? 0) * 0.6;

  // Reviews: quality weighted by volume (diminishing), capped.
  if (c.review_count && c.avg_rating) {
    s += Math.min(20, c.avg_rating * Math.log10(c.review_count + 1) * 4);
  }

  // Tier (1..7) and verification.
  s += tierMeta(c.tier).rank * 4;
  if (c.verification_status === "verified") s += 10;

  // Fit: exact niche match + text relevance to the query.
  if (niche && c.niches?.includes(niche)) s += 15;
  if (q) {
    const hay = `${c.display_name ?? ""} ${c.handle ?? ""} ${c.location ?? ""} ${(c.niches ?? []).join(" ")}`.toLowerCase();
    if (hay.includes(q.toLowerCase())) s += 10;
  }

  // Freshness / activity.
  const days = (Date.now() - new Date(c.updated_at).getTime()) / 86_400_000;
  if (days < 7) s += 6;
  else if (days < 30) s += 3;

  // Paid boost / editorial featured — small bounded nudge.
  if (c.boosted) s += 12;
  else if (c.featured) s += 8;

  // Trust penalties: each strike lowers ranking; a benched creator sinks to the
  // very bottom (still listed, so they can recover).
  if (c.strikes) s -= c.strikes * 15;
  if (c.benched) s -= 1000;

  return s;
}

export function rankCreators(list: RankCreator[], opts: RankOpts): RankCreator[] {
  return [...list].sort((a, b) => scoreCreator(b, opts) - scoreCreator(a, opts));
}
