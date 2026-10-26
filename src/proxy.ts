import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 renamed the `middleware` convention to `proxy` (same API).
export async function proxy(request: NextRequest) {
  // Supabase sends OAuth failures to the Site URL (the homepage) with the
  // error in the query string. Send the person to login so the message is
  // visible, instead of leaving it sitting on the marketing page.
  const code = request.nextUrl.searchParams.get("error");
  const detail = request.nextUrl.searchParams.get("error_description");
  if (detail && (code === "server_error" || code === "access_denied") && request.nextUrl.pathname !== "/login") {
    const dest = request.nextUrl.clone();
    dest.pathname = "/login";
    dest.search = "";
    dest.hash = "";
    dest.searchParams.set("error", "provider");
    dest.searchParams.set("detail", detail.slice(0, 180));
    return NextResponse.redirect(dest);
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
