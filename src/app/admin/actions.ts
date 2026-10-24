"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardWrite, type AdminRole } from "@/lib/admin/rbac";
import { paystackConfigured, initiateTransfer, createRefund } from "@/lib/payments/paystack";
import { feeFor } from "@/lib/fees";
import { placeCreator } from "@/lib/tiering/placement";
import { notifyUser } from "@/lib/notify";
import { logAudit } from "@/lib/admin/audit";

type Res = { error?: string; ok?: boolean };

// ---- Verification ----------------------------------------------------------
export async function adminSetIdentityVerified(creatorId: string, verified: boolean): Promise<Res> {
  const { ctx, error } = await guardWrite("verification");
  if (error) return { error };
  const admin = createAdminClient();
  // On verification: mark verified, flip the badge, and push the profile LIVE
  // automatically (as promised). Un-verifying reverts status to pending.
  const patch = verified
    ? { identity_verified: true, verification_status: "verified", is_live: true }
    : { identity_verified: false, verification_status: "pending" };
  const { error: e } = await admin.from("creator_profiles").update(patch).eq("id", creatorId);
  if (e) return { error: e.message };

  if (verified) {
    try {
      await placeCreator(creatorId); // place on the tier ladder now they're live
    } catch {
      /* tier engine optional */
    }
    await notifyUser(admin, creatorId, {
      type: "product",
      title: "You're verified — your profile is live 🎉",
      body: "Your identity is verified and your profile is now live in the directory. Brands can find and hire you. Add your bank details to receive payouts.",
      href: "/dashboard",
      ctaLabel: "View your dashboard",
    });
  }

  await logAudit(admin, ctx!.userId, "creator.identity_verified", { targetType: "creator", targetId: creatorId, after: { verified } });
  revalidatePath("/admin/verification");
  revalidatePath("/admin/users");
  return { ok: true };
}

/**
 * Approve a manual identity submission (selfie + NIN). Flips the identity badge
 * AND the photo_verified gate, marks the submission approved, and pushes the
 * profile live (as promised). This is the manual-review counterpart to the
 * automated KYC webhook.
 */
export async function adminApproveIdentity(creatorId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("verification");
  if (error) return { error };
  const admin = createAdminClient();

  // Require a selfie on file before approving — no going live without a photo.
  const { data: sub } = await admin
    .from("identity_submissions")
    .select("selfie_ref")
    .eq("user_id", creatorId)
    .maybeSingle();
  if (!sub?.selfie_ref) return { error: "This creator hasn't submitted a photo yet." };

  const { error: pe } = await admin
    .from("creator_profiles")
    .update({ identity_verified: true, photo_verified: true, verification_status: "verified", is_live: true })
    .eq("id", creatorId);
  if (pe) return { error: pe.message };

  await admin
    .from("identity_submissions")
    .update({ status: "approved", reject_reason: null, reviewed_at: new Date().toISOString(), reviewer_id: ctx!.userId })
    .eq("user_id", creatorId);
  await admin
    .from("verifications")
    .update({ status: "verified" })
    .eq("user_id", creatorId)
    .eq("kind", "identity");

  try {
    await placeCreator(creatorId);
  } catch {
    /* tier engine optional */
  }
  await notifyUser(admin, creatorId, {
    type: "product",
    title: "You're verified — your profile is live 🎉",
    body: "Your identity is verified and your profile is now live in the directory. Brands can find and hire you. Add your bank details to receive payouts.",
    href: "/dashboard",
    ctaLabel: "View your dashboard",
  });

  await logAudit(admin, ctx!.userId, "creator.identity_approved", { targetType: "creator", targetId: creatorId });
  revalidatePath("/admin/verification");
  revalidatePath("/admin/users");
  return { ok: true };
}

/** Reject a manual identity submission with a reviewer note (the creator can
 *  resubmit). Never touches identity_verified — a rejected creator was never live. */
