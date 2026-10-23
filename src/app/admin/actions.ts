"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardWrite, type AdminRole } from "@/lib/admin/rbac";
import { paystackConfigured, initiateTransfer } from "@/lib/payments/paystack";
import { feeFor } from "@/lib/fees";
import { placeCreator } from "@/lib/tiering/placement";
import { notifyUser } from "@/lib/notify";

type Res = { error?: string; ok?: boolean };

// ---- Verification ----------------------------------------------------------
export async function adminSetIdentityVerified(creatorId: string, verified: boolean): Promise<Res> {
  const { error } = await guardWrite("verification");
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

  revalidatePath("/admin/verification");
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function adminSetLive(creatorId: string, live: boolean): Promise<Res> {
  const { error } = await guardWrite("verification");
  if (error) return { error };
  const admin = createAdminClient();
  const { error: e } = await admin.from("creator_profiles").update({ is_live: live }).eq("id", creatorId);
  if (e) return { error: e.message };
  // When an admin sets a creator live, place them on the tier ladder too.
  if (live) await placeCreator(creatorId);
  revalidatePath("/admin/verification");
  revalidatePath("/admin/users");
  return { ok: true };
}

// ---- Users -----------------------------------------------------------------
export async function adminSetFeatured(creatorId: string, featured: boolean): Promise<Res> {
  const { error } = await guardWrite("users");
  if (error) return { error };
  const admin = createAdminClient();
  const { error: e } = await admin.from("creator_profiles").update({ featured }).eq("id", creatorId);
  if (e) return { error: e.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

// ---- Finance: escrow + payouts --------------------------------------------
export async function adminReleaseEscrow(gigId: string): Promise<Res> {
  const { error } = await guardWrite("finance");
  if (error) return { error };
  const admin = createAdminClient();

  const { data: gig } = await admin.from("gigs").select("id, creator_id, title, price_naira, status").eq("id", gigId).maybeSingle();
  if (!gig) return { error: "Gig not found." };

  const { data: esc } = await admin.from("escrow_transactions").update({ status: "released" }).eq("gig_id", gigId).select("id").maybeSingle();
  await admin.from("ledger_entries").insert([
    { gig_id: gigId, escrow_id: esc?.id, user_id: gig.creator_id, entry_type: "release", amount_naira: gig.price_naira, memo: "Admin released escrow" },
    { gig_id: gigId, escrow_id: esc?.id, user_id: gig.creator_id, entry_type: "payout", amount_naira: gig.price_naira, memo: "Admin queued payout" },
  ]);
  await admin.from("gigs").update({ status: "completed" }).eq("id", gigId);

  const { data: creator } = await admin.from("creator_profiles").select("payout_recipient_code").eq("id", gig.creator_id).maybeSingle();
  const { data: payout } = await admin
    .from("payouts")
    .insert({ creator_id: gig.creator_id, gig_id: gigId, provider: "paystack", amount_naira: gig.price_naira, status: "pending" })
    .select("id")
    .single();
  if (paystackConfigured() && creator?.payout_recipient_code && payout) {
    try {
      const t = await initiateTransfer({ amountNaira: gig.price_naira, recipientCode: creator.payout_recipient_code, reason: `UGCOrigin payout, ${gig.title}`, reference: `pay_${payout.id}` });
      await admin.from("payouts").update({ status: "processing", provider_ref: t.reference }).eq("id", payout.id);
    } catch {
      /* leave pending */
    }
  }
  revalidatePath("/admin/finance");
  return { ok: true };
}

export async function adminRefundEscrow(gigId: string): Promise<Res> {
  const { error } = await guardWrite("finance");
  if (error) return { error };
  const admin = createAdminClient();
  const { data: gig } = await admin.from("gigs").select("id, brand_id, price_naira").eq("id", gigId).maybeSingle();
  if (!gig) return { error: "Gig not found." };
  const { data: esc } = await admin.from("escrow_transactions").update({ status: "refunded" }).eq("gig_id", gigId).select("id").maybeSingle();
  await admin.from("ledger_entries").insert({ gig_id: gigId, escrow_id: esc?.id, user_id: gig.brand_id, entry_type: "refund", amount_naira: gig.price_naira + feeFor(gig.price_naira), memo: "Admin refunded brand" });
  await admin.from("gigs").update({ status: "cancelled" }).eq("id", gigId);
  revalidatePath("/admin/finance");
  return { ok: true };
}

export async function adminMarkPayoutPaid(payoutId: string): Promise<Res> {
  const { error } = await guardWrite("finance");
  if (error) return { error };
  const admin = createAdminClient();
  const { error: e } = await admin.from("payouts").update({ status: "paid" }).eq("id", payoutId);
  if (e) return { error: e.message };
  revalidatePath("/admin/finance");
  return { ok: true };
}

// ---- Roles -----------------------------------------------------------------
export async function adminAddAdmin(email: string, role: AdminRole): Promise<Res> {
  const { error } = await guardWrite("roles");
  if (error) return { error };
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
  if (!profile) return { error: "No user with that email (they must sign up first)." };
  const { error: e } = await admin.from("admin_users").upsert({ user_id: profile.id, role }, { onConflict: "user_id" });
  if (e) return { error: e.message };
  revalidatePath("/admin/roles");
  return { ok: true };
}

export async function adminSetRole(userId: string, role: AdminRole): Promise<Res> {
  const { error } = await guardWrite("roles");
  if (error) return { error };
  const admin = createAdminClient();
  const { error: e } = await admin.from("admin_users").update({ role }).eq("user_id", userId);
  if (e) return { error: e.message };
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
  revalidatePath("/admin/roles");
  return { ok: true };
}
