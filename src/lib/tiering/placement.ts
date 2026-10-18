import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { nicheDemandScore } from "@/lib/niche-demand";

/**
 * Populate `entry_signals` for a creator from the verified evidence we actually
 * have, then let the DB do the placement. Writing the row fires the
 * `trg_entry_signals` trigger → compute_eps (capped at Pro) + recompute_creator_tier,
 * so an established creator starts above Origin instead of everyone at the floor.
 *
 * Honest inputs only (per the no-fabricated-data rule):
 *  - portfolio_count: real count of linked work samples (portfolio_links)
 *  - niche_demand_score: a configured demand index for their niches
 *  - verified_followers / prior_work_score: 0 for now, these need real
 *    follower-API verification and verified prior-work evidence, which aren't
 *    wired yet. Fill them in when those integrations land and placement improves.
 *
 * No-op until the tier-engine migration (*_tier_engine.sql) is applied (that's
 * what adds the trigger + compute functions); the row is still written safely.
 */
export async function placeCreator(userId: string): Promise<void> {
  const admin = createAdminClient();

  const [{ data: profile }, { count: portfolioCount }] = await Promise.all([
    admin.from("creator_profiles").select("niches").eq("id", userId).maybeSingle(),
    admin.from("portfolio_links").select("id", { count: "exact", head: true }).eq("creator_id", userId),
  ]);

  const demand = nicheDemandScore(profile?.niches as string[] | null);

  await admin.from("entry_signals").upsert(
    {
      creator_id: userId,
      verified_followers: 0,
      portfolio_count: portfolioCount ?? 0,
      prior_work_score: 0,
      niche_demand_score: demand,
    },
    { onConflict: "creator_id" },
  );
}
