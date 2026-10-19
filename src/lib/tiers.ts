// Client-side mirror of the `tier_config` seed (supabase/migrations/*_tier_engine.sql).
// Used for display and for showing price floors in the UI. The DATABASE is the
// source of truth and enforces floors + tier changes server-side; this is just
// so the UI can label tiers and show the right floor without an extra query.

export type TierKey =
  | "origin"
  | "rising"
  | "pro"
  | "standout"
  | "elite"
  | "signature"
  | "luminary";

export type TierMeta = {
  key: TierKey;
  rank: number; // 1..7
  label: string;
  tagline: string;
  floorNaira: number;
};

export const TIERS: TierMeta[] = [
  { key: "origin", rank: 1, label: "Origin", tagline: "Verified human, your starting line.", floorNaira: 10000 },
  { key: "rising", rank: 2, label: "Rising", tagline: "Gaining traction with real brands.", floorNaira: 20000 },
  { key: "pro", rank: 3, label: "Pro", tagline: "Proven, reliable, repeatably hired.", floorNaira: 35000 },
  { key: "standout", rank: 4, label: "Standout", tagline: "Consistently top-rated, standout work.", floorNaira: 55000 },
  { key: "elite", rank: 5, label: "Elite", tagline: "Among the very best in your niche.", floorNaira: 85000 },
  { key: "signature", rank: 6, label: "Signature", tagline: "Rare, highly selective, signature talent.", floorNaira: 130000 },
  { key: "luminary", rank: 7, label: "Luminary", tagline: "The apex, the best on UGCOrigin.", floorNaira: 200000 },
];

const BY_KEY = new Map(TIERS.map((t) => [t.key, t]));

/** Highest tier a creator can be PLACED at via external credibility (earned-only above). */
export const ENTRY_CAP_TIER: TierKey = "pro";

export function tierMeta(key: string | null | undefined): TierMeta {
  return BY_KEY.get((key ?? "origin") as TierKey) ?? TIERS[0];
}

export function tierFloor(key: string | null | undefined): number {
  return tierMeta(key).floorNaira;
}

/** Tier at which creators are considered "Influencer" level (Signature+). */
export const INFLUENCER_MIN_RANK = 6;

/** Whether to show the Influencer badge: admin-set flag OR a top tier. */
export function isInfluencer(tier: string | null | undefined, flag?: boolean | null): boolean {
  return !!flag || tierMeta(tier).rank >= INFLUENCER_MIN_RANK;
}
