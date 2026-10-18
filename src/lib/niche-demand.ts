// Brand-demand index per niche (0..100), a configured signal (not a claim
// about any individual creator), used as one input to entry placement (EPS).
// Tune as real demand data accumulates. Mirrors the NICHES in sample-data.ts.
const NICHE_DEMAND: Record<string, number> = {
  "Beauty & Skincare": 90,
  Fashion: 85,
  Fintech: 88,
  "SaaS / Tech": 82,
  "Food & Cooking": 80,
  "Product Demo": 80,
  Testimonials: 78,
  Unboxing: 75,
  Skits: 72,
  Lifestyle: 70,
};

const DEFAULT_DEMAND = 55;

/** Highest demand among the creator's niches (rewards one strong, in-demand niche). */
export function nicheDemandScore(niches: string[] | null | undefined): number {
  if (!niches || niches.length === 0) return DEFAULT_DEMAND;
  return Math.max(...niches.map((n) => NICHE_DEMAND[n] ?? DEFAULT_DEMAND));
}
