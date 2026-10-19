"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardWrite } from "@/lib/admin/rbac";

type Res = { ok?: boolean; error?: string };
type Admin = ReturnType<typeof createAdminClient>;

async function markResolved(admin: Admin, reportId: string, actorId: string, status: "actioned" | "dismissed", resolution: string) {
  await admin
    .from("reports")
    .update({ status, resolution, resolved_by: actorId, resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  await admin.from("audit_log").insert({
    actor_id: actorId,
    action: `report.${status === "dismissed" ? "dismiss" : "action"}`,
    target_type: "report",
    target_id: reportId,
    after: { status, resolution },
  });
}

async function loadReport(admin: Admin, reportId: string) {
  const { data } = await admin.from("reports").select("id, target_type, target_id, status").eq("id", reportId).maybeSingle();
  return data;
}

export async function dismissReport(reportId: string, note: string): Promise<Res> {
  const { ctx, error } = await guardWrite("moderation");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  const admin = createAdminClient();
  await markResolved(admin, reportId, ctx.userId, "dismissed", note.trim() || "No action needed.");
  revalidatePath("/admin/moderation");
  return { ok: true };
}

/** Take a reported creator profile offline (is_live = false). */
export async function takedownProfile(reportId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("moderation");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  const admin = createAdminClient();
  const r = await loadReport(admin, reportId);
  if (!r || r.target_type !== "profile") return { error: "Not a profile report." };

  const { error: e } = await admin.from("creator_profiles").update({ is_live: false }).eq("id", r.target_id);
  if (e) return { error: e.message };
  await admin.from("audit_log").insert({ actor_id: ctx.userId, action: "moderation.profile_takedown", target_type: "creator_profile", target_id: r.target_id, after: { is_live: false } });
  await markResolved(admin, reportId, ctx.userId, "actioned", "Profile taken offline.");
  revalidatePath("/admin/moderation");
  return { ok: true };
}

/** Delete a reported review and recompute the subject's standing. */
export async function removeReview(reportId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("moderation");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  const admin = createAdminClient();
  const r = await loadReport(admin, reportId);
  if (!r || r.target_type !== "review") return { error: "Not a review report." };

  const { data: review } = await admin.from("reviews").select("subject_id").eq("id", r.target_id).maybeSingle();
  const { error: e } = await admin.from("reviews").delete().eq("id", r.target_id);
  if (e) return { error: e.message };
  // Recompute the reviewed creator's metrics/tier (trigger only fires on insert).
  if (review?.subject_id) {
    try {
      await admin.rpc("recompute_creator_tier", { cid: review.subject_id });
    } catch {
      /* tier engine may not be applied yet */
    }
  }
  await admin.from("audit_log").insert({ actor_id: ctx.userId, action: "moderation.review_removed", target_type: "review", target_id: r.target_id, after: null });
  await markResolved(admin, reportId, ctx.userId, "actioned", "Review removed.");
  revalidatePath("/admin/moderation");
  return { ok: true };
}

/** Issue a trust strike to a creator (auto-benches at 3+). Lowers ranking. */
export async function issueStrike(creatorId: string, note: string): Promise<Res> {
  const { ctx, error } = await guardWrite("moderation");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  const admin = createAdminClient();
  const { data: cur } = await admin.from("creator_profiles").select("strikes").eq("id", creatorId).maybeSingle();
  if (!cur) return { error: "Creator not found." };
  const strikes = (cur.strikes ?? 0) + 1;
  const benched = strikes >= 3;
  const { error: e } = await admin
    .from("creator_profiles")
    .update({ strikes, benched, strike_note: note.trim() || null })
    .eq("id", creatorId);
  if (e) return { error: e.message };
  await admin.from("audit_log").insert({ actor_id: ctx.userId, action: "moderation.strike_issued", target_type: "creator_profile", target_id: creatorId, after: { strikes, benched } });
  await admin.from("notifications").insert({
    user_id: creatorId,
    type: "ai_warning",
    title: benched ? "Your profile has been benched" : "You received a trust strike",
    body: benched
      ? "Repeated trust issues have benched your profile, so it ranks last in search. Contact support to resolve it."
      : "A trust strike was added to your account. It lowers your search ranking. Keep deals on-platform and honour agreements to recover.",
    href: "/dashboard",
  });
  revalidatePath("/admin/moderation");
  return { ok: true };
}

/** Clear a creator's strikes + un-bench them. */
export async function clearStrikes(creatorId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("moderation");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  const admin = createAdminClient();
  const { error: e } = await admin
    .from("creator_profiles")
    .update({ strikes: 0, benched: false, strike_note: null })
    .eq("id", creatorId);
  if (e) return { error: e.message };
  await admin.from("audit_log").insert({ actor_id: ctx.userId, action: "moderation.strikes_cleared", target_type: "creator_profile", target_id: creatorId, after: { strikes: 0, benched: false } });
  revalidatePath("/admin/moderation");
  return { ok: true };
}

/** Forfeit a reported campaign submission (removes it from payout + marks it). */
export async function removeSubmission(reportId: string): Promise<Res> {
  const { ctx, error } = await guardWrite("moderation");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  const admin = createAdminClient();
  const r = await loadReport(admin, reportId);
  if (!r || r.target_type !== "campaign_submission") return { error: "Not a submission report." };

  const { error: e } = await admin
    .from("campaign_submissions")
    .update({ status: "forfeited", forfeit_reason: "Removed by moderation" })
    .eq("id", r.target_id);
  if (e) return { error: e.message };
  await admin.from("audit_log").insert({ actor_id: ctx.userId, action: "moderation.submission_forfeited", target_type: "campaign_submission", target_id: r.target_id, after: { status: "forfeited" } });
  await markResolved(admin, reportId, ctx.userId, "actioned", "Submission forfeited.");
  revalidatePath("/admin/moderation");
  return { ok: true };
}
