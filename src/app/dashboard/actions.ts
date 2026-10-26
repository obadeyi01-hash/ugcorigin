"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVerifyPrompt } from "@/lib/notify";

/** Dashboard "email me the steps again". Sends at most once per 20 hours. */
export async function resendVerifyPrompt(role: "creator" | "brand"): Promise<{ ok?: boolean; error?: string; sent?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const admin = createAdminClient();
  if (role === "creator") {
    const { data: creator } = await admin.from("creator_profiles").select("id, is_live, suspended").eq("id", user.id).maybeSingle();
    if (!creator) return { error: "Create a creator profile first." };
    if (creator.suspended) return { error: "This profile was taken offline. Contact support." };
    if (creator.is_live) return { error: "You're already live." };
  } else {
    const { data: brand } = await admin.from("brand_profiles").select("id, verification_status").eq("id", user.id).maybeSingle();
    if (!brand) return { error: "Create a brand profile first." };
    if (brand.verification_status === "verified") return { error: "Your brand is already verified." };
  }

  const { sent } = await sendVerifyPrompt(admin, user.id, role);
  revalidatePath("/dashboard");
  return { ok: true, sent };
}
