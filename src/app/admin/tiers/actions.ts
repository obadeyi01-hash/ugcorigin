"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardWrite } from "@/lib/admin/rbac";
import { CATEGORIES, NG_STATES } from "@/lib/categories";
import { ANY, isRateTier } from "@/lib/rates/guides";
import type { TierKey } from "@/lib/tiers";

type Res = { error?: string; ok?: boolean };

const TIER_KEYS: TierKey[] = ["origin", "rising", "pro", "standout", "elite", "signature", "luminary"];

type Admin = ReturnType<typeof createAdminClient>;

async function audit(
  admin: Admin,
  actorId: string,
  action: string,
  targetId: string | null, // uuid, or null for non-uuid targets (tier_config keys on enum)
  before: unknown,
  after: unknown,
) {
  await admin.from("audit_log").insert({
    actor_id: actorId,
    action,
    target_type: action.startsWith("tier_config") ? "tier_config" : "creator_profile",
    target_id: targetId,
    before: before as object,
    after: after as object,
  });
}

/** Manually override a creator's tier (audited). The DB floor trigger re-clamps their rate. */
export async function adminSetTier(creatorId: string, tier: TierKey): Promise<Res> {
  const { ctx, error } = await guardWrite("tiers");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  if (!TIER_KEYS.includes(tier)) return { error: "Unknown tier." };

  const admin = createAdminClient();
  const { data: before } = await admin
    .from("creator_profiles")
    .select("tier, starting_rate_naira")
    .eq("id", creatorId)
    .maybeSingle();
  if (!before) return { error: "Creator not found." };

  const { error: e } = await admin.from("creator_profiles").update({ tier }).eq("id", creatorId);
  if (e) return { error: e.message };

  const { data: after } = await admin
    .from("creator_profiles")
    .select("tier, starting_rate_naira")
    .eq("id", creatorId)
    .maybeSingle();

  await audit(admin, ctx.userId, "tier.override", creatorId, before, after);
  revalidatePath("/admin/tiers");
  return { ok: true };
}

/** Toggle a creator's Influencer designation (audited). */
export async function adminSetInfluencer(creatorId: string, value: boolean): Promise<Res> {
  const { ctx, error } = await guardWrite("tiers");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  const admin = createAdminClient();
  const { error: e } = await admin.from("creator_profiles").update({ is_influencer: value }).eq("id", creatorId);
  if (e) return { error: e.message };
  await audit(admin, ctx.userId, "influencer.set", creatorId, null, { is_influencer: value });
  revalidatePath("/admin/tiers");
  return { ok: true };
}

/** Re-run the scoring engine for one creator (metrics → ERS → tier, ±1 step). */
export async function adminRecomputeTier(creatorId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("tiers");
  if (error || !ctx) return { error: error ?? "Not permitted." };

  const admin = createAdminClient();
  const { data: before } = await admin.from("creator_profiles").select("tier, earned_reputation").eq("id", creatorId).maybeSingle();

  const { error: e } = await admin.rpc("recompute_creator_tier", { cid: creatorId });
  if (e) return { error: e.message };

  const { data: after } = await admin.from("creator_profiles").select("tier, earned_reputation").eq("id", creatorId).maybeSingle();
  await audit(admin, ctx.userId, "tier.recompute", creatorId, before, after);
  revalidatePath("/admin/tiers");
  return { ok: true };
}

/** Edit a tier's floor / label / tagline (audited). */
export async function adminUpdateTierConfig(
  tier: TierKey,
  patch: { floor_naira: number; label: string; tagline: string },
): Promise<Res> {
  const { ctx, error } = await guardWrite("tiers");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  if (!TIER_KEYS.includes(tier)) return { error: "Unknown tier." };

  const floor = Math.max(0, Math.round(patch.floor_naira));
  const label = patch.label.trim();
  const tagline = patch.tagline.trim();
  if (!label) return { error: "Label can’t be empty." };

  const admin = createAdminClient();
  const { data: before } = await admin.from("tier_config").select("floor_naira, label, tagline").eq("tier", tier).maybeSingle();

  const { error: e } = await admin
    .from("tier_config")
    .update({ floor_naira: floor, label, tagline, updated_at: new Date().toISOString() })
    .eq("tier", tier);
  if (e) return { error: e.message };

  await audit(admin, ctx.userId, "tier_config.update", null, { tier, ...before }, { tier, floor_naira: floor, label, tagline });
  revalidatePath("/admin/tiers");
  revalidatePath("/settings");
  return { ok: true };
}

type RateGuideInput = { tier: string; niche: string; location: string; low: number; typical: number; high: number };

/** Replace the suggested starting-rate bands. Creators see these on onboarding, settings, and the dashboard. */
export async function saveRateGuides(rows: RateGuideInput[]): Promise<Res> {
  const { ctx, error } = await guardWrite("tiers");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 400) {
    return { error: "Add between 1 and 400 rate bands." };
  }

  const niches = new Set<string>([ANY, ...CATEGORIES]);
  const places = new Set<string>([ANY, ...NG_STATES]);
  const seen = new Set<string>();
  const cleaned = rows.map((row) => {
    const tier = row.tier.trim();
    const niche = row.niche.trim();
    const location = row.location.trim() || ANY;
    const low = Math.round(Number(row.low));
    const typical = Math.round(Number(row.typical));
    const high = Math.round(Number(row.high));
    return { tier, niche, location, low, typical, high };
  });

  for (const row of cleaned) {
    if (!isRateTier(row.tier) || !niches.has(row.niche) || !places.has(row.location)) return { error: "Use a tier, niche and state from the lists." };
    if (!(row.low > 0 && row.typical >= row.low && row.high >= row.typical)) {
      return { error: "Each band needs a low, a usual rate at or above it, and a high at or above that." };
    }
    const key = `${row.tier}|${row.niche}|${row.location}`;
    if (seen.has(key)) return { error: "Two bands use the same tier, niche and state." };
    seen.add(key);
  }

  const admin = createAdminClient();
  const { data: before } = await admin.from("rate_guides").select("id, tier, niche, location, low_naira, typical_naira, high_naira");
  const { error: inserted } = await admin.from("rate_guides").upsert(
    cleaned.map((row) => ({
      tier: row.tier,
      niche: row.niche,
      location: row.location,
      low_naira: row.low,
      typical_naira: row.typical,
      high_naira: row.high,
    })),
    { onConflict: "tier,niche,location" },
  );
  if (inserted) return { error: inserted.message };
  const keep = new Set(cleaned.map((row) => `${row.tier}|${row.niche}|${row.location}`));
  const drop = (before ?? []).filter((row) => !keep.has(`${row.tier}|${row.niche}|${row.location}`)).map((row) => row.id);
  if (drop.length > 0) {
    const { error: removed } = await admin.from("rate_guides").delete().in("id", drop);
    if (removed) return { error: removed.message };
  }

  await admin.from("audit_log").insert({
    actor_id: ctx.userId,
    action: "rate_guides.replace",
    target_type: "rate_guides",
    target_id: null,
    before: before ?? [],
    after: cleaned,
  });
  revalidatePath("/admin/tiers");
  revalidatePath("/settings");
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  return { ok: true };
}
