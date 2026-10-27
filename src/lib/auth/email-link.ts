// Pure decisions for the email sign-in form. The server action does the
// lookup and the send; this file only decides what to say and which path to
// take, so the edge cases can be tested without a network call.

export const EMAIL_LINK_COOLDOWN_MS = 60_000;

const PRODUCTION_HOSTS = new Set(["www.ugcorigin.com", "ugcorigin.com"]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  facebook: "Meta",
  twitter: "X",
  apple: "Apple",
  github: "GitHub",
  azure: "Microsoft",
  linkedin: "LinkedIn",
  linkedin_oidc: "LinkedIn",
  slack: "Slack",
  discord: "Discord",
  notion: "Notion",
};

export type EmailMode = "login" | "signup";

export type AccountHint = {
  exists: boolean;
  banned: boolean;
  providers: string[];
  recoverySentAt: string | null;
};

export type EmailLinkResult =
  | { status: "otp"; shouldCreateUser: boolean; notice: string | null }
  | { status: "sent"; notice: string | null }
  | { status: "error"; message: string };

export type EmailLinkDecision =
  | { status: "otp"; shouldCreateUser: boolean; notice: string | null }
  | { status: "send" }
  | { status: "error"; message: string };

export const MESSAGES = {
  invalidEmail: "Enter a valid email address.",
  badRedirect: "This page can't send a sign-in link. Use the login page on UGCOrigin and try again.",
  noAccount:
    "No account uses this email yet. Create an account, or continue with Google if that's how you joined.",
  suspended: "This account is suspended. If that's a surprise, contact support.",
  cooldown: "A sign-in email was just sent. Wait a minute, then check your inbox or try again.",
  incomplete:
    "This sign-in record is incomplete. Continue with Google, or create an account with a different email.",
  notEmail: "This account doesn't use email sign-in. Continue with the method you used to join.",
  sendFailed:
    "We couldn't send the email. Wait a minute and try again, or continue with Google if that's how you joined.",
  redirect:
    "This site's address isn't on the sign-in allow list yet. Open ugcorigin.com and try again.",
  providerOff: "Email sign-in is turned off right now. Continue with Google.",
  generic: "Sign-in didn't finish. Please try again.",
  alreadyHave: "You already have an account. The link signs you into it.",
} as const;

/** Trim and lowercase. Returns null when the address is not something we should send to. */
export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  if (email.includes(" ") || email.includes("..")) return null;
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(email)) {
    return null;
  }
  return email;
}

/**
 * The only callback addresses we will put inside an email. Anything else is
 * dropped, including extra query params, so a link cannot bounce off-site.
 */
export function callbackRedirect(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.pathname !== "/auth/callback") return null;
  if (url.username || url.password) return null;

  const local = LOCAL_HOSTS.has(url.hostname);
  const production = PRODUCTION_HOSTS.has(url.hostname);
  if (!local && !production) return null;
  if (local) {
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.port !== "3000") return null;
  } else {
    if (url.protocol !== "https:") return null;
    if (url.port !== "" && url.port !== "443") return null;
  }

  const clean = new URL(`${url.origin}/auth/callback`);
  const role = url.searchParams.get("role");
  if (role === "brand" || role === "creator") clean.searchParams.set("role", role);
  return clean.toString();
}

export function linkSentRecently(sentAt: string | null, now: number): boolean {
  if (!sentAt) return false;
  const then = Date.parse(sentAt);
  if (Number.isNaN(then)) return false;
  const age = now - then;
  if (age < -5_000) return false;
  return age < EMAIL_LINK_COOLDOWN_MS;
}

export function socialLabels(providers: string[]): string[] {
  const labels = providers
    .filter((provider) => provider !== "email" && provider !== "phone")
    .map((provider) => PROVIDER_LABEL[provider] ?? "another sign-in provider");
  return [...new Set(labels)];
}

function joinProviders(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "your original sign-in";
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, or ${labels[labels.length - 1]}`;
}

/** What to tell someone whose account was created with Google, Meta, or X. */
export function socialNotice(labels: string[], mode: EmailMode, sent: boolean): string {
  const who = joinProviders(labels);
  if (!sent) {
    return `This email is connected to ${who}. Continue with ${who}. We couldn't email a sign-in link just now.`;
  }
  if (mode === "signup") {
    return `You already joined with ${who}. We sent a sign-in link to that same account, and you can also continue with ${who}.`;
  }
  return `This email is connected to ${who}. We sent a sign-in link to the same account, and you can also continue with ${who}.`;
}

