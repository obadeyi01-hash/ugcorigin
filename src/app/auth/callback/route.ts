import { NextResponse, type NextRequest } from "next/server";
import { pathAfterSignIn } from "@/lib/auth/after-sign-in";
import { requestOrigin, supabaseForRequest } from "@/lib/supabase/auth-response";

// Links we mint ourselves come back in the URL hash (implicit flow), which the
// server never sees. This page reads the hash in the browser, strips it, and
// posts the tokens to /auth/callback/session. PKCE (?code=) stays on the server.
const IMPLICIT_CALLBACK_HTML = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<title>Signing in…</title>
</head><body>
<p style="font-family:sans-serif;color:#444">Finishing sign-in…</p>
<script>
(function () {
  var hash = new URLSearchParams((location.hash || "").replace(/^#/, ""));
  var query = new URLSearchParams(location.search);
  history.replaceState(null, "", location.pathname + location.search);
  var err = hash.get("error_description") || hash.get("error");
  if (err) {
    location.replace("/login?error=provider&detail=" + encodeURIComponent(String(err).slice(0, 180)));
    return;
  }
  var access = hash.get("access_token");
  var refresh = hash.get("refresh_token");
  if (!access || !refresh) {
    location.replace("/login?error=auth_callback");
    return;
  }
  fetch("/auth/callback/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ access_token: access, refresh_token: refresh, role: query.get("role"), next: query.get("next") })
  }).then(function (res) {
    return res.json().then(function (body) { return { ok: res.ok, body: body }; });
  }).then(function (result) {
    var dest = result.body && result.body.redirect;
    if (result.ok && typeof dest === "string" && dest.charAt(0) === "/" && dest.charAt(1) !== "/") {
      location.replace(dest);
    } else {
      location.replace("/login?error=auth_callback");
    }
  }).catch(function () {
    location.replace("/login?error=auth_callback");
  });
})();
</script>
</body></html>`;

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
  const next = url.searchParams.get("next");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return loginError(origin, "config", "Sign-in isn't configured on this server yet.");
  }
  if (providerError && !code) return loginError(origin, "provider", providerError);
  if (!code) {
    return new NextResponse(IMPLICIT_CALLBACK_HTML, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "referrer-policy": "no-referrer",
      },
    });
  }

  const bound = supabaseForRequest(request);
  if (!bound) return loginError(origin, "config", "Sign-in isn't configured on this server yet.");

  const { error } = await bound.client.auth.exchangeCodeForSession(code);
  if (error) return loginError(origin, "auth_callback", error.message);

  const destPath = await pathAfterSignIn(bound.client, role, next);

  const redirect = NextResponse.redirect(new URL(destPath, origin));
  bound.apply(redirect);
  return redirect;
}
