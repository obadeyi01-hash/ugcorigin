import { NextResponse, type NextRequest } from "next/server";
import { pathAfterSignIn } from "@/lib/auth/after-sign-in";
import { requestOrigin, supabaseForRequest } from "@/lib/supabase/auth-response";

function usableToken(value: unknown, max: number): value is string {
  return typeof value === "string"
    && value.length >= 16
    && value.length <= max
    && /^[A-Za-z0-9\-._~+/=]+$/.test(value);
}

/**
 * Saves a session from a magic link that came back in the URL hash. The hash
 * is read by the callback page and posted here. The redirect path is chosen
 * on the server, never taken from the body.
 */
export async function POST(request: NextRequest) {
  const expected = requestOrigin(request);
  const originHeader = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const originOk = originHeader === expected || (!originHeader && fetchSite === "same-origin");
  if (!originOk) return NextResponse.json({ error: "origin" }, { status: 403 });

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 20_000) return NextResponse.json({ error: "session" }, { status: 400 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "session" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? body as Record<string, unknown> : null;
  const accessToken = record?.access_token;
  const refreshToken = record?.refresh_token;
  if (!usableToken(accessToken, 8192) || !usableToken(refreshToken, 4096)) {
    return NextResponse.json({ error: "session" }, { status: 400 });
  }
  const role = record?.role === "brand" || record?.role === "creator" ? record.role : null;

  const bound = supabaseForRequest(request);
  if (!bound) return NextResponse.json({ error: "config" }, { status: 500 });

  const { error } = await bound.client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) return NextResponse.json({ error: "session" }, { status: 400 });

  const redirect = await pathAfterSignIn(bound.client, role, null);
  const response = NextResponse.json({ redirect });
  response.headers.set("cache-control", "no-store");
  bound.apply(response);
  return response;
}
