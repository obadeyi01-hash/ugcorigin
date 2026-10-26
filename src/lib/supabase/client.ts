import { createBrowserClient } from "@supabase/ssr";

/** Browser Supabase client (uses the public anon key). Call inside components/handlers. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // PKCE: the code verifier lives in a cookie on THIS origin, and the
      // /auth/callback route exchanges it once. The browser must not also try
      // to consume a ?code= on a page, or the second exchange fails and the
      // session looks like it never signed in.
      auth: { flowType: "pkce", detectSessionInUrl: false, persistSession: true },
    },
  );
}

/** True when the backend env is configured. */
export const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
