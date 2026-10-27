import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rankCreators, applyTierDiversity, applyExploration, type RankCreator } from "@/lib/ranking";
import { publicName } from "@/lib/names";
import type { Creator } from "@/components/marketplace/creator-card";

const SELECT =
  "id, handle, display_name, first_name, last_name, location, niches, starting_rate_naira, featured, verification_status, tier, earned_reputation, entry_placement_score, head_start_multiplier, pro_until, updated_at, avatar_url, strikes, benched, metrics:creator_metrics(avg_rating, review_count, gigs_completed, active_gigs)";

type Row = RankCreator & { avatar_url: string | null; first_name: string | null; last_name: string | null };

/**
 * Top real, live creators for the homepage strip — run through the SAME ranking
 * engine as the directory (rank → impression cap → exploration slots), so the
 * first faces a visitor sees are the engine's actual recommendations. Returns []
 * when Supabase isn't configured or no live creators exist yet; the caller then
 * falls back to the pre-launch sample strip (no fabricated data in the DB path).
 */
export async function topRankedCreators(limit = 8): Promise<Creator[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    return await fetchTopRanked(limit);
  } catch {
    // A DB hiccup must never break the homepage — fall back to the sample strip.
    return [];
  }
}

async function fetchTopRanked(limit: number): Promise<Creator[]> {
  const supabase = await createClient();

  const [{ data }, { data: boostIds }] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select(SELECT)
      .eq("is_live", true)
      .eq("shadowbanned", false)
      .order("earned_reputation", { ascending: false, nullsFirst: false })
      .limit(60),
    supabase.rpc("active_boost_target_ids", { ttype: "creator" }),
  ]);
  if (!data || data.length === 0) return [];

  const boosted = new Set<string>((boostIds ?? []).map((x: unknown) => String(x)));
  const now = Date.now();

  let rows: Row[] = data.map((c) => {
    const m = (Array.isArray(c.metrics) ? c.metrics[0] : c.metrics) as { avg_rating?: number | null; review_count?: number; gigs_completed?: number; active_gigs?: number } | null;
    return {
      id: c.id,
      handle: c.handle,
      display_name: c.display_name,
      location: c.location,
      niches: c.niches ?? [],
      starting_rate_naira: c.starting_rate_naira,
      featured: !!c.featured,
      verification_status: c.verification_status,
      tier: c.tier ?? "origin",
      earned_reputation: c.earned_reputation,
      entry_placement_score: c.entry_placement_score,
      head_start_multiplier: c.head_start_multiplier,
      updated_at: c.updated_at,
      avg_rating: m?.avg_rating ?? null,
      review_count: m?.review_count ?? 0,
      boosted: boosted.has(c.id),
      active_gigs: m?.active_gigs ?? 0,
      gigs_completed: m?.gigs_completed ?? 0,
      is_pro: !!(c.pro_until && new Date(c.pro_until as string).getTime() > now),
      strikes: (c.strikes as number | null) ?? 0,
      benched: !!c.benched,
      avatar_url: c.avatar_url as string | null,
      first_name: c.first_name as string | null,
      last_name: c.last_name as string | null,
    };
  });

  rows = rankCreators(rows, {});
  rows = applyTierDiversity(rows, { pageSize: limit });
  rows = applyExploration(rows, { pageSize: limit });

  return rows.slice(0, limit).map((c) => ({
    name: publicName({ first: c.first_name, last: c.last_name, display: c.display_name, handle: c.handle }),
    handle: c.handle ?? undefined,
    image: c.avatar_url || undefined,
    location: c.location ?? "Nigeria",
    niches: c.niches ?? [],
    startingRate: c.starting_rate_naira ?? 0,
    featured: c.featured || !!c.boosted,
    pro: c.is_pro,
    verified: c.verification_status === "verified",
    id: c.id,
    ...(c.review_count && c.avg_rating ? { rating: c.avg_rating, reviews: c.review_count } : {}),
    ...(c.gigs_completed ? { gigsCompleted: c.gigs_completed } : {}),
  }));
}
