import { createClient } from "@/lib/supabase/server";

type Gate =
  | { ok: true }
  | { ok: false; error: string; href?: string; needsBrand?: boolean; needsCreator?: boolean };

type Db = Awaited<ReturnType<typeof createClient>>;

/** Brands stay off the marketplace until a person has approved the CAC/RC number. */
export async function requireVerifiedBrand(supabase: Db, userId: string): Promise<Gate> {
  const { data: brand } = await supabase
    .from("brand_profiles")
    .select("id, verification_status")
    .eq("id", userId)
    .maybeSingle();
  if (!brand) return { ok: false, error: "Create a brand account first.", needsBrand: true };
  if (brand.verification_status !== "verified") {
    return {
      ok: false,
      error: "Verify your brand before you can post. Creators only see businesses with an approved CAC/RC number.",
      href: "/settings",
    };
  }
  return { ok: true };
}

/** Creators stay hidden and cannot apply until they are live, and a takedown sticks. */
export async function requireLiveCreator(supabase: Db, userId: string): Promise<Gate> {
  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("id, is_live, suspended")
    .eq("id", userId)
    .maybeSingle();
  if (!creator) return { ok: false, error: "Set up a creator profile first.", needsCreator: true };
  if (creator.suspended) {
    return { ok: false, error: "This profile was taken offline by moderation. Contact support." };
  }
  if (!creator.is_live) {
    return {
      ok: false,
      error: "Finish verification before you apply. Brands only hire creators who are live.",
      href: "/verify",
    };
  }
  return { ok: true };
}
