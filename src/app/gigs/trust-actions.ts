"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardWrite } from "@/lib/admin/rbac";
import { requiresDualControl } from "@/lib/admin/security";
import { disputeShares } from "@/lib/payments/money-math";
import { settleDispute } from "@/lib/payments/settle";
import { notifyUser, notifyMany } from "@/lib/notify";

async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ---- Reviews (two-way, verified-transaction only) --------------------------
export async function submitReviewAction(
  gigId: string,
  input: { speed: number; comms: number; quality: number; body: string },
): Promise<{ error?: string; ok?: boolean }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: gig } = await supabase
    .from("gigs")
    .select("id, brand_id, creator_id, status")
    .eq("id", gigId)
    .maybeSingle();
  if (!gig || (gig.brand_id !== user.id && gig.creator_id !== user.id)) return { error: "Not allowed." };
  if (gig.status !== "completed") return { error: "You can leave a review once the gig is completed." };

  const isBrand = gig.brand_id === user.id;
  const role = isBrand ? "brand" : "creator";
  const subjectId = isBrand ? gig.creator_id : gig.brand_id;

  const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n)));
  const { error } = await supabase.from("reviews").insert({
    gig_id: gigId,
    author_id: user.id,
    subject_id: subjectId,
    role,
    rating_speed: clamp(input.speed),
    rating_comms: clamp(input.comms),
    rating_quality: clamp(input.quality),
    body: input.body.trim() || null,
  });
  if (error) {
    if (error.code === "23505") return { error: "You've already reviewed this gig." };
    return { error: error.message };
  }

  // Keep the creator's public rating accurate (recompute aggregate).
  if (isBrand) {
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("reviews")
      .select("rating_speed, rating_comms, rating_quality")
      .eq("subject_id", subjectId);
    if (rows && rows.length) {
      const avg =
        rows.reduce((s, r) => s + (r.rating_speed + r.rating_comms + r.rating_quality) / 3, 0) / rows.length;
      await admin
        .from("creator_metrics")
        .upsert({ creator_id: subjectId, avg_rating: Math.round(avg * 100) / 100, review_count: rows.length }, { onConflict: "creator_id" });
    }
  }

  revalidatePath(`/gigs/${gigId}`);
  return { ok: true };
}

// ---- Disputes --------------------------------------------------------------
export async function openDisputeAction(gigId: string, reason: string): Promise<{ error?: string; ok?: boolean }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };
  if (!reason.trim()) return { error: "Tell us what went wrong." };

  const { data: gig } = await supabase
    .from("gigs")
    .select("id, brand_id, creator_id, status, title")
    .eq("id", gigId)
    .maybeSingle();
  if (!gig || (gig.brand_id !== user.id && gig.creator_id !== user.id)) return { error: "Not allowed." };
  if (["completed", "cancelled"].includes(gig.status)) return { error: "This gig can no longer be disputed." };

  const admin = createAdminClient();
  const { error } = await admin.from("disputes").insert({
    gig_id: gigId,
    opened_by: user.id,
    reason: reason.trim(),
    status: "open",
  });
  if (error) {
    if (error.code === "23505") return { error: "A dispute is already open for this gig." };
    return { error: error.message };
  }
  await admin.from("gigs").update({ status: "disputed" }).eq("id", gigId);

  const other = gig.brand_id === user.id ? gig.creator_id : gig.brand_id;
  await notifyUser(admin, other, {
    type: "dispute_opened",
    title: "A dispute was opened",
    body: `A dispute was opened on "${gig.title}". Our team will review it.`,
    href: `/gigs/${gigId}`,
    ctaLabel: "View the gig",
  });

  revalidatePath(`/gigs/${gigId}`);
  return { ok: true };
}

// ---- Admin mediation -------------------------------------------------------
export async function resolveDisputeAction(
  disputeId: string,
  resolution: "release" | "refund" | "partial",
  note: string,
  partialToCreatorNaira?: number,
): Promise<{ error?: string; ok?: boolean }> {
  const { ctx, error } = await guardWrite("disputes");
  if (error || !ctx) return { error: error ?? "Admin only." };

  const admin = createAdminClient();
  const { data: dispute } = await admin.from("disputes").select("id, gig_id, status").eq("id", disputeId).maybeSingle();
  if (!dispute) return { error: "Dispute not found." };
  if (dispute.status !== "open") return { error: "That dispute is not open." };

  const { data: gig } = await admin.from("gigs").select("id, brand_id, creator_id, title, price_naira").eq("id", dispute.gig_id).maybeSingle();
  if (!gig) return { error: "Gig not found." };

  const shares = disputeShares(gig.price_naira, resolution, partialToCreatorNaira);
  const moving = Math.max(shares.toCreator, shares.toBrand);
  if (requiresDualControl(moving)) {
    return { error: "This amount needs two finance admins. Use the finance console to release or refund the whole escrow." };
  }

  const settled = await settleDispute(admin, {
    disputeId,
    actorId: ctx.userId,
    resolution,
    note,
    partialToCreatorNaira,
  });
  if (!settled.ok) return { error: settled.error ?? "Could not settle the dispute." };

  await notifyMany(admin, [
    { userId: gig.creator_id, payload: { type: "dispute_resolved", title: "Dispute resolved", body: `The dispute on "${gig.title}" was resolved.`, href: `/gigs/${gig.id}` } },
    { userId: gig.brand_id, payload: { type: "dispute_resolved", title: "Dispute resolved", body: `The dispute on "${gig.title}" was resolved.`, href: `/gigs/${gig.id}` } },
  ]);

  revalidatePath("/admin/disputes");
  return { ok: true };
}
