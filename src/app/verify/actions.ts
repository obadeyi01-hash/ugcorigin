"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listBanks, resolveAccount, createTransferRecipient, paystackConfigured, type Bank } from "@/lib/payments/paystack";
import { getKycProvider, type KycInitiation } from "@/lib/kyc";
import { placeCreator } from "@/lib/tiering/placement";
import { signedUpload, type SignedUpload } from "@/lib/cloudinary-server";
import { identityFolder } from "@/lib/cloudinary";

const MIN_COMPLETENESS = 80;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getBankList(): Promise<Bank[]> {
  return listBanks();
}

export async function verifyBankAction(
  accountNumber: string,
  bankCode: string,
): Promise<{ accountName?: string; error?: string }> {
  const { user } = await requireUser();
  if (!user) return { error: "Please sign in again." };
  if (!/^\d{10}$/.test(accountNumber)) return { error: "Enter a valid 10-digit account number." };
  if (!bankCode) return { error: "Select your bank." };

  try {
    const { accountName } = await resolveAccount(accountNumber, bankCode);

    // Create a Paystack payout recipient (best-effort; payout can still be set up later).
    let recipientCode: string | null = null;
    if (paystackConfigured()) {
      try {
        recipientCode = await createTransferRecipient({ name: accountName, accountNumber, bankCode });
      } catch {
        recipientCode = null;
      }
    }

    // Privileged writes via service role (users cannot set these columns).
    const admin = createAdminClient();
    await admin.from("verifications").insert({
      user_id: user.id,
      kind: "bank",
      provider: "paystack",
      status: "verified",
      reference: accountNumber,
    });
    await admin
      .from("creator_profiles")
      .update({
        bank_verified: true,
        payout_bank_code: bankCode,
        payout_account_number: accountNumber,
        payout_recipient_code: recipientCode,
      })
      .eq("id", user.id);

    revalidatePath("/verify");
    return { accountName };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not verify that account." };
  }
}

export async function acceptAgreementsAction(): Promise<{ ok?: boolean; error?: string }> {
  const { user } = await requireUser();
  if (!user) return { error: "Please sign in again." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("creator_profiles")
    .update({ agreements_accepted_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/verify");
  return { ok: true };
}

export async function startIdentityAction(): Promise<KycInitiation | { error: string }> {
  const { user } = await requireUser();
  if (!user) return { error: "Please sign in again." };

  const provider = getKycProvider();
  if (!provider) return { configured: false };

  try {
    return await provider.initiate(user.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start identity verification." };
  }
}

/** Creator-only: sign a Cloudinary upload for the identity selfie (authenticated,
 *  private). The file lands in the creator's own identity folder. */
export async function signSelfieUpload(): Promise<{ upload?: SignedUpload; error?: string }> {
  const { user } = await requireUser();
  if (!user) return { error: "Please sign in again." };
  const upload = signedUpload(identityFolder(user.id));
  if (!upload) return { error: "Photo upload isn’t configured yet. Please check back soon." };
  return { upload };
}

/**
 * Manual identity submission (selfie + NIN) while no automated KYC provider is
 * connected. Stored in identity_submissions (service-role only — never exposed
 * through the public creator row). Can be re-submitted while pending/rejected;
 * blocked once approved. Never self-sets identity_verified: an admin reviews the
 * selfie + NIN and approves, which flips the badge and sets the profile live.
 */
export async function submitIdentityAction(input: {
  nin: string;
  selfieRef: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const { user } = await requireUser();
  if (!user) return { error: "Please sign in again." };

  const nin = input.nin.replace(/\D/g, "");
  if (!/^\d{11}$/.test(nin)) return { error: "Enter your 11-digit NIN." };
  if (!input.selfieRef || !input.selfieRef.startsWith("cld:")) {
    return { error: "Please add a clear photo of yourself before submitting." };
  }

  const admin = createAdminClient();

  // Don't let an already-approved creator overwrite their verified submission.
  const { data: existing } = await admin
    .from("identity_submissions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing?.status === "approved") {
    return { error: "Your identity is already verified." };
  }

  // Snapshot the current phone for the reviewer's reference. phone SELECT is
  // revoked from anon/authenticated at the column level, so read it via admin.
  const { data: prof } = await admin.from("creator_profiles").select("phone").eq("id", user.id).maybeSingle();

  const { error } = await admin.from("identity_submissions").upsert(
    {
      user_id: user.id,
      nin,
      selfie_ref: input.selfieRef,
      phone: prof?.phone ?? null,
      status: "pending",
      reject_reason: null,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      reviewer_id: null,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    if (error.code === "23505") {
      // The only other unique key here is the NIN.
      return { error: "That NIN is already linked to another account. If this is a mistake, contact support." };
    }
    return { error: error.message };
  }

  // Mirror a pending row into verifications for the audit trail / queue parity.
  const { data: v } = await admin
    .from("verifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("kind", "identity")
    .eq("status", "pending")
    .maybeSingle();
  if (!v) {
    await admin.from("verifications").insert({ user_id: user.id, kind: "identity", provider: "manual", status: "pending" });
  }
  await admin.from("creator_profiles").update({ verification_status: "pending" }).eq("id", user.id);

  revalidatePath("/verify");
  return { ok: true };
}

export async function goLiveAction(): Promise<{ ok?: boolean; missing?: string[]; error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Please sign in again." };

  const { data: p } = await supabase
    .from("creator_profiles")
    .select("completeness, bank_verified, identity_verified, photo_verified, agreements_accepted_at, is_live")
    .eq("id", user.id)
    .maybeSingle();

  if (!p) return { error: "Create your creator profile first." };
  if (p.is_live) redirect("/dashboard");

  const missing: string[] = [];
  if ((p.completeness ?? 0) < MIN_COMPLETENESS) missing.push("Complete your profile");
  if (!p.bank_verified) missing.push("Verify your bank account");
  // Identity verification requires an approved selfie + NIN. photo_verified is
  // an explicit, independent gate so a creator can never go live without an
  // approved photo even if identity_verified were set by another path.
  if (!p.identity_verified || !p.photo_verified) missing.push("Verify your identity");
  if (!p.agreements_accepted_at) missing.push("Accept the agreements");
  if (missing.length) return { missing };

  const admin = createAdminClient();
  const { error } = await admin
    .from("creator_profiles")
    .update({ is_live: true, verification_status: "verified" })
    .eq("id", user.id);
  if (error) return { error: error.message };

  // Place them on the tier ladder from their verified signals (capped at Pro).
  await placeCreator(user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
