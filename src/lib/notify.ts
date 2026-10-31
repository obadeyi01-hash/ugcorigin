import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import { verifyPromptEmail } from "@/lib/email/templates";

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

const VERIFY_COOLDOWN_MS = 20 * 60 * 60 * 1000;

/**
 * In-app note plus the branded verify email. Skips a repeat if one was sent
 * in the last 20 hours, so a dashboard click and onboarding don't double up.
 */
export async function sendVerifyPrompt(
  admin: Admin,
  userId: string,
  role: "creator" | "brand",
): Promise<{ sent: boolean }> {
  const since = new Date(Date.now() - VERIFY_COOLDOWN_MS).toISOString();
  const { data: recent } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "verify_prompt")
    .gte("created_at", since)
    .limit(1);
  if (recent && recent.length > 0) return { sent: false };

  const creator = role === "creator";
  const href = creator ? "/verify" : "/settings";
  const title = creator ? "Finish verification to go live" : "Verify your brand";
  const body = creator
    ? "Add your bank, submit your photo and NIN, and accept the agreement. Brands can't find you until that's done."
    : "Submit your registered business name and CAC/RC number. The Verified brand badge shows on your offers once it's approved.";

  await notifyUser(admin, userId, {
    type: "verify_prompt",
    title,
    body,
    href,
    ctaLabel: creator ? "Continue verification" : "Verify your brand",
    skipEmail: true,
  });

  if (emailConfigured()) {
    const [{ data: authUser }, { data: creatorRow }, { data: brandRow }] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      creator ? admin.from("creator_profiles").select("first_name, display_name").eq("id", userId).maybeSingle() : Promise.resolve({ data: null }),
      creator ? Promise.resolve({ data: null }) : admin.from("brand_profiles").select("contact_first_name, company_name").eq("id", userId).maybeSingle(),
    ]);
    const email = authUser.user?.email;
    const name = creator
      ? creatorRow?.first_name || creatorRow?.display_name
      : brandRow?.contact_first_name || brandRow?.company_name;
    if (email) await sendEmail(verifyPromptEmail(email, { name, role }));
  }
  return { sent: true };
}

/** Tell trust & safety (and super admins) that a review is waiting. */
export async function notifyAdminsPendingReview(
  admin: Admin,
  payload: { title: string; body: string; href: string },
): Promise<void> {
  const { data: admins } = await admin
    .from("admin_users")
    .select("user_id")
    .in("role", ["super_admin", "trust_safety"]);
  const ids = (admins ?? []).map((a) => a.user_id as string).filter(Boolean);
  if (ids.length === 0) return;
  await notifyMany(
    admin,
    ids.map((userId) => ({
      userId,
      payload: { type: "admin_review", title: payload.title, body: payload.body, href: payload.href, ctaLabel: "Open the queue" },
    })),
  );
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
          }).then((r) => r.ok).catch(() => false),
        ),
      );
      emailed += sent.filter(Boolean).length;
    }
  }

  return { recipients: ids.length, notified, emailed };
}
