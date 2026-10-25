"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paystackConfigured, initTransaction, initiateTransfer } from "@/lib/payments/paystack";
import { feeFor } from "@/lib/fees";
import { detectPlatform } from "@/lib/social/detect";

async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export type CampaignInput = { title: string; description: string; niches: string[]; pool: number; ratePer1000: number };

export async function postCampaignAction(input: CampaignInput): Promise<{ error?: string; needsBrand?: boolean }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in to create a campaign." };
  const { data: brand } = await supabase.from("brand_profiles").select("id").eq("id", user.id).maybeSingle();
  if (!brand) return { error: "Create a brand account first.", needsBrand: true };
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
  if (c.funded) return { error: "This campaign is already funded." };
  if (!paystackConfigured()) return { configured: false };

  const amount = c.pool_naira + feeFor(c.pool_naira);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ugcorigin.com";
  try {
    const { authorizationUrl } = await initTransaction({
      email: user.email ?? `brand+${user.id}@ugcorigin.com`,
      amountNaira: amount,
      reference: `camp_${campaignId}_${Date.now()}`,
      metadata: { campaignId, kind: "campaign_funding" },
      callbackUrl: `${site}/campaigns/${campaignId}?funded=1`,
    });
    return { url: authorizationUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start payment." };
  }
}

export async function submitToCampaignAction(campaignId: string, url: string, claimedViews: number): Promise<{ error?: string; ok?: boolean; needsCreator?: boolean }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in to submit." };
  const { data: creator } = await supabase.from("creator_profiles").select("id").eq("id", user.id).maybeSingle();
  if (!creator) return { error: "Set up a creator profile first.", needsCreator: true };

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
  const { data: c } = await admin.from("campaigns").select("id, brand_id, title, pool_naira, spent_naira, rate_per_1000_naira").eq("id", sub.campaign_id).maybeSingle();
  if (!c) return { error: "Campaign not found." };
  if (c.brand_id !== user.id) {
    const { data: isAdmin } = await admin.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!isAdmin) return { error: "Not allowed." };
  }

  const remaining = c.pool_naira - c.spent_naira;
  const views = Math.max(0, Math.round(approvedViews || 0));
  const payout = Math.min(remaining, Math.floor((views / 1000) * c.rate_per_1000_naira));
  if (payout <= 0) return { error: "No pool left, or views too low to pay." };

  await admin.from("campaign_submissions").update({ approved_views: views, payout_naira: payout, status: "paid" }).eq("id", submissionId);
  const newSpent = c.spent_naira + payout;
  await admin.from("campaigns").update({ spent_naira: newSpent, status: newSpent >= c.pool_naira ? "completed" : "open" }).eq("id", c.id);

  // Payout to the creator.
  const { data: creator } = await admin.from("creator_profiles").select("payout_recipient_code").eq("id", sub.creator_id).maybeSingle();
  const { data: payoutRow } = await admin.from("payouts").insert({ creator_id: sub.creator_id, provider: "paystack", amount_naira: payout, status: "pending" }).select("id").single();
  await admin.from("ledger_entries").insert({ user_id: sub.creator_id, entry_type: "payout", amount_naira: payout, memo: `Per-view payout, ${c.title}` });
  if (paystackConfigured() && creator?.payout_recipient_code && payoutRow) {
    try {
      const t = await initiateTransfer({ amountNaira: payout, recipientCode: creator.payout_recipient_code, reason: `UGCOrigin campaign payout, ${c.title}`, reference: `pay_${payoutRow.id}` });
      await admin.from("payouts").update({ status: "processing", provider_ref: t.reference }).eq("id", payoutRow.id);
    } catch {
      /* leave pending */
    }
  }
  await admin.from("notifications").insert({ user_id: sub.creator_id, type: "campaign_paid", title: "You got paid", body: `Your submission to "${c.title}" earned ₦${payout.toLocaleString()}.`, href: `/campaigns/${c.id}` });

  revalidatePath(`/campaigns/${c.id}`);
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
    const { data: isAdmin } = await admin.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!isAdmin) return { error: "Not allowed." };
  }

  await admin.from("campaign_submissions").update({ status: "forfeited", forfeit_reason: reason.trim() || "Inflated or ineligible views" }).eq("id", submissionId);
  await admin.from("notifications").insert({ user_id: sub.creator_id, type: "campaign_forfeited", title: "Submission forfeited", body: `A submission to "${c.title}" was forfeited.`, href: `/campaigns/${c.id}` });
  revalidatePath(`/campaigns/${c.id}`);
  return { ok: true };
}
