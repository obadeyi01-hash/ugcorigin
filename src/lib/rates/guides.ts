// Admin-owned starting rates, one band per entry tier, niche and state.
// A new creator is Origin. Rising and Pro are earned. One listing never
// becomes the suggested number.

// Mirrors the tier_config floors. Origin is the onboarding rate.
const TIER_FLOOR: Record<string, number> = {
  origin: 10000,
  rising: 20000,
  pro: 35000,
  standout: 55000,
  elite: 85000,
  signature: 130000,
  luminary: 200000,
};

const TIER_LABEL: Record<string, string> = {
  origin: "Origin",
  rising: "Rising",
  pro: "Pro",
  standout: "Standout",
  elite: "Elite",
  signature: "Signature",
  luminary: "Luminary",
};

export type RateTier = keyof typeof TIER_FLOOR;

function naira(amount: number) {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

export const ANY = "*";

export type RateGuide = {
  tier: RateTier;
  niche: string;
  location: string;
  low: number;
  typical: number;
  high: number;
};

export type RateBand = {
  low: number;
  typical: number;
  high: number;
};

export type RateStance = "empty" | "low" | "ok" | "high";

export type RateSuggestion = RateBand & {
  tier: RateTier;
  niches: string[];
  location: string;
  platformMedian: number | null;
  platformCount: number;
};

type Seed = { niche: string; low: number; typical: number; high: number };

const ORIGIN: Seed[] = [
  { niche: ANY, low: 10000, typical: 12000, high: 18000 },
  { niche: "Lifestyle", low: 10000, typical: 12000, high: 18000 },
  { niche: "Fashion", low: 10000, typical: 15000, high: 20000 },
  { niche: "Dance & Choreography", low: 10000, typical: 12000, high: 18000 },
  { niche: "Beauty & Skincare", low: 10000, typical: 15000, high: 20000 },
  { niche: "Food & Cooking", low: 10000, typical: 12000, high: 18000 },
  { niche: "Finance & Fintech", low: 12000, typical: 18000, high: 25000 },
  { niche: "SaaS / Tech", low: 12000, typical: 18000, high: 25000 },
];

const RISING: Seed[] = [
  { niche: ANY, low: 20000, typical: 25000, high: 32000 },
  { niche: "Lifestyle", low: 20000, typical: 22000, high: 30000 },
  { niche: "Fashion", low: 20000, typical: 28000, high: 35000 },
  { niche: "Dance & Choreography", low: 20000, typical: 22000, high: 30000 },
  { niche: "Beauty & Skincare", low: 20000, typical: 28000, high: 35000 },
  { niche: "Food & Cooking", low: 20000, typical: 22000, high: 30000 },
  { niche: "Finance & Fintech", low: 25000, typical: 32000, high: 40000 },
  { niche: "SaaS / Tech", low: 25000, typical: 32000, high: 40000 },
];

const PRO: Seed[] = [
  { niche: ANY, low: 35000, typical: 40000, high: 50000 },
  { niche: "Lifestyle", low: 35000, typical: 40000, high: 48000 },
  { niche: "Fashion", low: 35000, typical: 45000, high: 55000 },
  { niche: "Dance & Choreography", low: 35000, typical: 40000, high: 48000 },
  { niche: "Beauty & Skincare", low: 35000, typical: 45000, high: 55000 },
  { niche: "Food & Cooking", low: 35000, typical: 40000, high: 48000 },
  { niche: "Finance & Fintech", low: 40000, typical: 50000, high: 65000 },
  { niche: "SaaS / Tech", low: 40000, typical: 50000, high: 65000 },
];

export function roundToThousand(n: number) {
  return Math.round(n / 1000) * 1000;
}

function expand(tier: RateTier, seeds: Seed[]): RateGuide[] {
  const places = [ANY, "Lagos", "FCT - Abuja"];
  const rows: RateGuide[] = [];
  for (const place of places) {
    for (const seed of seeds) {
      const bump = place === ANY ? 1 : 1.25;
      rows.push({
        tier,
        niche: seed.niche,
        location: place,
        low: roundToThousand(seed.low * bump),
        typical: roundToThousand(seed.typical * bump),
        high: roundToThousand(seed.high * bump),
      });
    }
  }
  return rows;
}

/** Used when the rate_guides table has no row for this tier yet. */
export const FALLBACK_GUIDES: RateGuide[] = [
  ...expand("origin", ORIGIN),
  ...expand("rising", RISING),
  ...expand("pro", PRO),
];

export function isRateTier(value: string): value is RateTier {
  return value in TIER_FLOOR;
}

function floorBand(tier: RateTier): RateBand {
  const floor = TIER_FLOOR[tier];
  return {
    low: floor,
    typical: roundToThousand(floor * 1.2),
    high: roundToThousand(floor * 1.5),
  };
}

export function pickGuide(guides: RateGuide[], tier: RateTier, niche: string, location: string): RateGuide | null {
  const rows = guides.filter((guide) => guide.tier === tier);
  return (
    rows.find((guide) => guide.niche === niche && guide.location === location) ??
    rows.find((guide) => guide.niche === niche && guide.location === ANY) ??
    rows.find((guide) => guide.niche === ANY && guide.location === location) ??
    rows.find((guide) => guide.niche === ANY && guide.location === ANY) ??
    null
  );
}

export function combineGuides(guides: RateGuide[], tier: RateTier, niches: string[], location: string): RateBand {
  const list = niches.length > 0 ? niches : [ANY];
  const picked: RateGuide[] = [];
  for (const niche of list) {
    const guide = pickGuide(guides, tier, niche, location);
    if (guide) picked.push(guide);
  }
  if (picked.length === 0) return floorBand(tier);
  const avg = (key: keyof RateBand) => roundToThousand(picked.reduce((sum, guide) => sum + guide[key], 0) / picked.length);
  const band = { low: avg("low"), typical: avg("typical"), high: avg("high") };
  const floor = TIER_FLOOR[tier];
  return {
    low: Math.max(band.low, floor),
    typical: Math.max(band.typical, floor),
    high: Math.max(band.high, floor),
  };
}

export function rateStance(rate: number, band: RateBand): RateStance {
  if (!rate || rate <= 0) return "empty";
  if (rate > band.high * 1.25) return "high";
  if (rate < band.low * 0.8) return "low";
  return "ok";
}

function nichePhrase(niches: string[]) {
  return niches.length > 0 ? niches.join(", ") : "these niches";
}

export function rateMessage(rate: number, suggestion: RateSuggestion): { stance: RateStance; lead: string; detail: string } {
  const stance = rateStance(rate, suggestion);
  const where = suggestion.location.trim() || "Nigeria";
  const who = nichePhrase(suggestion.niches);
  const level = TIER_LABEL[suggestion.tier] ?? "Origin";
  const range = `${naira(suggestion.low)}–${naira(suggestion.high)}`;
  const typical = naira(suggestion.typical);
  let lead: string;
  if (stance === "high") {
    lead = `${naira(rate)} is above the ${level} rate for ${who} in ${where}. Brands at this level usually pay ${range}. Start around ${typical}.`;
  } else if (stance === "low") {
    lead = `${naira(rate)} is under the ${level} rate for ${who} in ${where}. The usual range is ${range}, around ${typical}.`;
  } else if (stance === "ok") {
    lead = `${naira(rate)} sits in the ${level} range for ${who} in ${where} (${range}).`;
  } else {
    lead = `At ${level}, brands booking ${who} in ${where} usually pay ${range}. Start around ${typical}.`;
  }
  const detail =
    suggestion.tier === "origin"
      ? "Rising and Pro rates come after real completed work. This step stays on the Origin rate."
      : suggestion.platformMedian != null && suggestion.platformCount >= 5
        ? `${level} creators in these niches currently cluster around ${naira(suggestion.platformMedian)}, from ${suggestion.platformCount} profiles.`
        : "";
  return { stance, lead, detail };
}