export async function adminRejectIdentity(creatorId: string, reason: string): Promise<Res> {
  const { ctx, error } = await guardWrite("verification");
  if (error) return { error };
  const note = reason.trim();
  if (!note) return { error: "Add a short reason so the creator knows what to fix." };
  const admin = createAdminClient();

  const { error: se } = await admin
    .from("identity_submissions")
    .update({ status: "rejected", reject_reason: note.slice(0, 300), reviewed_at: new Date().toISOString(), reviewer_id: ctx!.userId })
    .eq("user_id", creatorId);
  if (se) return { error: se.message };

  await admin.from("creator_profiles").update({ verification_status: "rejected" }).eq("id", creatorId);
  await admin.from("verifications").update({ status: "rejected" }).eq("user_id", creatorId).eq("kind", "identity");

  await notifyUser(admin, creatorId, {
    type: "product",
    title: "Identity check needs another look",
    body: `We couldn't approve your identity submission: ${note.slice(0, 160)}. Please resubmit from your Go-live page.`,
    href: "/verify",
    ctaLabel: "Resubmit",
  });

  await logAudit(admin, ctx!.userId, "creator.identity_rejected", { targetType: "creator", targetId: creatorId, after: { reason: note.slice(0, 300) } });
  revalidatePath("/admin/verification");
  return { ok: true };
}

export async function adminSetLive(creatorId: string, live: boolean): Promise<Res> {
  const { ctx, error } = await guardWrite("verification");
  if (error) return { error };
  const admin = createAdminClient();
  const { error: e } = await admin.from("creator_profiles").update({ is_live: live }).eq("id", creatorId);
  if (e) return { error: e.message };
  // When an admin sets a creator live, place them on the tier ladder too.
  if (live) await placeCreator(creatorId);
  await logAudit(admin, ctx!.userId, "creator.set_live", { targetType: "creator", targetId: creatorId, after: { live } });
  revalidatePath("/admin/verification");
  revalidatePath("/admin/users");
  return { ok: true };
}

/**
 * Record a creator's VERIFIED external credibility (followers + prior-work
 * score) after a reviewer has checked the evidence. Writing entry_signals fires
 * the EPS trigger → recomputes placement/tier. This is the manual path that
 * unblocks the "external credibility head start" until a follower-API lands.
 */
export async function adminSetEntrySignals(
  creatorId: string,
  input: { verifiedFollowers: number; priorWorkScore: number },
): Promise<Res> {
  const { ctx, error } = await guardWrite("verification");
  if (error) return { error };

  const followers = Math.max(0, Math.round(input.verifiedFollowers || 0));
  const prior = Math.max(0, Math.min(100, Math.round(input.priorWorkScore || 0)));

  const admin = createAdminClient();
  // Preserve the computed signals (portfolio/niche demand) that placeCreator owns.
  const { data: existing } = await admin
    .from("entry_signals")
    .select("portfolio_count, niche_demand_score")
    .eq("creator_id", creatorId)
    .maybeSingle();

  const { error: e } = await admin.from("entry_signals").upsert(
    {
      creator_id: creatorId,
      verified_followers: followers,
      prior_work_score: prior,
      portfolio_count: existing?.portfolio_count ?? 0,
      niche_demand_score: existing?.niche_demand_score ?? 55,
    },
    { onConflict: "creator_id" },
  );
  if (e) return { error: e.message };

  await logAudit(admin, ctx!.userId, "creator.entry_signals", {
    targetType: "creator",
    targetId: creatorId,
    after: { verified_followers: followers, prior_work_score: prior },
  });
  revalidatePath("/admin/verification");
  return { ok: true };
}

// ---- Users -----------------------------------------------------------------
export async function adminSetFeatured(creatorId: string, featured: boolean): Promise<Res> {
  const { ctx, error } = await guardWrite("users");
  if (error) return { error };
  const admin = createAdminClient();
  const { error: e } = await admin.from("creator_profiles").update({ featured }).eq("id", creatorId);
  if (e) return { error: e.message };
  await logAudit(admin, ctx!.userId, "creator.featured", { targetType: "creator", targetId: creatorId, after: { featured } });
  revalidatePath("/admin/users");
  return { ok: true };
}