export function noticeFor(hint: AccountHint | null, mode: EmailMode, sent: boolean): string | null {
  if (!hint?.exists) return null;
  const social = socialLabels(hint.providers);
  const hasEmail = hint.providers.includes("email");
  if (!hasEmail && social.length > 0) return socialNotice(social, mode, sent);
  if (sent && mode === "signup" && hasEmail) return MESSAGES.alreadyHave;
  return null;
}

/**
 * Choose the next step from a lookup. `hint === null` means the lookup itself
 * failed, so the browser falls back to the normal one-time link.
 */
export function decideEmailLink(input: {
  mode: EmailMode;
  emailOk: boolean;
  redirectOk: boolean;
  hint: AccountHint | null;
  now: number;
}): EmailLinkDecision {
  if (!input.emailOk) return { status: "error", message: MESSAGES.invalidEmail };
  if (!input.redirectOk) return { status: "error", message: MESSAGES.badRedirect };
  if (!input.hint) return { status: "otp", shouldCreateUser: input.mode === "signup", notice: null };

  const { hint, mode } = input;
  if (!hint.exists) {
    if (mode === "login") return { status: "error", message: MESSAGES.noAccount };
    return { status: "otp", shouldCreateUser: true, notice: null };
  }
  if (hint.banned) return { status: "error", message: MESSAGES.suspended };
  if (linkSentRecently(hint.recoverySentAt, input.now)) {
    return { status: "error", message: MESSAGES.cooldown };
  }
  if (hint.providers.length === 0) return { status: "error", message: MESSAGES.incomplete };

  const hasEmail = hint.providers.includes("email");
  const social = socialLabels(hint.providers);
  if (!hasEmail) {
    if (social.length === 0) return { status: "error", message: MESSAGES.notEmail };
    // Google (and the other social providers) have no email identity. Asking
    // Supabase to mail a magic link is the path that returns "Error sending
    // magic link". We send the link ourselves instead.
    return { status: "send" };
  }

  return {
    status: "otp",
    shouldCreateUser: false,
    notice: mode === "signup" ? MESSAGES.alreadyHave : null,
  };
}

/** GoTrue's mailer failed, or signup collided with an account that already exists. */
export function shouldFallbackToAppMailer(message: string): boolean {
  return isMailerFailure(message) || /already (been )?registered/i.test(message);
}

export function isMailerFailure(message: string): boolean {
  return /error sending (magic link|confirmation email|confirmation mail|recovery email|invite)/i.test(message);
}

/** Turn a Supabase auth error into a sentence. Never pass the raw message through. */
export function describeOtpError(message: string, code: string | null, mode: EmailMode): string {
  const text = message.trim();
  if (/banned/i.test(text) || code === "user_banned") return MESSAGES.suspended;
  if (/rate limit/i.test(text) || code === "over_email_send_rate_limit" || code === "over_request_rate_limit") {
    return MESSAGES.cooldown;
  }
  if (/redirect/i.test(text) && /not allowed|invalid/i.test(text)) return MESSAGES.redirect;
  if (/signups not allowed/i.test(text) || code === "otp_disabled") {
    return mode === "login" ? MESSAGES.noAccount : MESSAGES.sendFailed;
  }
  if (/provider.*disabled|email logins are disabled|magic link is disabled/i.test(text) || code === "email_provider_disabled") {
    return MESSAGES.providerOff;
  }
  if (/invalid/i.test(text) && /email/i.test(text)) return MESSAGES.invalidEmail;
  if (/already (been )?registered/i.test(text)) return MESSAGES.alreadyHave;
  return MESSAGES.generic;
}

/** Same mapping for failures from the admin link API, which must not reach the page. */
export function describeMintError(message: string): string {
  const text = message.trim();
  if (/banned/i.test(text)) return MESSAGES.suspended;
  if (/rate limit/i.test(text)) return MESSAGES.cooldown;
  if (/redirect/i.test(text)) return MESSAGES.redirect;
  return MESSAGES.sendFailed;
}
