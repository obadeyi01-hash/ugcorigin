import type { SupabaseClient } from "@supabase/supabase-js";

/** A same-site path. Rejects protocol-relative and backslash tricks. */
export function safeNext(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("\n") || raw.includes("\r")) {
    return fallback;
  }
  return raw;
}

/**
 * Where a finished sign-in should land. An explicit `next` path wins. Otherwise
 * people who already have a profile go to the dashboard, and everyone else
 * goes to onboarding (keeping a brand or creator intent from the link).
 */
export async function pathAfterSignIn(
  client: SupabaseClient,
  role: string | null,
  next: string | null,
): Promise<string> {
  const roleQuery = role === "brand" || role === "creator" ? `?role=${role}` : "";
  const fallback = `/onboarding${roleQuery}`;
  if (next !== null && next !== "") return safeNext(next, fallback);

  const { data: { user } } = await client.auth.getUser();
  if (!user) return fallback;

  const [{ data: creator }, { data: brand }] = await Promise.all([
    client.from("creator_profiles").select("id").eq("id", user.id).maybeSingle(),
    client.from("brand_profiles").select("id").eq("id", user.id).maybeSingle(),
  ]);
  const hasCreator = !!creator;
  const hasBrand = !!brand;
  if ((role === "creator" && hasCreator) || (role === "brand" && hasBrand) || (!role && (hasCreator || hasBrand))) {
    return "/dashboard";
  }
  return fallback;
}
