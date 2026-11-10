"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardWrite } from "@/lib/admin/rbac";
import { notifyAdminsPendingReview, notifyUser } from "@/lib/notify";
import { recordProfileNote } from "@/lib/admin/profile-notes";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import { brandApprovedEmail, brandRejectedEmail } from "@/lib/email/templates";
import { parseVirtualNin, identityTokenHash } from "@/lib/identity/token";
import { captureAccountSignal } from "@/lib/signals/capture";

type Res = { ok?: boolean; error?: string };

/** Brand submits business details for verification. */
export async function submitBrandVerification(input: {
  companyName: string;
  rcNumber: string;
  registeredAddress?: string;
  directorName?: string;
  directorId?: string;
  consent?: boolean;
}): Promise<Res> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: "Backend not connected." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const company = input.companyName.trim();
  const rc = input.rcNumber.trim();
  const address = (input.registeredAddress ?? "").trim();
  const director = (input.directorName ?? "").trim();
  if (!company) return { error: "Enter your registered business name." };
  if (rc.length < 4) return { error: "Enter your CAC/RC number." };
  if (address.length < 6) return { error: "Enter your registered business address." };
  if (director.length < 3) return { error: "Enter the full name of the person responsible for this account." };
  if (!input.consent) return { error: "Confirm the authorised person agrees to the identity check." };
  const parsed = parseVirtualNin(input.directorId ?? "");
  if (!parsed.token) return { error: parsed.error ?? "Enter the authorised person's Virtual NIN or Share Code." };
  const token = parsed.token;

  // verification_status is a service-role-only gate column, so write via admin.
  const admin = createAdminClient();
  const { error } = await admin
    .from("brand_profiles")
    .update({
      company_name: company,
      rc_number: rc,
      registered_address: address,
      director_name: director,
      director_id_token: token,
      director_id_hash: identityTokenHash(token),
      director_consent_at: new Date().toISOString(),
      verification_status: "pending",
      verification_submitted_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  await notifyAdminsPendingReview(admin, {
    title: "Brand verification waiting",
    body: `${company} submitted a CAC/RC number for review.`,
    href: "/admin/verification",
  });

  await captureAccountSignal(user.id, "brand_verify");

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Admin: approve or reject a brand's verification. */
export async function reviewBrandVerification(brandId: string, decision: "verified" | "unverified", note: string): Promise<Res> {
  const { ctx, error } = await guardWrite("verification");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  const reason = note.trim().slice(0, 300);
  if (decision !== "verified" && !reason) return { error: "Add a short reason so they know what to fix." };
  const admin = createAdminClient();
  const { error: e } = await admin
    .from("brand_profiles")
    .update({
      verification_status: decision,
      verification_note: reason || null,
      // On approval the authorised person is confirmed tied to the company;
      // drop the raw one-time code (the hash stays for audit).
      ...(decision === "verified" ? { person_verified: true, director_id_token: null } : {}),
    })
    .eq("id", brandId);
  if (e) return { error: e.message };

  await admin.from("audit_log").insert({ actor_id: ctx.userId, action: `brand.${decision === "verified" ? "verified" : "rejected"}`, target_type: "brand_profile", target_id: brandId, after: { verification_status: decision } });

  const { data: bp } = await admin.from("brand_profiles").select("company_name").eq("id", brandId).maybeSingle();
  await notifyUser(admin, brandId, {
    type: "product",
    title: decision === "verified" ? "Your brand is verified" : "Brand verification needs another look",
    body: decision === "verified"
      ? "Your business is verified. Creators now see a Verified brand badge on your offers."
      : `We couldn't verify ${bp?.company_name || "your business"} yet. ${reason} Update the registered name and CAC/RC number in settings, then submit again.`,
    href: "/settings",
    skipEmail: true,
  });

  const { data: profile } = await admin.from("profiles").select("email").eq("id", brandId).maybeSingle();
  let to = profile?.email?.trim() || "";
  if (!to) {
    const { data } = await admin.auth.admin.getUserById(brandId);
    to = data.user?.email ?? "";
  }
  const mail = decision === "verified"
    ? brandApprovedEmail(to || "brand@ugcorigin.com", { companyName: bp?.company_name })
    : brandRejectedEmail(to || "brand@ugcorigin.com", { companyName: bp?.company_name, note: reason });
  if (decision !== "verified") {
    await recordProfileNote(admin, {
      userId: brandId,
      kind: "brand_rejection",
      subject: mail.subject,
      body: mail.body,
      actorId: ctx.userId,
    });
  }
  if (to && emailConfigured()) await sendEmail({ ...mail, to });

  revalidatePath("/admin/verification");
  return { ok: true };
}
