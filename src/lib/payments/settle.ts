import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { brandCharge, feeFor } from "@/lib/fees";
import { createRefund, initiateTransfer, paystackConfigured } from "@/lib/payments/paystack";
import { campaignPayoutNaira, disputeShares, mayTransfer, type DisputeResolution } from "@/lib/payments/money-math";

type Admin = ReturnType<typeof createAdminClient>;

export type SettleResult = {
  ok?: boolean;
  error?: string;
  payoutQueued?: boolean;
  refundStarted?: boolean;
};

async function queueCreatorPayout(
  admin: Admin,
  args: { creatorId: string; gigId: string | null; amountNaira: number; title: string; reason: string },
): Promise<boolean> {
  if (args.amountNaira <= 0) return false;
  const { data: creator } = await admin
    .from("creator_profiles")
    .select("payout_recipient_code")
    .eq("id", args.creatorId)
    .maybeSingle();

  let payout: { id: string; status: string } | null = null;
  if (args.gigId) {
    const { data: existing } = await admin.from("payouts").select("id, status").eq("gig_id", args.gigId).maybeSingle();
    if (existing) payout = existing;
  }
  if (!payout) {
    const { data: inserted, error } = await admin
      .from("payouts")
      .insert({
        creator_id: args.creatorId,
        gig_id: args.gigId,
        provider: "paystack",
        amount_naira: args.amountNaira,
        status: "pending",
      })
      .select("id, status")
      .single();
    if (error || !inserted) return false;
    payout = inserted;
  }
  if (!paystackConfigured() || !creator?.payout_recipient_code || payout.status !== "pending") {
    return payout.status === "processing" || payout.status === "paid";
  }
  const t = await initiateTransfer({
    amountNaira: args.amountNaira,
    recipientCode: creator.payout_recipient_code,
    reason: args.reason,
    reference: `pay_${payout.id}`,
  });
  await admin.from("payouts").update({ status: "processing", provider_ref: t.reference }).eq("id", payout.id);
  return true;
}

/**
 * Pay the creator only after THIS call flips escrow from held to released.
 * A missing held row does not transfer. A payout row that already exists is
 * treated as the earlier winner.
 */
export async function releaseHeldGig(
  admin: Admin,
  gigId: string,
  opts?: { deliverableId?: string; memo?: string },
): Promise<SettleResult> {
  const { data: gig } = await admin
    .from("gigs")
    .select("id, creator_id, title, price_naira")
    .eq("id", gigId)
    .maybeSingle();
  if (!gig) return { error: "Gig not found." };

  const { data: esc } = await admin
    .from("escrow_transactions")
    .update({ status: "released" })
    .eq("gig_id", gigId)
    .eq("status", "held")
    .select("id")
    .maybeSingle();

  if (!mayTransfer(!!esc)) {
    const { data: existing } = await admin.from("payouts").select("id, status").eq("gig_id", gigId).maybeSingle();
    if (existing) return { ok: true, payoutQueued: existing.status === "processing" || existing.status === "paid" };
    return { error: "Escrow is not held, so no payout was sent." };
  }

  await admin.from("gigs").update({ status: "completed" }).eq("id", gigId);
  if (opts?.deliverableId) {
    await admin.from("deliverables").update({ status: "approved" }).eq("id", opts.deliverableId).eq("gig_id", gigId);
  }
  await admin.from("ledger_entries").insert([
    { gig_id: gigId, escrow_id: esc!.id, user_id: gig.creator_id, entry_type: "release", amount_naira: gig.price_naira, memo: opts?.memo ?? "Released to creator" },
    { gig_id: gigId, escrow_id: esc!.id, user_id: gig.creator_id, entry_type: "payout", amount_naira: gig.price_naira, memo: "Payout queued to creator" },
  ]);

  try {
    const payoutQueued = await queueCreatorPayout(admin, {
      creatorId: gig.creator_id,
      gigId,
      amountNaira: gig.price_naira,
      title: gig.title,
      reason: `UGCOrigin payout, ${gig.title}`,
    });
    return { ok: true, payoutQueued };
  } catch {
    return { ok: true, payoutQueued: false };
  }
}

async function revertEscrowToHeld(admin: Admin, escrowId: string) {
  await admin.from("escrow_transactions").update({ status: "held" }).eq("id", escrowId).eq("status", "refunded");
}

/**
 * Return the brand's charge only after THIS call flips escrow from held to
 * refunded. If Paystack refuses the refund, the row goes back to held and the
 * caller gets an error. Nothing is marked refunded on a failed API call.
 */
