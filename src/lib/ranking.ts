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
  /** Gigs the creator is actively carrying (funded/in_progress/in_review/revision). */
  active_gigs?: number;
  /** Completed gigs — used to spot newcomers for the exploration slots. */
  gigs_completed?: number;
};

export type RankOpts = { niche?: string; q?: string };

// Availability nudge: each live job a creator is carrying lowers them a little
// (bounded) so they aren't over-booked; it lifts automatically as they finish.
const LOAD_PER_GIG = 5;
const LOAD_CAP = 20;

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

  // Availability: carrying live work nudges ranking down (bounded), recovering
  // as the creator ships. Keeps top creators from being over-booked.
  if (c.active_gigs) s -= Math.min(LOAD_CAP, c.active_gigs * LOAD_PER_GIG);

  // Trust penalties: each strike lowers ranking; a benched creator sinks to the
  // very bottom (still listed, so they can recover).
  if (c.strikes) s -= c.strikes * 15;
  if (c.benched) s -= 1000;

  return s;
}

export function rankCreators(list: RankCreator[], opts: RankOpts): RankCreator[] {
  return [...list].sort((a, b) => scoreCreator(b, opts) - scoreCreator(a, opts));
}

// A creator is a "newcomer" (eligible for exploration slots) when they have no
// completed gigs yet and aren't benched. Boosted creators already have paid
// visibility, so they don't take an exploration slot.
function isNewcomer(c: RankCreator): boolean {
  return (c.gigs_completed ?? 0) === 0 && !c.benched && !c.boosted;
}

/**
 * Exploration quota: this is the leveler's "reserved opportunity slots, funded
 * by capping top creators' impression share" — implemented as interleaving. We
 * lift the strongest buried newcomers into a few fixed positions on the first
 * page so new, verified creators get discovered instead of being permanently
 * out-ranked. Bounded (a couple of slots) so it never corrupts the main order.
 *
 * `ranked` must already be sorted by scoreCreator. Pure/stable; no DB access.
 */
export function applyExploration(
  ranked: RankCreator[],
  opts?: { pageSize?: number; slotPositions?: number[] },
): RankCreator[] {
  const pageSize = opts?.pageSize ?? 24;
  const slots = opts?.slotPositions ?? [3, 7]; // 0-based positions on page 1

  const newcomers = ranked.filter(isNewcomer);
  if (newcomers.length === 0) return ranked;

  // Newcomers already visible on page 1 don't need lifting.
  const onFirstPage = new Set(ranked.slice(0, pageSize).filter(isNewcomer).map((c) => c.id));
  const toLift = newcomers.filter((c) => !onFirstPage.has(c.id)).slice(0, slots.length);
  if (toLift.length === 0) return ranked;

  const liftSet = new Set(toLift.map((c) => c.id));
  const rest = ranked.filter((c) => !liftSet.has(c.id));

  const result = [...rest];
  slots.slice(0, toLift.length).forEach((pos, i) => {
    result.splice(Math.min(pos, result.length), 0, toLift[i]);
  });
  return result;
}
