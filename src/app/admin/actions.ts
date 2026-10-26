"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardWrite, type AdminRole } from "@/lib/admin/rbac";
import { paystackConfigured, initiateTransfer } from "@/lib/payments/paystack";
import { feeFor } from "@/lib/fees";
import { refundHeldGig, releaseHeldGig } from "@/lib/payments/settle";
import { placeCreator } from "@/lib/tiering/placement";
import { notifyUser, notifyMany } from "@/lib/notify";
import { logAudit } from "@/lib/admin/audit";
import { requiresDualControl } from "@/lib/admin/security";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import { creatorApprovedEmail } from "@/lib/email/templates";
import { formatNaira } from "@/lib/utils";

type Admin = ReturnType<typeof createAdminClient>;
type Res = { error?: string; ok?: boolean; pendingApproval?: boolean };

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
    // In-app notification (always), plus a dedicated welcome/approval email that
    // bypasses the product-update preference — being verified is a milestone we
    // always want to confirm. skipEmail avoids a duplicate generic email.
    await notifyUser(admin, creatorId, {
      type: "product",
      title: "You're verified — your profile is live 🎉",
      body: "Your identity is verified and your profile is now live in the directory. Brands can find and hire you. Add your bank details to receive payouts.",
      href: "/dashboard",
      ctaLabel: "View your dashboard",
      skipEmail: true,
    });
    if (emailConfigured()) {
      const [{ data: profile }, { data: cp }] = await Promise.all([
        admin.from("profiles").select("email").eq("id", creatorId).maybeSingle(),
        admin.from("creator_profiles").select("display_name, handle").eq("id", creatorId).maybeSingle(),
      ]);
      if (profile?.email) {
        await sendEmail(creatorApprovedEmail(profile.email, { name: cp?.display_name, handle: cp?.handle }));
      }
    }
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
  const { error: e } = await admin.from("creator_profiles").update({ is_live: live, ...(live ? { suspended: false } : {}) }).eq("id", creatorId);
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
//
// Release/refund move real money. For amounts at/above the dual-control threshold
// (see @/lib/admin/security) a single admin may NOT move the money: they file a
// request in `release_approvals` and a SECOND, DISTINCT finance/super_admin must
// approve before the transfer executes (the initiator cannot self-approve). Below
// the threshold the one-step path is kept. The execute* cores below hold the
// idempotent money logic and are called either directly (small amounts) or by the
// approval action (large amounts) — never twice for the same gig thanks to the
// compare-and-swaps on gig/escrow status.

/** Actually release escrow → ledger + one payout. Audits as the given actor. */
async function executeRelease(admin: Admin, gigId: string, actorId: string): Promise<Res> {
  const released = await releaseHeldGig(admin, gigId, { memo: "Admin released escrow" });
  if (!released.ok) return { error: released.error ?? "Could not release escrow." };
  await logAudit(admin, actorId, "escrow.release", { targetType: "gig", targetId: gigId, after: { payout_queued: !!released.payoutQueued } });
  return { ok: true };
}

/** Actually refund escrow via Paystack. Audits as the given actor. */
async function executeRefund(admin: Admin, gigId: string, actorId: string): Promise<Res> {
  const { data: gig } = await admin.from("gigs").select("id, brand_id, title, price_naira").eq("id", gigId).maybeSingle();
  if (!gig) return { error: "Gig not found." };
  const refunded = await refundHeldGig(admin, gigId, `Admin refund, ${gig.title}`);
  if (!refunded.ok) return { error: refunded.error ?? "Could not refund escrow." };
  const total = gig.price_naira + feeFor(gig.price_naira);
  await notifyUser(admin, gig.brand_id, {
    type: "gig_update",
    title: refunded.refundStarted ? "Your payment was refunded" : "Refund recorded",
    body: refunded.refundStarted
      ? `"${gig.title}" was cancelled and ₦${total.toLocaleString("en-NG")} is being returned to your original payment method.`
      : `"${gig.title}" was cancelled. Paystack isn't connected here, so the ₦${total.toLocaleString("en-NG")} return has to be sent manually.`,
    href: `/gigs/${gigId}`,
    ctaLabel: "View the gig",
  });
  await logAudit(admin, actorId, "escrow.refund", { targetType: "gig", targetId: gigId, after: { amount_naira: total, refund_started: !!refunded.refundStarted } });
  return { ok: true };
}

