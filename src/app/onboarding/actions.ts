"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serializeGoals } from "@/lib/brand-options";
import { generateUniqueHandle } from "@/lib/username";
import { sendVerifyPrompt } from "@/lib/notify";

const configured = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export type ActionResult = { error?: string };

export type CreatorInput = {
  firstName: string;
  lastName: string;
  displayName: string;
  location: string;
  phone: string | null;
  bio: string;
  niches: string[];
  startingRate: number;
};

export type BrandInput = {
  companyName: string;
  contactFirstName: string;
  contactLastName: string;
  website: string;
  storeUrl: string;
  phone: string | null;
  goal: string[];
  adPlatforms: string[];
  contentTypes: string[];
  businessType: string;
  contactRole: string;
  teamSize: string;
};

function creatorCompleteness(i: CreatorInput) {
  let n = 0;
  n += 20; // handle is auto-assigned, so it always counts
  if (i.firstName) n += 15;
  if (i.location) n += 10;
  if (i.bio && i.bio.length > 20) n += 15;
  if (i.niches.length > 0) n += 20;
  if (i.startingRate > 0) n += 20;
  return Math.min(100, n);
}

export async function createCreatorProfile(input: CreatorInput): Promise<ActionResult> {
  if (!configured()) return { error: "Backend not connected yet, add your Supabase keys to .env.local to save." };

  const first = input.firstName.trim();
  const last = input.lastName.trim();
  if (!first) return { error: "Please enter your first name." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired, please sign in again." };

  // display_name is derived from the real name (full name stored privately).
  const display = `${first} ${last}`.trim() || input.displayName.trim();

  // Username is no longer collected at onboarding — auto-assign a clean, unique
  // handle from the name (or the email local-part as a fallback). The creator
  // can change it later from settings.
  const seed = `${first}${last}`.trim() || user.email?.split("@")[0] || "creator";
  // Check handle availability with the admin client: RLS hides non-live
  // creators from the ordinary client, which would miss real collisions.
  const admin = createAdminClient();
  const handle = await generateUniqueHandle(seed, async (h) => {
    const { data } = await admin.from("creator_profiles").select("id").eq("handle", h).maybeSingle();
    return !!data;
  });

  const { error } = await supabase.from("creator_profiles").insert({
    id: user.id,
    handle,
    first_name: first,
    last_name: last || null,
    display_name: display,
    location: input.location.trim(),
    phone: input.phone || null,
    bio: input.bio.trim(),
    niches: input.niches,
    starting_rate_naira: Math.max(0, Math.round(input.startingRate)),
    completeness: creatorCompleteness(input),
  });

  if (error) {
    // A phone clash is the one the creator can act on; disambiguate it from the
    // (rare, auto-handled) handle race by the violated constraint name.
    if (error.code === "23505") {
      if (/phone/i.test(error.message)) {
        return { error: "That phone number is already linked to another creator account." };
      }
      return { error: "Something clashed while creating your profile, please try again." };
    }
    return { error: error.message };
  }

  await sendVerifyPrompt(admin, user.id, "creator");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createBrandProfile(input: BrandInput): Promise<ActionResult> {
  if (!configured()) return { error: "Backend not connected yet, add your Supabase keys to .env.local to save." };

  if (!input.companyName.trim()) return { error: "Please enter your company or store name." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired, please sign in again." };

  const { error } = await supabase.from("brand_profiles").insert({
    id: user.id,
    company_name: input.companyName.trim(),
    contact_first_name: input.contactFirstName.trim() || null,
    contact_last_name: input.contactLastName.trim() || null,
    website: input.website.trim() || null,
    store_url: input.storeUrl.trim() || null,
    phone: input.phone || null,
    goal: serializeGoals(input.goal ?? []),
    ad_platforms: input.adPlatforms ?? [],
    content_types: input.contentTypes ?? [],
    business_type: input.businessType || null,
    contact_role: input.contactRole || null,
    team_size: input.teamSize || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "You already have a brand profile." };
    return { error: error.message };
  }

  const admin = createAdminClient();
  await sendVerifyPrompt(admin, user.id, "brand");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
