"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { guardWrite } from "@/lib/admin/rbac";
import { broadcastNotify, type NotifyPayload } from "@/lib/notify";
import { logAudit } from "@/lib/admin/audit";

// Admin targeted broadcast: compose one notification (+ optional email) and fan
// it out to a resolved audience. The composer calls previewAudience first to
// show the admin how many people a target reaches, then sendBroadcast.

export type Audience = "user" | "all_users" | "all_creators" | "all_brands";

const CREATOR_TIERS = ["origin", "rising", "pro", "elite", "signature"] as const;
const BRAND_STATUSES = ["unverified", "pending", "verified", "rejected"] as const;

// Notification categories the admin can pick. The `type` maps to the pref the
// delivery pass respects (see PREF_BY_TYPE in notify.ts). "announcement" is not
// in that map, so it always delivers (for important, non-marketing messages).
export const BROADCAST_CATEGORIES: { value: string; label: string; note: string }[] = [
  { value: "announcement", label: "Announcement", note: "Always delivered — use for important news." },
  { value: "product", label: "Product update", note: "Respects each user's product-update email preference." },
  { value: "offer", label: "Offers & gigs", note: "Respects offers email preference." },
];

export type BroadcastInput = {
  audience: Audience;
  // Specific user: a handle (with or without @) or an email.
  identifier?: string;
  // Creator-class filters (ignored for other audiences).
  tier?: string;
  liveOnly?: boolean;
  verifiedOnly?: boolean;
  niche?: string;
  region?: string;
  // Brand-class filter.
  brandVerification?: string;
  // Message.
  title: string;
  body: string;
  href?: string;
  category: string;
  sendEmail: boolean;
  emailSubject?: string;
  ctaLabel?: string;
};

type Admin = ReturnType<typeof createAdminClient>;

/** Resolve a broadcast target to the set of recipient user ids. */
async function resolveAudience(admin: Admin, input: BroadcastInput): Promise<string[]> {
  if (input.audience === "user") {
    const raw = (input.identifier ?? "").trim();
    if (!raw) return [];
    if (raw.includes("@")) {
      const { data } = await admin.from("profiles").select("id").eq("email", raw.toLowerCase()).maybeSingle();
      return data ? [data.id as string] : [];
    }
    const handle = raw.replace(/^@/, "");
    const { data } = await admin.from("creator_profiles").select("id").eq("handle", handle).maybeSingle();
    return data ? [data.id as string] : [];
  }

  if (input.audience === "all_users") {
    const { data } = await admin.from("profiles").select("id");
    return (data ?? []).map((r) => r.id as string);
  }

  if (input.audience === "all_creators") {
    let q = admin.from("creator_profiles").select("id");
    if (input.tier && (CREATOR_TIERS as readonly string[]).includes(input.tier)) q = q.eq("tier", input.tier);
    if (input.liveOnly) q = q.eq("is_live", true);
    if (input.verifiedOnly) q = q.eq("identity_verified", true);
    if (input.niche?.trim()) q = q.contains("niches", [input.niche.trim()]);
    if (input.region?.trim()) q = q.ilike("location", `%${input.region.trim()}%`);
    const { data } = await q;
    return (data ?? []).map((r) => r.id as string);
  }

  // all_brands
  let q = admin.from("brand_profiles").select("id");
  if (input.brandVerification && (BRAND_STATUSES as readonly string[]).includes(input.brandVerification)) {
    q = q.eq("verification_status", input.brandVerification);
  }
  const { data } = await q;
  return (data ?? []).map((r) => r.id as string);
}

function describeAudience(input: BroadcastInput): Record<string, unknown> {
  const base: Record<string, unknown> = { audience: input.audience };
  if (input.audience === "user") base.identifier = input.identifier;
  if (input.audience === "all_creators") {
    base.filters = { tier: input.tier || null, liveOnly: !!input.liveOnly, verifiedOnly: !!input.verifiedOnly, niche: input.niche || null, region: input.region || null };
  }
  if (input.audience === "all_brands") base.filters = { verification: input.brandVerification || null };
  return base;
}

/** Count how many users a target resolves to, without sending anything. */
export async function previewAudience(input: BroadcastInput): Promise<{ count?: number; error?: string }> {
  const { error } = await guardWrite("comms");
  if (error) return { error };
  const admin = createAdminClient();
  try {
    const ids = await resolveAudience(admin, input);
    return { count: new Set(ids).size };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not resolve the audience." };
  }
}

/** Resolve the audience and fan the message out. Audited. */
export async function sendBroadcast(input: BroadcastInput): Promise<{ ok?: boolean; result?: { recipients: number; notified: number; emailed: number }; error?: string }> {
  const { ctx, error } = await guardWrite("comms");
  if (error || !ctx) return { error: error ?? "Not permitted." };

  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return { error: "Add a title." };
  if (!body) return { error: "Add a message." };

  const admin = createAdminClient();
  let ids: string[];
  try {
    ids = await resolveAudience(admin, input);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not resolve the audience." };
  }
  if (ids.length === 0) return { error: "That target matched nobody." };

  const payload: NotifyPayload = {
    type: input.category || "announcement",
    title,
    body,
    href: input.href?.trim() || null,
    emailSubject: input.emailSubject?.trim() || undefined,
    ctaLabel: input.ctaLabel?.trim() || undefined,
    skipEmail: !input.sendEmail,
    source: "broadcast",
  };

  const result = await broadcastNotify(admin, ids, payload);

  await logAudit(admin, ctx.userId, "comms.broadcast", {
    targetType: "broadcast",
    after: {
      ...describeAudience(input),
      category: payload.type,
      sendEmail: input.sendEmail,
      title,
      ...result,
    },
  });

  return { ok: true, result };
}
