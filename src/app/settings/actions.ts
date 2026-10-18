"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectAiClaim } from "@/lib/ai-detect";

const configured = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export type ActionResult = { error?: string; ok?: boolean; aiFlagged?: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export type CreatorSettingsInput = {
  handle: string;
  displayName: string;
  location: string;
  bio: string;
  niches: string[];
  startingRate: number;
  avatarUrl: string | null;
};

function creatorCompleteness(i: CreatorSettingsInput) {
  let n = 0;
  if (i.handle) n += 15;
  if (i.displayName) n += 15;
  if (i.avatarUrl) n += 10;
  if (i.location) n += 10;
  if (i.bio && i.bio.length > 20) n += 15;
  if (i.niches.length > 0) n += 15;
  if (i.startingRate > 0) n += 20;
  return Math.min(100, n);
}

export async function updateCreatorSettings(input: CreatorSettingsInput): Promise<ActionResult> {
  if (!configured()) return { error: "Backend not connected." };
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Your session expired, please sign in again." };

  const handle = input.handle.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9._-]{3,30}$/.test(handle)) {
    return { error: "Username must be 3 to 30 characters: letters, numbers, dot, dash or underscore." };
  }
  if (!input.displayName.trim()) return { error: "Display name can’t be empty." };

  const { error } = await supabase
    .from("creator_profiles")
    .update({
      handle,
      display_name: input.displayName.trim(),
      location: input.location.trim() || null,
      bio: input.bio.trim() || null,
      niches: input.niches,
      starting_rate_naira: input.startingRate > 0 ? Math.round(input.startingRate) : null,
      avatar_url: input.avatarUrl,
      completeness: creatorCompleteness(input),
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "That username is taken, try another." };
    return { error: error.message };
  }

  // Anti-AI: flag + warn if the bio claims AI-generated / not-the-real-creator work.
  const aiClaim = detectAiClaim(input.bio);
  const admin = createAdminClient();
  await admin.from("creator_profiles").update({ ai_flagged: aiClaim }).eq("id", user.id);
  if (aiClaim) {
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "ai_warning",
      title: "Please remove AI references",
      body: "Your profile mentions AI-generated content. UGCOrigin is human-only, remove it to stay visible in search.",
      href: "/settings",
    });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/${handle}`);
  return { ok: true, aiFlagged: aiClaim };
}

export type BrandSettingsInput = {
  companyName: string;
  website: string;
  storeUrl: string;
  logoUrl: string | null;
};

export async function updateBrandSettings(input: BrandSettingsInput): Promise<ActionResult> {
  if (!configured()) return { error: "Backend not connected." };
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Your session expired, please sign in again." };

  if (!input.companyName.trim()) return { error: "Company or store name can’t be empty." };

  const { error } = await supabase
    .from("brand_profiles")
    .update({
      company_name: input.companyName.trim(),
      website: input.website.trim() || null,
      store_url: input.storeUrl.trim() || null,
      logo_url: input.logoUrl,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export type NotificationPrefs = {
  notify_offers: boolean;
  notify_payouts: boolean;
  notify_reviews: boolean;
  notify_product: boolean;
};

export async function updateNotificationPrefs(prefs: NotificationPrefs): Promise<ActionResult> {
  if (!configured()) return { error: "Backend not connected." };
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Your session expired, please sign in again." };

  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, ...prefs, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}
