import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailConfigured } from "@/lib/email/send";

type Admin = ReturnType<typeof createAdminClient>;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ugcorigin.com";

export type NotifyPayload = {
  type: string;
  title: string;
  body: string;
  href?: string | null;
  /** Override the email subject (defaults to the title). */
  emailSubject?: string;
  /** Override the email CTA label. */
  ctaLabel?: string;
};

// Which notification types respect which user preference. Types not listed are
// always delivered (disputes, security/AI warnings, etc.).
const PREF_BY_TYPE: Record<string, "notify_offers" | "notify_payouts" | "notify_reviews" | "notify_product"> = {
  offer: "notify_offers",
  offer_accepted: "notify_offers",
  offer_declined: "notify_offers",
  draft_submitted: "notify_offers",
  revision_requested: "notify_offers",
  gig_update: "notify_offers",
  message: "notify_offers",
  payout: "notify_payouts",
  payout_sent: "notify_payouts",
  review: "notify_reviews",
  review_received: "notify_reviews",
  product: "notify_product",
};

/**
 * Create an in-app notification and, when email is configured and the user
 * hasn't opted out, send a matching email. Best-effort: email failures never
 * break the caller. Always inserts the in-app notification.
 */
export async function notifyUser(admin: Admin, userId: string, p: NotifyPayload): Promise<void> {
  await admin.from("notifications").insert({
    user_id: userId,
    type: p.type,
    title: p.title,
    body: p.body,
    href: p.href ?? null,
  });

  if (!emailConfigured()) return;

  // Respect the user's preference for this category (default on if unset).
  const prefKey = PREF_BY_TYPE[p.type];
  if (prefKey) {
    const { data: settings } = await admin.from("user_settings").select(prefKey).eq("user_id", userId).maybeSingle();
    const val = settings ? (settings as Record<string, boolean | null>)[prefKey] : null;
    if (val === false) return;
  }

  const { data } = await admin.auth.admin.getUserById(userId);
  const email = data.user?.email;
  if (!email) return;

  await sendEmail({
    to: email,
    subject: p.emailSubject || p.title,
    heading: p.title,
    body: p.body,
    ctaLabel: p.ctaLabel || "Open UGCOrigin",
    ctaUrl: p.href ? (p.href.startsWith("http") ? p.href : `${SITE}${p.href}`) : SITE,
  });
}

/** Insert several in-app notifications + emails. */
export async function notifyMany(admin: Admin, items: { userId: string; payload: NotifyPayload }[]): Promise<void> {
  for (const it of items) await notifyUser(admin, it.userId, it.payload);
}
