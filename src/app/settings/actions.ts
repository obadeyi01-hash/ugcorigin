"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectAiClaim } from "@/lib/ai-detect";
import { normalizeHandle, isValidHandle, FREE_USERNAME_CHANGES } from "@/lib/username";

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
  firstName: string;
  lastName: string;
  displayName: string;
  location: string;
  phone: string | null;
  bio: string;
  niches: string[];
  contentFormats: string[];
  startingRate: number;
  avatarUrl: string | null;
};

function creatorCompleteness(i: CreatorSettingsInput) {
  let n = 0;
  if (i.handle) n += 15;
  if (i.firstName) n += 15;
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

  const handle = normalizeHandle(input.handle);
  if (!isValidHandle(handle)) {
    return { error: "Username must be 3 to 30 characters: letters, numbers, dot, dash or underscore." };
  }

  // Username governance: the onboarding handle is assigned; after that a creator
  // gets FREE_USERNAME_CHANGES free change(s), then it's a paid (subscription)
  // perk. Enforce before writing.
  const { data: current } = await supabase
    .from("creator_profiles")
    .select("handle, username_changes, avatar_url, avatar_changes, avatar_last_changed_at")
    .eq("id", user.id)
    .maybeSingle();

  const changingHandle = !!current && current.handle !== handle;
  let nextChanges = current?.username_changes ?? 0;
  if (changingHandle && nextChanges >= FREE_USERNAME_CHANGES) {
    // Extra username changes are a Creator Pro perk.
    const { data: subRows } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("current_period_end", new Date().toISOString())
      .limit(1);
    if (!subRows || subRows.length === 0) {
      return {
        error:
          "You've used your free username change. Extra changes are a Creator Pro perk, subscribe at /pro to change it again. Your current username stays active.",
      };
    }
  }
  if (changingHandle) nextChanges += 1;

  // Media monitoring: track avatar swaps; frequent changes raise a review flag.
  const avatarChanged = !!current && !!input.avatarUrl && current.avatar_url !== input.avatarUrl;
  let avatarChanges = current?.avatar_changes ?? 0;
  let mediaFlag = false;
  if (avatarChanged) {
    avatarChanges += 1;
    // 3+ changes in a rolling 30 days is suspicious for a genuine creator.
    const last = current?.avatar_last_changed_at ? new Date(current.avatar_last_changed_at).getTime() : 0;
    const within30d = Date.now() - last < 30 * 24 * 60 * 60 * 1000;
    if (avatarChanges >= 3 && within30d) mediaFlag = true;
  }

  const first = input.firstName.trim();
  const last = input.lastName.trim();
  if (!first) return { error: "First name can’t be empty." };
  const display = `${first} ${last}`.trim() || input.displayName.trim();

  const { error } = await supabase
    .from("creator_profiles")
    .update({
      handle,
      username_changes: nextChanges,
      first_name: first,
      last_name: last || null,
      display_name: display,
      location: input.location.trim() || null,
      phone: input.phone || null,
      bio: input.bio.trim() || null,
      niches: input.niches,
      content_formats: input.contentFormats,
      starting_rate_naira: input.startingRate > 0 ? Math.round(input.startingRate) : null,
      avatar_url: input.avatarUrl,
      ...(avatarChanged ? { avatar_changes: avatarChanges, avatar_last_changed_at: new Date().toISOString() } : {}),
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
  if (mediaFlag) {
    await admin.from("creator_profiles").update({ media_flagged: true }).eq("id", user.id);
  }
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
  contactFirstName: string;
  contactLastName: string;
  website: string;
  storeUrl: string;
  phone: string | null;
  logoUrl: string | null;
  goal: string;
  adPlatforms: string[];
  contentTypes: string[];
  businessType: string;
  contactRole: string;
  teamSize: string;
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
      contact_first_name: input.contactFirstName.trim() || null,
      contact_last_name: input.contactLastName.trim() || null,
      website: input.website.trim() || null,
      store_url: input.storeUrl.trim() || null,
      phone: input.phone || null,
      logo_url: input.logoUrl,
      goal: input.goal || null,
      ad_platforms: input.adPlatforms ?? [],
      content_types: input.contentTypes ?? [],
      business_type: input.businessType || null,
      contact_role: input.contactRole || null,
      team_size: input.teamSize || null,
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
