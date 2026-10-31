import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export type SignalEvent =
  | "brand_signup"
  | "brand_verify"
  | "creator_signup"
  | "creator_verify"
  | "first_seen";

/**
 * Record a passive integrity signal for an account event: the IP, an
 * approximate geolocation, and the device string. Geo comes from the edge
 * (Vercel's `x-vercel-ip-*` headers) so there is NO browser permission prompt;
 * it is coarse (country / region / city), which is what a fraud signal needs.
 *
 * Best-effort: this never throws into the caller. A missing signal must never
 * block a signup or a verification.
 */
export async function captureAccountSignal(userId: string, event: SignalEvent): Promise<void> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for") || "";
    const ip = forwarded.split(",")[0].trim() || h.get("x-real-ip") || null;
    const userAgent = h.get("user-agent")?.slice(0, 400) || null;
    const country = h.get("x-vercel-ip-country") || null;
    const region = h.get("x-vercel-ip-country-region") || null;
    const rawCity = h.get("x-vercel-ip-city");
    const city = rawCity ? safeDecode(rawCity) : null;

    const admin = createAdminClient();
    await admin.from("account_signals").insert({
      user_id: userId,
      event,
      ip,
      country,
      region,
      city,
      user_agent: userAgent,
    });
  } catch (err) {
    console.error("[signals] capture failed:", err instanceof Error ? err.message : "unknown");
  }
}

/**
 * Capture a one-time `first_seen` signal for an account that has none yet, so
 * accounts created before signal capture existed get backfilled on their next
 * visit. No-op once any signal exists.
 */
export async function captureFirstSeen(userId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("account_signals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count ?? 0) > 0) return;
    await captureAccountSignal(userId, "first_seen");
  } catch {
    /* ignore */
  }
}

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}
