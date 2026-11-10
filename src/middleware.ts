import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Runs on every request (minus the exclusions below) to refresh the Supabase
 * auth session at the edge — it re-validates the token and writes the rotated
 * cookies onto the response. Without this, a Server Component that reads the
 * session can't persist a refreshed token (it can't set cookies), so sessions
 * go stale and `getUser()` starts warning / logging people out. This is the
 * canonical Supabase SSR pattern.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except API routes (the Paystack webhook/cron are server-to-server),
    // Next internals, and static assets.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
