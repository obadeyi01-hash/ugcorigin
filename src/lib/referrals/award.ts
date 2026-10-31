import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/notify";
import { initiateTransfer, paystackConfigured } from "@/lib/payments/paystack";

type Admin = ReturnType<typeof createAdminClient>;

/** Paid to the inviter for each of an invited creator's first two contracts. Not taken from their rate. */
export const REFERRAL_HIRE_NAIRA = 5_000;

/**
 * Up to TWO bounties per invited creator, one for each of their first two
 * funded contracts, and only after a brand has actually funded the gig. A
 * creator cannot earn it by inviting themselves, and the brand who paid cannot
 * be the inviter. Rewards are idempotent per (invited creator, gig).
 */
export async function awardReferral(
  admin: Admin,
  hire: { creatorId: string; gigId: string; brandId: string },
): Promise<void> {
  try {
    const { data: creator } = await admin
      .from("creator_profiles")
      .select("id, referred_by")
      .eq("id", hire.creatorId)
      .maybeSingle();
    const referrerId = creator?.referred_by as string | null | undefined;
    if (!referrerId || referrerId === hire.creatorId || referrerId === hire.brandId) return;

    // Idempotent per gig: if this contract was already rewarded, finish it.
    // Otherwise create a new reward, but only for the first two contracts.
    let reward = (
      await admin
        .from("referral_rewards")
        .select("id, payout_id")
        .eq("referred_id", hire.creatorId)
        .eq("gig_id", hire.gigId)
        .maybeSingle()
    ).data;

    if (!reward) {
      const { count } = await admin
        .from("referral_rewards")
        .select("id", { count: "exact", head: true })
        .eq("referred_id", hire.creatorId);
      if ((count ?? 0) >= 2) return; // cap: first two contracts only

      const { data: inserted } = await admin
        .from("referral_rewards")
        .insert({
          referrer_id: referrerId,
          referred_id: hire.creatorId,
          gig_id: hire.gigId,
          amount_naira: REFERRAL_HIRE_NAIRA,
          status: "earned",
        })
        .select("id, payout_id")
        .maybeSingle();

      // A concurrent hire may have inserted this same gig first; fall back to it.
      reward = inserted ?? (
        await admin
          .from("referral_rewards")
          .select("id, payout_id")
          .eq("referred_id", hire.creatorId)
          .eq("gig_id", hire.gigId)
          .maybeSingle()
      ).data;
    }
    if (!reward || reward.payout_id) return;

    const { data: payout, error } = await admin
      .from("payouts")
      .insert({
        creator_id: referrerId,
        gig_id: null,
        provider: "paystack",
        amount_naira: REFERRAL_HIRE_NAIRA,
        status: "pending",
      })
      .select("id, status")
      .single();
    if (error || !payout) return;

    const { data: claimed } = await admin
      .from("referral_rewards")
      .update({ payout_id: payout.id })
      .eq("id", reward.id)
      .is("payout_id", null)
      .select("id")
      .maybeSingle();
    if (!claimed) {
      await admin.from("payouts").delete().eq("id", payout.id).eq("status", "pending");
      return;
    }

    await admin.from("ledger_entries").insert({
      user_id: referrerId,
      entry_type: "credit",
      amount_naira: REFERRAL_HIRE_NAIRA,
      memo: "Referral, an invited creator was hired",
    });

    const { data: referrer } = await admin
      .from("creator_profiles")
      .select("payout_recipient_code")
      .eq("id", referrerId)
      .maybeSingle();

    if (paystackConfigured() && referrer?.payout_recipient_code && payout.status === "pending") {
      const transfer = await initiateTransfer({
        amountNaira: REFERRAL_HIRE_NAIRA,
        recipientCode: referrer.payout_recipient_code,
        reason: "UGCOrigin referral, a creator you invited was hired",
        reference: `pay_${payout.id}`,
      });
      await admin.from("payouts").update({ status: "processing", provider_ref: transfer.reference }).eq("id", payout.id);
    }

    await notifyUser(admin, referrerId, {
      type: "referral",
      title: "Your invite got someone hired",
      body: `You earned ₦${REFERRAL_HIRE_NAIRA.toLocaleString("en-NG")}. It is paid to your bank, separate from their rate.`,
      href: "/dashboard",
      ctaLabel: "See your invite",
    });
  } catch (error) {
    console.error("referral award failed", error instanceof Error ? error.message : "unknown");
  }
}

export async function markReferralPaid(admin: Admin, payoutId: string): Promise<void> {
  await admin.from("referral_rewards").update({ status: "paid" }).eq("payout_id", payoutId).eq("status", "earned");
}
