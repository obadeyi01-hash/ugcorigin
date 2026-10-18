// Featured-boost packages & pricing (shared server + client).
// Boosts are deliberately cheap "fuel money" and strictly bounded: they buy a
// spot in a small labelled Featured band, never a change to ranking/tier.

export type BoostTargetType = "creator" | "brief" | "campaign";

export type BoostPackage = { days: number; priceNaira: number; label: string };

const PACKAGES: Record<BoostTargetType, BoostPackage[]> = {
  creator: [
    { days: 7, priceNaira: 4000, label: "1 week" },
    { days: 14, priceNaira: 7000, label: "2 weeks" },
    { days: 30, priceNaira: 14000, label: "1 month" },
  ],
  brief: [
    { days: 7, priceNaira: 3000, label: "1 week" },
    { days: 14, priceNaira: 5000, label: "2 weeks" },
    { days: 30, priceNaira: 10000, label: "1 month" },
  ],
  campaign: [
    { days: 7, priceNaira: 3000, label: "1 week" },
    { days: 14, priceNaira: 5000, label: "2 weeks" },
    { days: 30, priceNaira: 10000, label: "1 month" },
  ],
};

export const BOOST_TARGET_LABEL: Record<BoostTargetType, string> = {
  creator: "profile",
  brief: "brief",
  campaign: "campaign",
};

export function boostPackages(target: BoostTargetType): BoostPackage[] {
  return PACKAGES[target];
}

export function boostPrice(target: BoostTargetType, days: number): number | null {
  return PACKAGES[target].find((p) => p.days === days)?.priceNaira ?? null;
}

/** How many Featured slots each surface shows, the hard cap that keeps boost bounded. */
export const FEATURED_CAP: Record<BoostTargetType, number> = {
  creator: 6,
  brief: 3,
  campaign: 3,
};
