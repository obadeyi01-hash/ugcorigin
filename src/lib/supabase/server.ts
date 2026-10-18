import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

/** Server Supabase client bound to the request cookies (RLS as the signed-in user). */
export async function createClient() {
  // Bind to the incoming request before any session read. The Supabase auth
  // client checks token expiry with Date.now(), which Cache Components rejects
  // as an unstable value during the prerender pass unless the subtree is first
  // marked request-dynamic. connection() establishes that boundary.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from a Server Component, safe to ignore; middleware refreshes.
          }
        },
      },
    },
  );
}
