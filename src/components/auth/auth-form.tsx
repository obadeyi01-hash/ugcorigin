"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

type Mode = "login" | "signup";
type Provider = "google" | "facebook" | "twitter";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="currentColor">
    <path d="M18.9 1.5h3.68l-8.04 9.19L24 22.5h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.5h7.6l5.24 6.93L18.9 1.5Zm-1.29 18.8h2.04L6.48 3.6H4.3l13.31 16.7Z" />
  </svg>
);
const MetaIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
    <path fill="#0866FF" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12Z" />
  </svg>
);

const ALL_PROVIDERS: { id: Provider; label: string; icon: () => ReactElement }[] = [
  { id: "google", label: "Google", icon: GoogleIcon },
  { id: "facebook", label: "Meta", icon: MetaIcon },
  { id: "twitter", label: "X", icon: XIcon },
];

// Only show OAuth buttons for providers that are actually configured in Supabase.
// Controlled by NEXT_PUBLIC_OAUTH_PROVIDERS (comma-separated: google, meta/facebook,
// x/twitter). Defaults to just "google" so work-in-progress providers (Meta, X)
// stay hidden until enabled, a disabled provider would otherwise error on click.
const ALIAS: Record<string, Provider> = {
  google: "google",
  meta: "facebook",
  facebook: "facebook",
  x: "twitter",
  twitter: "twitter",
};
const enabledRaw = process.env.NEXT_PUBLIC_OAUTH_PROVIDERS;
const enabledSet = new Set<Provider>(
  (enabledRaw === undefined ? "google" : enabledRaw)
    .split(",")
    .map((s) => ALIAS[s.trim().toLowerCase()])
    .filter(Boolean) as Provider[],
);
const providers = ALL_PROVIDERS.filter((p) => enabledSet.has(p.id));

function describeAuthError(code: string | null, detail: string | null): string | null {
  if (!code && !detail) return null;
  const text = (detail || "").trim();
  if (/redirect/i.test(text) || /not allowed/i.test(text)) {
    return "This site's address isn't on the Supabase redirect allow list yet. Add this exact origin's /auth/callback URL in Authentication → URL configuration, then try again.";
  }
  if (/user not found/i.test(text)) {
    return "Google still has a sign-in record for an account that was removed. Try again. If it happens a second time, that leftover record needs to be cleared.";
  }
  if (code === "provider" && text) return text;
  if (code === "auth_callback") {
    return text
      ? `Sign-in didn't finish: ${text}`
      : "Sign-in didn't finish. The session couldn't be saved. Try again from this same address (don't switch between localhost and 127.0.0.1).";
  }
  if (code === "config") return text || "Sign-in isn't configured on this server yet.";
  return text || "Sign-in didn't finish. Please try again.";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const params = useSearchParams();
  // Role is chosen in onboarding, not here. We only carry a role through when a
  // deep link (e.g. "Become a creator") already expressed intent.
  const roleParam = params.get("role");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Built at click time, never during render. The host the person is actually
  // on must match the PKCE cookie. NEXT_PUBLIC_SITE_URL is often still
  // localhost in a deployed env, and a different host drops the session.
  function redirectTo(): string {
    const roleQuery = roleParam === "brand" || roleParam === "creator" ? `?role=${roleParam}` : "";
    return `${window.location.origin}/auth/callback${roleQuery}`;
  }
  const urlError = describeAuthError(params.get("error"), params.get("detail"));

  async function oauth(provider: Provider) {
    if (!supabaseConfigured) return setError("Backend isn't connected yet.");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo() },
    });
    if (error) setError(error.message);
  }

  async function emailLink(e: FormEvent) {
    e.preventDefault();
    if (!supabaseConfigured) return setError("Backend isn't connected yet.");
    setStatus("loading");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1.5 text-sm text-ink-2">
        {mode === "signup"
          ? "Join UGCOrigin, it only takes a minute."
          : "Log in to your UGCOrigin account."}
      </p>

      {providers.length > 0 && (
        <>
          <div className="mt-6 grid gap-2">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => oauth(p.id)}
                className="u-press inline-flex h-11 items-center justify-center gap-2.5 rounded-full border border-line bg-surface text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
              >
                <p.icon /> Continue with {p.label}
              </button>
            ))}
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-ink-3">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      {providers.length === 0 && <div className="mt-6" />}

      {status === "sent" ? (
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-ink">
          <Mail className="mb-1 size-5 text-success" />
          Check <span className="font-medium">{email}</span> for a magic link to finish signing in.
        </div>
      ) : (
        <form onSubmit={emailLink} className="grid gap-3">
          <Input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Button type="submit" loading={status === "loading"}>
            {mode === "signup" ? "Sign up with email" : "Email me a magic link"}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      )}

      {(error || urlError) && (
        <p className="mt-3 text-sm text-error" role="alert">
          {error || urlError}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-ink-2">
        {mode === "signup" ? (
          <>Already have an account? <Link href="/login" className="font-medium text-accent hover:underline">Log in</Link></>
        ) : (
          <>New to UGCOrigin? <Link href="/signup" className="font-medium text-accent hover:underline">Create an account</Link></>
        )}
      </p>
    </div>
  );
}
