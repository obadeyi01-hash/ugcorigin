"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listBanks, resolveAccount, createTransferRecipient, paystackConfigured, type Bank } from "@/lib/payments/paystack";
import { getKycProvider, type KycInitiation } from "@/lib/kyc";
import { placeCreator } from "@/lib/tiering/placement";

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

/**
 * When no automated KYC provider is connected yet, a creator can submit for
 * MANUAL review instead of hitting a dead end. This flags them pending so they
 * surface in the admin verification queue; an admin approves identity + sets
 * them live. Never self-sets identity_verified.
 */
export async function requestManualVerificationAction(): Promise<{ ok?: boolean; error?: string }> {
  const { user } = await requireUser();
  if (!user) return { error: "Please sign in again." };

  const admin = createAdminClient();
  // Avoid duplicate pending requests.
  const { data: existing } = await admin
    .from("verifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("kind", "identity")
    .eq("status", "pending")
    .maybeSingle();
  if (!existing) {
    await admin.from("verifications").insert({
      user_id: user.id,
      kind: "identity",
      provider: "manual",
      status: "pending",
    });
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
    .select("completeness, bank_verified, identity_verified, agreements_accepted_at, is_live")
    .eq("id", user.id)
    .maybeSingle();

  if (!p) return { error: "Create your creator profile first." };
  if (p.is_live) redirect("/dashboard");

  const missing: string[] = [];
  if ((p.completeness ?? 0) < MIN_COMPLETENESS) missing.push("Complete your profile");
  if (!p.bank_verified) missing.push("Verify your bank account");
  if (!p.identity_verified) missing.push("Verify your identity");
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
