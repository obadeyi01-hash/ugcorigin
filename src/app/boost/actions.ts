"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paystackConfigured, initTransaction } from "@/lib/payments/paystack";
import { boostPrice, type BoostTargetType } from "@/lib/boosts";
import { guardWrite } from "@/lib/admin/rbac";

export type BoostResult = { url?: string; configured?: boolean; error?: string };

async function ownsTarget(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  targetType: BoostTargetType,
  targetId: string,
): Promise<boolean> {
  if (targetType === "creator") return targetId === userId;
  if (targetType === "brief") {
    const { data } = await supabase.from("briefs").select("brand_id").eq("id", targetId).maybeSingle();
    return data?.brand_id === userId;
  }
  const { data } = await supabase.from("campaigns").select("brand_id").eq("id", targetId).maybeSingle();
  return data?.brand_id === userId;
}

function callbackPath(targetType: BoostTargetType, targetId: string): string {
  if (targetType === "creator") return `/dashboard?boosted=1`;
  if (targetType === "brief") return `/briefs/${targetId}?boosted=1`;
  return `/campaigns/${targetId}?boosted=1`;
}

export async function createBoostCheckout(input: {
  targetType: BoostTargetType;
  targetId: string;
  days: number;
}): Promise<BoostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const price = boostPrice(input.targetType, input.days);
  if (!price) return { error: "Pick a valid boost package." };

  if (!(await ownsTarget(supabase, user.id, input.targetType, input.targetId))) {
    return { error: "You can only boost your own." };
  }

  // Already have an active boost on this target? Don't double-charge.
  const admin = createAdminClient();
  const { data: live } = await admin
    .from("boosts")
    .select("id")
    .eq("target_id", input.targetId)
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString())
    .maybeSingle();
  if (live) return { error: "This already has an active boost." };

  if (!paystackConfigured()) return { configured: false };

  const { data: boost, error } = await admin
    .from("boosts")
    .insert({
      owner_id: user.id,
      target_type: input.targetType,
      target_id: input.targetId,
      days: input.days,
      amount_naira: price,
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !boost) return { error: error?.message ?? "Could not start the boost." };

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const { authorizationUrl } = await initTransaction({
      email: user.email ?? `user+${user.id}@ugcorigin.com`,
      amountNaira: price,
      reference: `boost_${boost.id}_${Date.now()}`,
      metadata: { kind: "boost", boostId: boost.id },
      callbackUrl: `${site}${callbackPath(input.targetType, input.targetId)}`,
    });
    return { url: authorizationUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start payment." };
  }
}

/** Admin: cancel an active/pending boost (ends its featured placement immediately). */
export async function cancelBoost(boostId: string): Promise<{ ok?: boolean; error?: string }> {
  const { error } = await guardWrite("boosts");
  if (error) return { error };
  const admin = createAdminClient();
  const { error: e } = await admin
    .from("boosts")
    .update({ status: "cancelled", ends_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", boostId);
  if (e) return { error: e.message };
  revalidatePath("/admin/boosts");
  return { ok: true };
}
