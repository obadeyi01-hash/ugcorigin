import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin, supabaseForRequest } from "@/lib/supabase/auth-response";

export async function POST(request: NextRequest) {
  const origin = requestOrigin(request);
  const redirect = NextResponse.redirect(new URL("/", origin), { status: 303 });
  const bound = supabaseForRequest(request);
  if (bound) {
    // Scope "local" revokes only this browser. The default ("global") signs the
    // person out of every other device too.
    await bound.client.auth.signOut({ scope: "local" });
    bound.apply(redirect);
  }
  return redirect;
}