/** Notify every OTHER eligible approver (finance / super_admin) that a request is waiting. */
async function notifyApprovers(admin: Admin, requesterId: string, summary: string): Promise<void> {
  const { data: admins } = await admin.from("admin_users").select("user_id, role").in("role", ["finance", "super_admin"]);
  const recipients = (admins ?? []).map((a) => a.user_id as string).filter((id) => id && id !== requesterId);
  if (recipients.length === 0) return;
  await notifyMany(
    admin,
    recipients.map((userId) => ({
      userId,
      payload: {
        // Not a preference-gated type → always delivered (security-critical).
        type: "admin_approval",
        title: "A large payment needs a second approval",
        body: `${summary} Another admin must approve it before the money moves.`,
        href: "/admin/finance",
        ctaLabel: "Review approvals",
      },
    })),
  );
}

/**
 * Create a pending dual-control request for a large release/refund. Idempotent on
 * (gig_id, kind) while pending (DB unique index) — a second click returns the
 * existing request instead of stacking duplicates.
 */
async function requestApproval(
  admin: Admin,
  requesterId: string,
  gig: { id: string; title: string },
  kind: "release" | "refund",
  amountNaira: number,
): Promise<Res> {
  const { data: existing } = await admin
    .from("release_approvals")
    .select("id")
    .eq("gig_id", gig.id)
    .eq("kind", kind)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    await logAudit(admin, requesterId, `escrow.${kind}_requested`, { targetType: "gig", targetId: gig.id, after: { amount_naira: amountNaira, approval_id: existing.id, duplicate: true } });
    revalidatePath("/admin/finance");
    return { ok: true, pendingApproval: true };
  }

  const { data: row, error: e } = await admin
    .from("release_approvals")
    .insert({ gig_id: gig.id, kind, amount_naira: amountNaira, requested_by: requesterId, status: "pending" })
    .select("id")
    .single();
  if (e || !row) return { error: e?.message ?? "Could not file the approval request." };

  await logAudit(admin, requesterId, `escrow.${kind}_requested`, { targetType: "gig", targetId: gig.id, after: { amount_naira: amountNaira, approval_id: row.id } });
  await notifyApprovers(admin, requesterId, `A ${kind} of ${formatNaira(amountNaira)} for "${gig.title}" is awaiting approval.`);
  revalidatePath("/admin/finance");
  return { ok: true, pendingApproval: true };
}

export async function adminReleaseEscrow(gigId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("finance");
  if (error) return { error };
  const admin = createAdminClient();

  const { data: gig } = await admin.from("gigs").select("id, title, price_naira, status").eq("id", gigId).maybeSingle();
  if (!gig) return { error: "Gig not found." };
  if (gig.status === "completed") return { error: "This gig is already completed." };

  // Large releases go through two-admin approval instead of moving money now.
  if (requiresDualControl(gig.price_naira)) {
    return requestApproval(admin, ctx!.userId, gig, "release", gig.price_naira);
  }
  const res = await executeRelease(admin, gigId, ctx!.userId);
  revalidatePath("/admin/finance");
  return res;
}

export async function adminRefundEscrow(gigId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("finance");
  if (error) return { error };
  const admin = createAdminClient();

  const { data: gig } = await admin.from("gigs").select("id, title, price_naira, status").eq("id", gigId).maybeSingle();
  if (!gig) return { error: "Gig not found." };
  const total = gig.price_naira + feeFor(gig.price_naira);

  // Large refunds go through two-admin approval instead of moving money now. Only
  // gate what we can still refund (a held escrow); let execute* surface the real
  // "nothing to refund" error below the threshold path.
  if (requiresDualControl(total)) {
    const { data: held } = await admin.from("escrow_transactions").select("id").eq("gig_id", gigId).eq("status", "held").maybeSingle();
    if (!held) return { error: "No held escrow to refund (already released or refunded)." };
    return requestApproval(admin, ctx!.userId, gig, "refund", total);
  }
  const res = await executeRefund(admin, gigId, ctx!.userId);
  revalidatePath("/admin/finance");
  return res;
}

/**
 * Second-admin approval of a pending large release/refund. Enforces that the
 * approver is a DISTINCT admin from the initiator, claims the request with a
 * compare-and-swap (so two simultaneous approvers can't both execute), then runs
 * the real money movement and marks the request executed. Audits the approval
 * (who/when/amount) on top of the execute core's own escrow.release/refund entry.
 */
