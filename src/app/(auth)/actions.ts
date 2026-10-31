"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import {
  callbackRedirect,
  decideEmailLink,
  describeMintError,
  MESSAGES,
  normalizeEmail,
  noticeFor,
  socialLabels,
  type AccountHint,
  type EmailLinkResult,
  type EmailMode,
} from "@/lib/auth/email-link";

function parseHint(data: unknown): AccountHint | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  if (row.exists !== true) {
    return { exists: false, banned: false, providers: [], recoverySentAt: null };
  }
  const providers = Array.isArray(row.providers)
    ? row.providers.filter((provider): provider is string => typeof provider === "string")
    : [];
  return {
    exists: true,
    banned: row.banned === true,
    providers,
    recoverySentAt: typeof row.recovery_sent_at === "string" ? row.recovery_sent_at : null,
  };
}

/** Null when the lookup itself failed, so the form can fall back to the browser link. */
async function loadHint(email: string): Promise<AccountHint | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("auth_email_sign_in_hint", { target: email });
    if (error) return null;
    return parseHint(data);
  } catch {
    return null;
  }
}

async function mintLink(email: string, redirectTo: string): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (error) return { ok: false, message: describeMintError(error.message) };
    const url = data?.properties?.action_link;
    if (!url || !url.startsWith("https://")) return { ok: false, message: MESSAGES.sendFailed };
    return { ok: true, url };
  } catch {
    return { ok: false, message: MESSAGES.sendFailed };
  }
}

async function issueLink(email: string, redirectTo: string, hint: AccountHint | null, mode: EmailMode): Promise<EmailLinkResult> {
  const minted = await mintLink(email, redirectTo);
  const social = hint ? socialLabels(hint.providers) : [];
  const socialOnly = !!hint?.exists && social.length > 0 && !hint.providers.includes("email");
  if (!minted.ok) {
    if (socialOnly) return { status: "error", message: noticeFor(hint, mode, false) ?? minted.message };
    return { status: "error", message: minted.message };
  }

  const who = socialOnly ? ` This email is connected to ${social.join(" and ")}, and the link opens that same account.` : "";
  const sent = await sendEmail({
    to: email,
    subject: "Your UGCOrigin sign-in link",
    heading: "Your way back in",
    preheader: "Tap to sign in. This link is just for you.",
    body: `Tap the button to sign in to UGCOrigin. The link works once and expires soon.${who} If you didn't ask for this, you can ignore the email.`,
    ctaLabel: "Sign in to UGCOrigin",
    ctaUrl: minted.url,
  });
  if (!sent.ok) {
    if (socialOnly) return { status: "error", message: noticeFor(hint, mode, false) ?? MESSAGES.sendFailed };
    return { status: "error", message: MESSAGES.sendFailed };
  }
  try {
    const admin = createAdminClient();
    await admin.rpc("auth_email_mark_link_sent", { target: email });
  } catch {
    // The email already went out. A missed timer only means a second request
    // can send again, which the button and GoTrue's own limit still constrain.
  }
  return { status: "sent", notice: noticeFor(hint, mode, true) };
}

function prepared(email: string, redirectTo: string, mode: EmailMode): { email: string; redirectTo: string } | EmailLinkResult {
  const normalized = normalizeEmail(email);
  const callback = callbackRedirect(redirectTo);
  if (!normalized || !callback) {
    const decision = decideEmailLink({
      mode,
      emailOk: !!normalized,
      redirectOk: !!callback,
      hint: null,
      now: Date.now(),
    });
    if (decision.status === "error") return { status: "error", message: decision.message };
    return { status: "error", message: MESSAGES.badRedirect };
  }
  return { email: normalized, redirectTo: callback };
}

/**
 * First step of the email form. A Google-only (or other social) account is
 * mailed from here. An email account is left for the browser, which has to
 * start the PKCE cookie.
 */
export async function requestEmailLink(input: {
  email: string;
  redirectTo: string;
  mode: EmailMode;
}): Promise<EmailLinkResult> {
  const ready = prepared(input.email, input.redirectTo, input.mode);
  if ("status" in ready) return ready;

  const hint = await loadHint(ready.email);
  const decision = decideEmailLink({
    mode: input.mode,
    emailOk: true,
    redirectOk: true,
    hint,
    now: Date.now(),
  });
  if (decision.status === "error") return decision;
  if (decision.status === "otp") {
    return { status: "otp", shouldCreateUser: decision.shouldCreateUser, notice: decision.notice };
  }
  return issueLink(ready.email, ready.redirectTo, hint, input.mode);
}

/**
 * Used when Supabase accepted the account but could not send its own email.
 * The link is minted on the server and mailed through Resend. The action link
 * stays on the server.
 */
export async function deliverEmailLink(input: {
  email: string;
  redirectTo: string;
  mode: EmailMode;
}): Promise<EmailLinkResult> {
  const ready = prepared(input.email, input.redirectTo, input.mode);
  if ("status" in ready) return ready;

  const hint = await loadHint(ready.email);
  if (hint) {
    const decision = decideEmailLink({
      mode: input.mode,
      emailOk: true,
      redirectOk: true,
      hint,
      now: Date.now(),
    });
    // Cooldown, a missing account, and a suspension still win over a second send.
    if (decision.status === "error") return decision;
  }
  return issueLink(ready.email, ready.redirectTo, hint, input.mode);
}
