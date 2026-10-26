"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardWrite } from "@/lib/admin/rbac";
import { notifyAdminsPendingReview, notifyUser } from "@/lib/notify";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import { brandApprovedEmail } from "@/lib/email/templates";

type Res = { ok?: boolean; error?: string };

/** Brand submits business details for verification. */
export async function submitBrandVerification(input: { companyName: string; rcNumber: string }): Promise<Res> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: "Backend not connected." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const company = input.companyName.trim();
  const rc = input.rcNumber.trim();
  if (!company) return { error: "Enter your registered business name." };
  if (rc.length < 4) return { error: "Enter your CAC/RC number." };

  // verification_status is a service-role-only gate column, so write via admin.
  const admin = createAdminClient();
  const { error } = await admin
    .from("brand_profiles")
    .update({ company_name: company, rc_number: rc, verification_status: "pending", verification_submitted_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: error.message };

  await notifyAdminsPendingReview(admin, {
    title: "Brand verification waiting",
    body: `${company} submitted a CAC/RC number for review.`,
    href: "/admin/verification",
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Admin: approve or reject a brand's verification. */
export async function reviewBrandVerification(brandId: string, decision: "verified" | "unverified", note: string): Promise<Res> {
  const { ctx, error } = await guardWrite("verification");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  const admin = createAdminClient();
  const { error: e } = await admin
    .from("brand_profiles")
    .update({ verification_status: decision, verification_note: note.trim() || null })
    .eq("id", brandId);
  if (e) return { error: e.message };

  await admin.from("audit_log").insert({ actor_id: ctx.userId, action: `brand.${decision === "verified" ? "verified" : "rejected"}`, target_type: "brand_profile", target_id: brandId, after: { verification_status: decision } });

  // In-app notification (always). On approval, skip the generic email and send
  // the dedicated welcome email instead; on rejection keep the generic email.
  await notifyUser(admin, brandId, {
    type: "product",
    title: decision === "verified" ? "Your brand is verified" : "Brand verification update",
    body: decision === "verified"
      ? "Your business is verified. Creators now see a Verified brand badge on your offers."
      : `We couldn't verify your business yet. ${note.trim() || "Please resubmit with a valid CAC/RC number."}`,
    href: "/settings",
    skipEmail: decision === "verified",
  });

  if (decision === "verified" && emailConfigured()) {
    const [{ data: profile }, { data: bp }] = await Promise.all([
      admin.from("profiles").select("email").eq("id", brandId).maybeSingle(),
      admin.from("brand_profiles").select("company_name").eq("id", brandId).maybeSingle(),
    ]);
    if (profile?.email) {
      await sendEmail(brandApprovedEmail(profile.email, { companyName: bp?.company_name }));
    }
  }

  revalidatePath("/admin/verification");
  return { ok: true };
}
