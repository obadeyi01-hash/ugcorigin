import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin, supabaseForRequest } from "@/lib/supabase/auth-response";

function safePath(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  return raw;
}

function loginError(origin: string, code: string, detail?: string | null) {
  const dest = new URL("/login", origin);
  dest.searchParams.set("error", code);
  if (detail) dest.searchParams.set("detail", detail.slice(0, 180));
  return NextResponse.redirect(dest);
}

/**
 * OAuth and magic-link landing. Exchanges the one-time code for a session and
 * writes the cookies onto the redirect itself. New accounts go to onboarding;
 * people who already have a profile go to the dashboard.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const origin = requestOrigin(request);
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error_description") || url.searchParams.get("error");
  const role = url.searchParams.get("role");
  const roleQuery = role === "brand" || role === "creator" ? `?role=${role}` : "";
  const fallback = `/onboarding${roleQuery}`;
  const next = safePath(url.searchParams.get("next"), fallback);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return loginError(origin, "config", "Sign-in isn't configured on this server yet.");
  }
  if (providerError && !code) return loginError(origin, "provider", providerError);
  if (!code) return loginError(origin, "auth_callback");

  const bound = supabaseForRequest(request);
  if (!bound) return loginError(origin, "config", "Sign-in isn't configured on this server yet.");

  const { error } = await bound.client.auth.exchangeCodeForSession(code);
  if (error) return loginError(origin, "auth_callback", error.message);

  let destPath = next;
  if (!url.searchParams.get("next")) {
    const { data: { user } } = await bound.client.auth.getUser();
    if (user) {
      const [{ data: creator }, { data: brand }] = await Promise.all([
        bound.client.from("creator_profiles").select("id").eq("id", user.id).maybeSingle(),
        bound.client.from("brand_profiles").select("id").eq("id", user.id).maybeSingle(),
      ]);
      const hasCreator = !!creator;
      const hasBrand = !!brand;
      if ((role === "creator" && hasCreator) || (role === "brand" && hasBrand) || (!role && (hasCreator || hasBrand))) {
        destPath = "/dashboard";
      } else {
        destPath = fallback;
      }
    }
  }

  const redirect = NextResponse.redirect(new URL(destPath, origin));
  bound.apply(redirect);
  return redirect;
}
