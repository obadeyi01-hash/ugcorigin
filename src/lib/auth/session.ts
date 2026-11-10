import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in Supabase user, validated ONCE per request. `auth.getUser()`
 * makes a network call to the Auth server to verify the JWT, and several places
 * need the user in a single render — the page itself, `getViewer`, and
 * `getAdminContext`. `cache()` memoizes this for the lifetime of the request so
 * those collapse into one call instead of two or three.
 *
 * Prefer this over calling `supabase.auth.getUser()` directly in new code.
 */
export const getSessionUser = cache(async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});
