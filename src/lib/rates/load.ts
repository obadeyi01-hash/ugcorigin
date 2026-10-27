import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ANY, combineGuides, FALLBACK_GUIDES, isRateTier, type RateGuide, type RateSuggestion, type RateTier } from "@/lib/rates/guides";

const MIN_SAMPLE = 5;

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

async function platformMedian(
  admin: ReturnType<typeof createAdminClient>,
  niches: string[],
  location: string,
  tier: RateTier,
): Promise<{ platformMedian: number | null; platformCount: number }> {
  async function rates(withLocation: boolean) {
    let query = admin.from("creator_profiles").select("starting_rate_naira").eq("is_live", true).eq("tier", tier).gt("starting_rate_naira", 0);
    if (withLocation && location) query = query.eq("location", location);
    if (niches.length > 0) query = query.overlaps("niches", niches);
    const { data } = await query.limit(200);
    return (data ?? [])
      .map((row) => row.starting_rate_naira)
      .filter((n): n is number => typeof n === "number" && n > 0);
  }

  let values = location ? await rates(true) : [];
  if (values.length < MIN_SAMPLE) values = await rates(false);
  if (values.length < MIN_SAMPLE) return { platformMedian: null, platformCount: values.length };
  return { platformMedian: median(values), platformCount: values.length };
}

async function guidesFromDb(admin: ReturnType<typeof createAdminClient>): Promise<RateGuide[] | null> {
  const { data, error } = await admin.from("rate_guides").select("tier, niche, location, low_naira, typical_naira, high_naira");
  if (error || !data || data.length === 0) return null;
  const rows: RateGuide[] = [];
  for (const row of data) {
    if (!isRateTier(row.tier)) continue;
    rows.push({
      tier: row.tier,
      niche: row.niche,
      location: row.location || ANY,
      low: row.low_naira,
      typical: row.typical_naira,
      high: row.high_naira,
    });
  }
  return rows.length > 0 ? rows : null;
}

export async function loadRateSuggestion(niches: string[], location: string, tier: string): Promise<RateSuggestion | null> {
  const level: RateTier = isRateTier(tier) ? tier : "origin";
  const cleanNiches = niches.filter((n) => typeof n === "string" && n.trim()).slice(0, 5);
  const cleanLocation = location.trim();
  let guides = FALLBACK_GUIDES;
  let platform = { platformMedian: null as number | null, platformCount: 0 };
  try {
    const admin = createAdminClient();
    const stored = await guidesFromDb(admin);
    if (stored) guides = stored;
    platform = await platformMedian(admin, cleanNiches, cleanLocation, level);
  } catch {
    guides = FALLBACK_GUIDES;
  }
  const band = combineGuides(guides, level, cleanNiches, cleanLocation);
  return { ...band, tier: level, niches: cleanNiches, location: cleanLocation, ...platform };
}
