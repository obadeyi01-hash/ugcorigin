"use server";

import { CATEGORIES, NG_STATES } from "@/lib/categories";
import { loadRateSuggestion } from "@/lib/rates/load";
import type { RateSuggestion } from "@/lib/rates/guides";

const ALLOWED = new Set(CATEGORIES);

/** Public band for a creator's tier, niches and state. Onboarding is always Origin. */
export async function suggestStartingRate(niches: string[], location: string, tier = "origin"): Promise<RateSuggestion | null> {
  const clean = (Array.isArray(niches) ? niches : []).filter((n) => ALLOWED.has(n)).slice(0, 5);
  const loc = NG_STATES.includes(location) ? location : "";
  const level = tier === "rising" || tier === "pro" || tier === "standout" || tier === "elite" || tier === "signature" || tier === "luminary" ? tier : "origin";
  return loadRateSuggestion(clean, loc, level);
}