export async function refundHeldGig(admin: Admin, gigId: string, memo?: string): Promise<SettleResult> {
  const { data: gig } = await admin.from("gigs").select("id, brand_id, title, price_naira, fee_naira, tax_naira").eq("id", gigId).maybeSingle();
  if (!gig) return { error: "Gig not found." };

  const { data: esc } = await admin
    .from("escrow_transactions")
    .update({ status: "refunded" })
    .eq("gig_id", gigId)
    .eq("status", "held")
    .select("id, provider_ref")
    .maybeSingle();
  if (!esc) return { error: "No held escrow to refund (already released or refunded)." };

  const total = brandCharge(gig.price_naira, gig.fee_naira ?? feeFor(gig.price_naira), gig.tax_naira ?? 0);
  if (paystackConfigured()) {
    if (!esc.provider_ref) {
      await revertEscrowToHeld(admin, esc.id);
      return { error: "This charge has no Paystack reference, so it was not marked refunded." };
    }
    try {
      await createRefund({ reference: esc.provider_ref, amountNaira: total, reason: memo ?? `UGCOrigin refund, ${gig.title}` });
    } catch (e) {
      await revertEscrowToHeld(admin, esc.id);
      return { error: e instanceof Error ? e.message : "Paystack refused the refund. Escrow is still held." };
    }
  }

  await admin.from("ledger_entries").insert({
    gig_id: gigId,
    escrow_id: esc.id,
    user_id: gig.brand_id,
    entry_type: "refund",
    amount_naira: total,
    memo: paystackConfigured() ? (memo ?? "Refunded to brand via Paystack") : "Refund recorded. Paystack is not configured, so return the charge manually.",
  });
  await admin.from("gigs").update({ status: "cancelled" }).eq("id", gigId);
  return { ok: true, refundStarted: paystackConfigured() };
}

/**
 * Resolve an open dispute. Claims the dispute row first so a second click does
 * nothing. Moves money only through releaseHeldGig / refundHeldGig.
 */
export async function settleDispute(
  admin: Admin,
  args: {
    disputeId: string;
    actorId: string;
    resolution: DisputeResolution;
    note: string;
    partialToCreatorNaira?: number;
  },
): Promise<SettleResult> {
  const { data: dispute } = await admin
    .from("disputes")
    .update({ status: "under_review", resolution: args.note.trim() || null, resolved_by: args.actorId })
    .eq("id", args.disputeId)
    .eq("status", "open")
    .select("id, gig_id")
    .maybeSingle();
  if (!dispute) return { error: "That dispute is not open." };

  const { data: gig } = await admin.from("gigs").select("id, price_naira, title, creator_id, brand_id").eq("id", dispute.gig_id).maybeSingle();
  if (!gig) {
    await admin.from("disputes").update({ status: "open" }).eq("id", dispute.id).eq("status", "under_review");
    return { error: "Gig not found." };
  }

  const shares = disputeShares(gig.price_naira, args.resolution, args.partialToCreatorNaira);
  const finalStatus =
    args.resolution === "release" ? "resolved_release" : args.resolution === "refund" ? "resolved_refund" : "resolved_partial";

  const restore = async () => {
    await admin.from("disputes").update({ status: "open", resolution: null, resolved_by: null }).eq("id", dispute.id).eq("status", "under_review");
  };

  if (shares.toCreator === 0) {
    const refunded = await refundHeldGig(admin, gig.id, `Dispute refund, ${gig.title}`);
    if (!refunded.ok) {
      await restore();
      return refunded;
    }
  } else if (shares.toBrand === 0) {
    const released = await releaseHeldGig(admin, gig.id, { memo: `Dispute release, ${gig.title}` });
    if (!released.ok) {
      await restore();
      return released;
    }
  } else {
    const { data: esc } = await admin
      .from("escrow_transactions")
      .update({ status: "released" })
      .eq("gig_id", gig.id)
      .eq("status", "held")
      .select("id, provider_ref")
      .maybeSingle();
    if (!mayTransfer(!!esc)) {
      await restore();
      return { error: "Escrow is not held, so the split was not paid." };
    }
    if (paystackConfigured()) {
      if (!esc!.provider_ref) {
        await admin.from("escrow_transactions").update({ status: "held" }).eq("id", esc!.id).eq("status", "released");
        await restore();
        return { error: "This charge has no Paystack reference, so the split was not paid." };
      }
      try {
        await createRefund({
          reference: esc!.provider_ref,
          amountNaira: shares.toBrand,
          reason: `Dispute split refund, ${gig.title}`,
        });
      } catch (e) {
        await admin.from("escrow_transactions").update({ status: "held" }).eq("id", esc!.id).eq("status", "released");
        await restore();
        return { error: e instanceof Error ? e.message : "Paystack refused the brand's share. Nothing was paid." };
      }
    }
    await admin.from("gigs").update({ status: "completed" }).eq("id", gig.id);
    await admin.from("ledger_entries").insert([
      { gig_id: gig.id, escrow_id: esc!.id, user_id: gig.creator_id, entry_type: "release", amount_naira: shares.toCreator, memo: "Dispute: creator share" },
      { gig_id: gig.id, escrow_id: esc!.id, user_id: gig.brand_id, entry_type: "refund", amount_naira: shares.toBrand, memo: "Dispute: brand share" },
    ]);
    try {
      await queueCreatorPayout(admin, {
        creatorId: gig.creator_id,
        gigId: gig.id,
        amountNaira: shares.toCreator,
        title: gig.title,
        reason: `UGCOrigin dispute payout, ${gig.title}`,
      });
    } catch {
      // Escrow is released and the brand share was refunded. The creator payout
      // stays pending for a retry. Do not reopen the dispute.
    }
  }

  await admin.from("disputes").update({ status: finalStatus }).eq("id", dispute.id);
  return { ok: true };
}

