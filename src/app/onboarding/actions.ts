"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeHandle, isValidHandle } from "@/lib/username";

const configured = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export type ActionResult = { error?: string };

export type CreatorInput = {
  handle: string;
  firstName: string;
  lastName: string;
  displayName: string;
  location: string;
  bio: string;
  niches: string[];
  startingRate: number;
};

export type BrandInput = {
  companyName: string;
  website: string;
  storeUrl: string;
};

function creatorCompleteness(i: CreatorInput) {
  let n = 0;
  if (i.handle) n += 20;
  if (i.firstName) n += 15;
  if (i.location) n += 10;
  if (i.bio && i.bio.length > 20) n += 15;
  if (i.niches.length > 0) n += 20;
  if (i.startingRate > 0) n += 20;
  return Math.min(100, n);
}

export async function createCreatorProfile(input: CreatorInput): Promise<ActionResult> {
  if (!configured()) return { error: "Backend not connected yet, add your Supabase keys to .env.local to save." };

  const handle = normalizeHandle(input.handle);
  if (!isValidHandle(handle)) {
    return { error: "Username must be 3 to 30 characters: letters, numbers, dot, dash or underscore." };
  }

  const first = input.firstName.trim();
  const last = input.lastName.trim();
  if (!first) return { error: "Please enter your first name." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired, please sign in again." };

  // display_name is derived from the real name (full name stored privately).
  const display = `${first} ${last}`.trim() || input.displayName.trim();

  const { error } = await supabase.from("creator_profiles").insert({
    id: user.id,
    handle,
    first_name: first,
    last_name: last || null,
    display_name: display,
    location: input.location.trim(),
    bio: input.bio.trim(),
    niches: input.niches,
    starting_rate_naira: Math.max(0, Math.round(input.startingRate)),
    completeness: creatorCompleteness(input),
  });

  if (error) {
    if (error.code === "23505") return { error: "That username is taken, try another." };
    return { error: error.message };
  }

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
    website: input.website.trim() || null,
    store_url: input.storeUrl.trim() || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "You already have a brand profile." };
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