// ---- Finance: escrow + payouts --------------------------------------------
export async function adminReleaseEscrow(gigId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("finance");
  if (error) return { error };
  const admin = createAdminClient();

  const { data: gig } = await admin.from("gigs").select("id, creator_id, title, price_naira, status").eq("id", gigId).maybeSingle();
  if (!gig) return { error: "Gig not found." };
  if (gig.status === "completed") return { error: "This gig is already completed." };

  // Compare-and-swap: only the call that flips the gig completes the release,
  // so a double-click can't double-pay. Mirrors the brand-side approve path.
  const { data: claimed } = await admin
    .from("gigs")
    .update({ status: "completed" })
    .eq("id", gigId)
    .neq("status", "completed")
    .select("id")
    .maybeSingle();
  if (!claimed) return { error: "This gig was just completed." };

  // Release escrow only from a held state.
  const { data: esc } = await admin
    .from("escrow_transactions")
    .update({ status: "released" })
    .eq("gig_id", gigId)
    .eq("status", "held")
    .select("id")
    .maybeSingle();
  await admin.from("ledger_entries").insert([
    { gig_id: gigId, escrow_id: esc?.id, user_id: gig.creator_id, entry_type: "release", amount_naira: gig.price_naira, memo: "Admin released escrow" },
    { gig_id: gigId, escrow_id: esc?.id, user_id: gig.creator_id, entry_type: "payout", amount_naira: gig.price_naira, memo: "Admin queued payout" },
  ]);

  const { data: creator } = await admin.from("creator_profiles").select("payout_recipient_code").eq("id", gig.creator_id).maybeSingle();

  // One payout per gig (also DB-enforced by payouts_gig_id_unique).
  const { data: existingPayout } = await admin.from("payouts").select("id, status").eq("gig_id", gigId).maybeSingle();
  const { data: payout } = existingPayout
    ? { data: existingPayout }
    : await admin
        .from("payouts")
        .insert({ creator_id: gig.creator_id, gig_id: gigId, provider: "paystack", amount_naira: gig.price_naira, status: "pending" })
        .select("id, status")
        .single();

  if (paystackConfigured() && creator?.payout_recipient_code && payout && payout.status === "pending") {
    try {
      const t = await initiateTransfer({ amountNaira: gig.price_naira, recipientCode: creator.payout_recipient_code, reason: `UGCOrigin payout, ${gig.title}`, reference: `pay_${payout.id}` });
      await admin.from("payouts").update({ status: "processing", provider_ref: t.reference }).eq("id", payout.id);
    } catch {
      /* leave pending for manual retry */
    }
  }

  await logAudit(admin, ctx!.userId, "escrow.release", { targetType: "gig", targetId: gigId, after: { amount_naira: gig.price_naira, payout_id: payout?.id ?? null } });
  revalidatePath("/admin/finance");
  return { ok: true };
}

export async function adminRefundEscrow(gigId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("finance");
  if (error) return { error };
  const admin = createAdminClient();
  const { data: gig } = await admin.from("gigs").select("id, brand_id, title, price_naira, status").eq("id", gigId).maybeSingle();
  if (!gig) return { error: "Gig not found." };

  // Release escrow only from a held state — don't refund money already paid out.
  const { data: esc } = await admin
    .from("escrow_transactions")
    .update({ status: "refunded" })
    .eq("gig_id", gigId)
    .eq("status", "held")
    .select("id, provider_ref")
    .maybeSingle();
  if (!esc) return { error: "No held escrow to refund (already released or refunded)." };

  const total = gig.price_naira + feeFor(gig.price_naira);

  // Actually return the money to the brand via Paystack (not just a ledger note).
  let refundStarted = false;
  if (paystackConfigured() && esc.provider_ref) {
    try {
      await createRefund({ reference: esc.provider_ref, amountNaira: total, reason: `UGCOrigin refund, ${gig.title}` });
      refundStarted = true;
    } catch {
      /* fall back to a manual refund; the ledger + audit still record intent */
    }
  }

  await admin.from("ledger_entries").insert({ gig_id: gigId, escrow_id: esc.id, user_id: gig.brand_id, entry_type: "refund", amount_naira: total, memo: refundStarted ? "Admin refunded brand (Paystack)" : "Admin refund — manual return pending" });
  await admin.from("gigs").update({ status: "cancelled" }).eq("id", gigId);
  await notifyUser(admin, gig.brand_id, {
    type: "gig_update",
    title: "Your payment was refunded",
    body: `"${gig.title}" was cancelled and ₦${total.toLocaleString("en-NG")} is being returned to your original payment method.`,
    href: `/gigs/${gigId}`,
    ctaLabel: "View the gig",
  });

  await logAudit(admin, ctx!.userId, "escrow.refund", { targetType: "gig", targetId: gigId, after: { amount_naira: total, refund_started: refundStarted } });
  revalidatePath("/admin/finance");
  return { ok: true };
}

