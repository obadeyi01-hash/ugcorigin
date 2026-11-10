"use client";

import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { adminSignIn } from "@/app/(admin-auth)/admin-login/actions";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminSignIn({ email, password });
      if (res.error) {
        setError(res.error);
        return;
      }
      // Full navigation (not client routing) so the fresh session cookie is sent
      // on the very next request into /admin.
      if (res.redirect) window.location.assign(res.redirect);
    } catch {
      setError("Sign-in didn't finish. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-2">
        <ShieldCheck className="size-3.5 text-accent" /> Staff access
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">Admin sign-in</h1>
      <p className="mt-1.5 text-sm text-ink-2">Restricted. You&rsquo;ll confirm two-factor on the next step.</p>

      <form onSubmit={submit} className="mt-6 grid gap-3">
        <Field label="Admin email">
          <Input
            type="email"
            required
            autoComplete="username"
            placeholder="you@ugcorigin.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" loading={loading}>Sign in</Button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
