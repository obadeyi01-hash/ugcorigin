"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Admin sign-in is DELIBERATELY separate from the public passwordless flow:
 *  - email + password (so the admin address can be an obscure, non-routing
 *    mailbox that never needs to receive a magic link), then the existing TOTP
 *    (aal2) gate enforced by the admin console at /admin/mfa;
 *  - an identical, generic error for a wrong password AND for a valid NON-admin
 *    account, so this endpoint can't be used to confirm whether an email is an
 *    admin (no account enumeration).
 *
 * The public app keeps its own passwordless door; admins never need it.
 */
export async function adminSignIn(input: {
  email: string;
  password: string;
}): Promise<{ error?: string; redirect?: string }> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!email || !email.includes("@") || !password) {
    return { error: "Invalid credentials." };
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { error: "Sign-in isn't configured on this server yet." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Invalid credentials." };

  // Must be a provisioned admin. A valid but non-admin login is signed straight
  // back out and told the same generic message — the console door is admins only.
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!adminRow) {
    await supabase.auth.signOut();
    return { error: "Invalid credentials." };
  }

  // The console's own guard (requireSection) still forces TOTP (aal2) before
  // anything sensitive, so a first-time admin lands on /admin/mfa to enrol.
  return { redirect: "/admin" };
}
