"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardWrite } from "@/lib/admin/rbac";
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
