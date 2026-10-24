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
  /** Insert the in-app notification only; skip the email (e.g. when the caller
   *  sends its own richer transactional email separately). */
  skipEmail?: boolean;
  /** Tag the stored row (e.g. "broadcast") so it's distinguishable from the
   *  transactional notifications the app creates on its own. */
  source?: string | null;
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
    source: p.source ?? null,
  });

  if (p.skipEmail || !emailConfigured()) return;

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

const INSERT_CHUNK = 500;
const EMAIL_CONCURRENCY = 20;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export type BroadcastResult = { recipients: number; notified: number; emailed: number };

/**
 * Fan a single payload out to many users efficiently — one bulk insert per
 * chunk for the in-app notifications, then (when email is configured and the
 * payload wants email) a batched, preference-respecting email pass. Used by the
 * admin broadcast console. Best-effort throughout: a failed email never blocks
 * the in-app delivery. Returns counts for the audit trail.
 */
export async function broadcastNotify(
  admin: Admin,
  userIds: string[],
  p: NotifyPayload,
): Promise<BroadcastResult> {
  const ids = Array.from(new Set(userIds)).filter(Boolean);
  if (ids.length === 0) return { recipients: 0, notified: 0, emailed: 0 };

  // 1) In-app notifications — bulk insert, chunked.
  let notified = 0;
  for (const part of chunk(ids, INSERT_CHUNK)) {
    const rows = part.map((user_id) => ({
      user_id,
      type: p.type,
      title: p.title,
      body: p.body,
      href: p.href ?? null,
      source: p.source ?? "broadcast",
    }));
    const { error } = await admin.from("notifications").insert(rows);
    if (!error) notified += part.length;
  }

  // 2) Emails — optional, batched, preference-respecting.
  let emailed = 0;
  if (!p.skipEmail && emailConfigured()) {
    // Resolve recipient emails from profiles in bulk (avoids per-user auth calls).
    const emailById = new Map<string, string>();
    for (const part of chunk(ids, INSERT_CHUNK)) {
      const { data } = await admin.from("profiles").select("id, email").in("id", part);
      (data ?? []).forEach((r) => {
        if (r.email) emailById.set(r.id as string, r.email as string);
      });
    }

    // Opt-outs for this category (default on when unset).
    const prefKey = PREF_BY_TYPE[p.type];
    const optedOut = new Set<string>();
    if (prefKey) {
      for (const part of chunk(ids, INSERT_CHUNK)) {
        const { data } = await admin.from("user_settings").select(`user_id, ${prefKey}`).in("user_id", part);
        (data ?? []).forEach((s) => {
          const rec = s as Record<string, unknown>;
          if (rec[prefKey] === false) optedOut.add(rec.user_id as string);
        });
      }
    }

    const targets = ids.filter((id) => emailById.has(id) && !optedOut.has(id));
    const site = SITE;
    const ctaUrl = p.href ? (p.href.startsWith("http") ? p.href : `${site}${p.href}`) : site;
    for (const part of chunk(targets, EMAIL_CONCURRENCY)) {
      const sent = await Promise.all(
        part.map((id) =>
          sendEmail({
            to: emailById.get(id)!,
            subject: p.emailSubject || p.title,
            heading: p.title,
            body: p.body,
            ctaLabel: p.ctaLabel || "Open UGCOrigin",
            ctaUrl,
          }).catch(() => false),
        ),
      );
      emailed += sent.filter(Boolean).length;
    }
  }

  return { recipients: ids.length, notified, emailed };
}