export async function adminApproveRelease(approvalId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("finance");
  if (error) return { error };
  const admin = createAdminClient();

  const { data: req } = await admin
    .from("release_approvals")
    .select("id, gig_id, kind, amount_naira, status, requested_by")
    .eq("id", approvalId)
    .maybeSingle();
  if (!req) return { error: "Approval request not found." };
  if (req.status !== "pending") return { error: "This request has already been decided." };
  if (req.requested_by === ctx!.userId) return { error: "You can't approve your own request — a different admin must approve." };

  // Claim the request: only the approver who flips pending→approved proceeds.
  const { data: claimed } = await admin
    .from("release_approvals")
    .update({ status: "approved", approved_by: ctx!.userId, decided_at: new Date().toISOString() })
    .eq("id", approvalId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (!claimed) return { error: "This request was just decided by someone else." };

  await logAudit(admin, ctx!.userId, `escrow.${req.kind}_approved`, {
    targetType: "gig",
    targetId: req.gig_id,
    after: { approval_id: req.id, amount_naira: req.amount_naira, requested_by: req.requested_by },
  });

  const res = req.kind === "release"
    ? await executeRelease(admin, req.gig_id, ctx!.userId)
    : await executeRefund(admin, req.gig_id, ctx!.userId);

  if (res.error) {
    // Money didn't move — reopen the request so it isn't lost, and surface why.
    await admin.from("release_approvals").update({ status: "pending", approved_by: null, decided_at: null }).eq("id", approvalId);
    return { error: res.error };
  }

  await admin.from("release_approvals").update({ status: "executed", executed_at: new Date().toISOString() }).eq("id", approvalId);
  revalidatePath("/admin/finance");
  return { ok: true };
}

/** Reject a pending release/refund request (any finance/super_admin, incl. the initiator cancelling). */
export async function adminRejectRelease(approvalId: string, reason?: string): Promise<Res> {
  const { ctx, error } = await guardWrite("finance");
  if (error) return { error };
  const admin = createAdminClient();

  const { data: claimed } = await admin
    .from("release_approvals")
    .update({ status: "rejected", approved_by: ctx!.userId, decided_at: new Date().toISOString(), note: reason?.trim().slice(0, 300) || null })
    .eq("id", approvalId)
    .eq("status", "pending")
    .select("id, gig_id, kind, amount_naira")
    .maybeSingle();
  if (!claimed) return { error: "This request has already been decided." };

  await logAudit(admin, ctx!.userId, `escrow.${claimed.kind}_rejected`, {
    targetType: "gig",
    targetId: claimed.gig_id,
    after: { approval_id: claimed.id, amount_naira: claimed.amount_naira, reason: reason?.trim().slice(0, 300) ?? null },
  });
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
      reference: `pay_${payout.id}_r${(payout.retries ?? 0) + 1}`,
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

/** Count super_admins so we never demote/remove the last one (lockout guard). */
async function superAdminCount(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const { count } = await admin.from("admin_users").select("user_id", { count: "exact", head: true }).eq("role", "super_admin");
  return count ?? 0;
}

export async function adminSetRole(userId: string, role: AdminRole): Promise<Res> {
  const { ctx, error } = await guardWrite("roles");
  if (error) return { error };
  const admin = createAdminClient();
  const { data: prev } = await admin.from("admin_users").select("role").eq("user_id", userId).maybeSingle();
  if (!prev) return { error: "That admin no longer exists." };
  // Don't strip the final super_admin — it would lock everyone out of role management.
  if (prev.role === "super_admin" && role !== "super_admin" && (await superAdminCount(admin)) <= 1) {
    return { error: "Promote another super admin first — you can't remove the last one." };
  }
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
  const { data: prev } = await admin.from("admin_users").select("role").eq("user_id", userId).maybeSingle();
  if (prev?.role === "super_admin" && (await superAdminCount(admin)) <= 1) {
    return { error: "You can't remove the last super admin." };
  }
  const { error: e } = await admin.from("admin_users").delete().eq("user_id", userId);
  if (e) return { error: e.message };
  await logAudit(admin, ctx!.userId, "admin.remove", { targetType: "admin_user", targetId: userId, before: prev ?? null });
  revalidatePath("/admin/roles");
  return { ok: true };
}