export async function adminMarkPayoutPaid(payoutId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("finance");
  if (error) return { error };
  const admin = createAdminClient();
  const { error: e } = await admin.from("payouts").update({ status: "paid" }).eq("id", payoutId).neq("status", "paid");
  if (e) return { error: e.message };
  await logAudit(admin, ctx!.userId, "payout.mark_paid", { targetType: "payout", targetId: payoutId });
  revalidatePath("/admin/finance");
  return { ok: true };
}

/** Re-attempt a stuck/failed creator payout (e.g. after fixing bank details). */
export async function adminRetryPayout(payoutId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("finance");
  if (error) return { error };
  const admin = createAdminClient();

  const { data: payout } = await admin.from("payouts").select("id, creator_id, amount_naira, status, retries").eq("id", payoutId).maybeSingle();
  if (!payout) return { error: "Payout not found." };
  if (payout.status === "paid") return { error: "This payout is already paid." };
  if (payout.status === "processing") return { error: "This payout is already in progress." };
  if (!paystackConfigured()) return { error: "Paystack is not configured." };

  const { data: creator } = await admin.from("creator_profiles").select("payout_recipient_code").eq("id", payout.creator_id).maybeSingle();
  if (!creator?.payout_recipient_code) return { error: "Creator has no verified payout account yet." };

  try {
    const t = await initiateTransfer({
      amountNaira: payout.amount_naira,
      recipientCode: creator.payout_recipient_code,
      reason: "UGCOrigin payout retry",
      reference: `pay_${payout.id}`,
    });
    await admin
      .from("payouts")
      .update({ status: "processing", provider_ref: t.reference, retries: (payout.retries ?? 0) + 1 })
      .eq("id", payout.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start the transfer." };
  }

  await logAudit(admin, ctx!.userId, "payout.retry", { targetType: "payout", targetId: payoutId, after: { amount_naira: payout.amount_naira } });
  revalidatePath("/admin/finance");
  return { ok: true };
}

// ---- Roles -----------------------------------------------------------------
export async function adminAddAdmin(email: string, role: AdminRole): Promise<Res> {
  const { ctx, error } = await guardWrite("roles");
  if (error) return { error };
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
  if (!profile) return { error: "No user with that email (they must sign up first)." };
  const { error: e } = await admin.from("admin_users").upsert({ user_id: profile.id, role }, { onConflict: "user_id" });
  if (e) return { error: e.message };
  await logAudit(admin, ctx!.userId, "admin.add", { targetType: "admin_user", targetId: profile.id, after: { role } });
  revalidatePath("/admin/roles");
  return { ok: true };
}

export async function adminSetRole(userId: string, role: AdminRole): Promise<Res> {
  const { ctx, error } = await guardWrite("roles");
  if (error) return { error };
  const admin = createAdminClient();
  const { data: prev } = await admin.from("admin_users").select("role").eq("user_id", userId).maybeSingle();
  const { error: e } = await admin.from("admin_users").update({ role }).eq("user_id", userId);
  if (e) return { error: e.message };
  await logAudit(admin, ctx!.userId, "admin.role_change", { targetType: "admin_user", targetId: userId, before: prev ?? null, after: { role } });
  revalidatePath("/admin/roles");
  return { ok: true };
}

export async function adminRemoveAdmin(userId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("roles");
  if (error) return { error };
  if (ctx && ctx.userId === userId) return { error: "You can't remove yourself." };
  const admin = createAdminClient();
  const { error: e } = await admin.from("admin_users").delete().eq("user_id", userId);
  if (e) return { error: e.message };
  await logAudit(admin, ctx!.userId, "admin.remove", { targetType: "admin_user", targetId: userId });
  revalidatePath("/admin/roles");
  return { ok: true };
}
