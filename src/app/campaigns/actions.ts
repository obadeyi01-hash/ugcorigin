"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paystackConfigured, initTransaction } from "@/lib/payments/paystack";
import { feeFor, taxFor } from "@/lib/fees";
import { loadTaxBps } from "@/lib/fees-server";
import { payCampaignSubmission } from "@/lib/payments/settle";
import { guardWrite } from "@/lib/admin/rbac";
import { detectPlatform } from "@/lib/social/detect";
import { requireLiveCreator, requireVerifiedBrand } from "@/lib/verification/gates";

async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export type CampaignInput = { title: string; description: string; niches: string[]; pool: number; ratePer1000: number };

export async function postCampaignAction(input: CampaignInput): Promise<{ error?: string; needsBrand?: boolean; href?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in to create a campaign." };
  const gate = await requireVerifiedBrand(supabase, user.id);
  if (!gate.ok) return { error: gate.error, needsBrand: gate.needsBrand, href: gate.href };
  if (!input.title.trim()) return { error: "Add a title." };
  if (!(input.pool > 0) || !(input.ratePer1000 > 0)) return { error: "Set a pool and a rate per 1,000 views." };

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      brand_id: user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      niches: input.niches,
      pool_naira: Math.round(input.pool),
      rate_per_1000_naira: Math.round(input.ratePer1000),
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/campaigns");
  redirect(`/campaigns/${data.id}`);
}

export async function fundCampaignAction(campaignId: string): Promise<{ url?: string; configured?: boolean; error?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };
  const { data: c } = await supabase.from("campaigns").select("id, brand_id, pool_naira, funded").eq("id", campaignId).maybeSingle();
  if (!c || c.brand_id !== user.id) return { error: "Not allowed." };
  const gate = await requireVerifiedBrand(supabase, user.id);
  if (!gate.ok) return { error: gate.error };
  if (c.funded) return { error: "This campaign is already funded." };
  if (!paystackConfigured()) return { configured: false };

  const taxBps = await loadTaxBps();
  const amount = c.pool_naira + feeFor(c.pool_naira) + taxFor(c.pool_naira, taxBps);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ugcorigin.com";
  try {
    const { authorizationUrl } = await initTransaction({
      email: user.email ?? `brand+${user.id}@ugcorigin.com`,
      amountNaira: amount,
      reference: `camp_${campaignId}_${Date.now()}`,
      metadata: { campaignId, kind: "campaign_funding", taxBps },
      callbackUrl: `${site}/campaigns/${campaignId}?funded=1`,
    });
    return { url: authorizationUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start payment." };
  }
}

export async function submitToCampaignAction(campaignId: string, url: string, claimedViews: number): Promise<{ error?: string; ok?: boolean; needsCreator?: boolean; href?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in to submit." };
  const gate = await requireLiveCreator(supabase, user.id);
  if (!gate.ok) return { error: gate.error, needsCreator: gate.needsCreator, href: gate.href };

  const { data: c } = await supabase.from("campaigns").select("id, status, funded").eq("id", campaignId).maybeSingle();
  if (!c || c.status !== "open" || !c.funded) return { error: "This campaign isn't open for submissions." };

  const clean = url.trim();
  const platform = detectPlatform(clean);
  const { error } = await supabase.from("campaign_submissions").insert({
    campaign_id: campaignId,
    creator_id: user.id,
    url: clean,
    platform,
    claimed_views: Math.max(0, Math.round(claimedViews || 0)),
  });
  if (error) {
    if (error.code === "23505") return { error: "You've already submitted to this campaign." };
    return { error: error.message };
  }
  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true };
}

export async function approveAndPayAction(submissionId: string, approvedViews: number): Promise<{ error?: string; ok?: boolean }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: sub } = await supabase.from("campaign_submissions").select("id, campaign_id, creator_id, status").eq("id", submissionId).maybeSingle();
  if (!sub) return { error: "Submission not found." };
  if (sub.status === "paid") return { ok: true };

  const admin = createAdminClient();
  const { data: c } = await admin.from("campaigns").select("id, brand_id, title").eq("id", sub.campaign_id).maybeSingle();
  if (!c) return { error: "Campaign not found." };
  if (c.brand_id !== user.id) {
    const { error } = await guardWrite("finance");
    if (error) return { error: "Not allowed." };
  }

  const paid = await payCampaignSubmission(admin, submissionId, approvedViews);
  if (!paid.ok) return { error: paid.error ?? "Could not pay this submission." };
  if (paid.payout && paid.creatorId && paid.campaignId) {
    await admin.from("notifications").insert({
      user_id: paid.creatorId,
      type: "campaign_paid",
      title: "You got paid",
      body: `Your submission to "${paid.title}" earned ₦${paid.payout.toLocaleString()}.`,
      href: `/campaigns/${paid.campaignId}`,
    });
    revalidatePath(`/campaigns/${paid.campaignId}`);
  }
  return { ok: true };
}

export async function forfeitSubmissionAction(submissionId: string, reason: string): Promise<{ error?: string; ok?: boolean }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };
  const { data: sub } = await supabase.from("campaign_submissions").select("id, campaign_id, creator_id").eq("id", submissionId).maybeSingle();
  if (!sub) return { error: "Submission not found." };

  const admin = createAdminClient();
  const { data: c } = await admin.from("campaigns").select("id, brand_id, title").eq("id", sub.campaign_id).maybeSingle();
  if (!c) return { error: "Campaign not found." };
  if (c.brand_id !== user.id) {
    const { error } = await guardWrite("moderation");
    if (error) return { error: "Not allowed." };
  }

  await admin.from("campaign_submissions").update({ status: "forfeited", forfeit_reason: reason.trim() || "Inflated or ineligible views" }).eq("id", submissionId);
  await admin.from("notifications").insert({ user_id: sub.creator_id, type: "campaign_forfeited", title: "Submission forfeited", body: `A submission to "${c.title}" was forfeited.`, href: `/campaigns/${c.id}` });
  revalidatePath(`/campaigns/${c.id}`);
  return { ok: true };
}
