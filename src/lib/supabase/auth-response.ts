import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: Parameters<NextResponse["cookies"]["set"]>[2] };

/**
 * Public origin of this request. Prefer the forwarded host on a real deploy so
 * the post-login redirect stays on the host that holds the PKCE cookie. Ignore
 * a forwarded localhost, which is how a stale dev header would bounce production
 * users at 127.0.0.1.
 */
export function requestOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (host && proto && host !== "localhost" && !host.startsWith("127.0.0.1")) {
    return `${proto}://${host}`;
  }
  return request.nextUrl.origin;
}

/**
 * Supabase client that records every cookie write. Route handlers that return
 * `NextResponse.redirect()` do not pick up `cookies().set()`, so the caller
 * applies the jar onto the response it actually returns.
 */
export function supabaseForRequest(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const jar: CookieToSet[] = [];
  if (!url || !key) return null;

  const client = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const row = { name, value, options };
          const idx = jar.findIndex((c) => c.name === name);
          if (idx >= 0) jar[idx] = row;
          else jar.push(row);
        });
      },
    },
  });

  return {
    client,
    apply(response: NextResponse) {
      jar.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  };
}