/**
 * Pay a campaign submission once. The submission must still be `submitted`, and
 * the pool update must match the spent figure we read. A lost race is reverted.
 */
export async function payCampaignSubmission(
  admin: Admin,
  submissionId: string,
  approvedViews: number,
): Promise<SettleResult & { payout?: number; campaignId?: string; creatorId?: string; title?: string }> {
  const { data: sub } = await admin
    .from("campaign_submissions")
    .select("id, campaign_id, creator_id, status")
    .eq("id", submissionId)
    .maybeSingle();
  if (!sub) return { error: "Submission not found." };
  if (sub.status === "paid") return { ok: true };
  if (sub.status !== "submitted") return { error: "This submission can no longer be paid." };

  const { data: c } = await admin
    .from("campaigns")
    .select("id, title, pool_naira, spent_naira, rate_per_1000_naira")
    .eq("id", sub.campaign_id)
    .maybeSingle();
  if (!c) return { error: "Campaign not found." };

  const views = Math.max(0, Math.round(approvedViews || 0));
  const payout = campaignPayoutNaira(c.pool_naira, c.spent_naira, views, c.rate_per_1000_naira);
  if (payout <= 0) return { error: "No pool left, or views too low to pay." };

  const { data: claimed } = await admin
    .from("campaign_submissions")
    .update({ approved_views: views, payout_naira: payout, status: "paid" })
    .eq("id", submissionId)
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();
  if (!claimed) return { error: "This submission was just decided. Refresh and try again." };

  const newSpent = c.spent_naira + payout;
  const { data: pool } = await admin
    .from("campaigns")
    .update({ spent_naira: newSpent, status: newSpent >= c.pool_naira ? "completed" : "open" })
    .eq("id", c.id)
    .eq("spent_naira", c.spent_naira)
    .select("id")
    .maybeSingle();
  if (!pool) {
    await admin
      .from("campaign_submissions")
      .update({ status: "submitted", approved_views: null, payout_naira: null })
      .eq("id", submissionId)
      .eq("status", "paid");
    return { error: "The pool changed while this was paying. Nothing was sent. Try again." };
  }

  await admin.from("ledger_entries").insert({
    user_id: sub.creator_id,
    entry_type: "payout",
    amount_naira: payout,
    memo: `Per-view payout, ${c.title}`,
  });
  try {
    await queueCreatorPayout(admin, {
      creatorId: sub.creator_id,
      gigId: null,
      amountNaira: payout,
      title: c.title,
      reason: `UGCOrigin campaign payout, ${c.title}`,
    });
  } catch {
    // Pool is spent and the payout row is pending. A retry can send it.
  }
  return { ok: true, payout, campaignId: c.id, creatorId: sub.creator_id, title: c.title };
}

/** Refund a captured charge that did not bind to a gig, pool, boost, or subscription. */
export async function refundStrayCharge(reference: string, reason: string): Promise<boolean> {
  if (!paystackConfigured() || !reference) return false;
  try {
    await createRefund({ reference, reason });
    return true;
  } catch {
    return false;
  }
}
