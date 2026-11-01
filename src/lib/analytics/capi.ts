// Meta Conversions API (CAPI) — SERVER ONLY. Sends conversion events straight to
// Meta from our server, so we still measure the money moments (Purchase,
// Subscribe) even when the browser pixel is blocked, an ad-blocker is on, or the
// payment completes on a Paystack redirect + webhook the browser never sees.
//
// Deduplication: every event carries a stable `event_id`. When the same logical
// event is also sent by the browser pixel, give both the SAME event_name +
// event_id and Meta drops the duplicate. Our money events are server-only (the
// browser is on Paystack's domain when they complete), so there is nothing to
// double-count — we use the Paystack reference as the id purely so Paystack's
// own webhook retries collapse to one conversion.
//
// Nothing is sent unless BOTH the dataset id (NEXT_PUBLIC_META_PIXEL_ID) and the
// access token (META_CAPI_ACCESS_TOKEN) are set — with no token this is a silent
// no-op, so it is safe to call unconditionally.
import "server-only";
import crypto from "crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
// Optional: set to the code from Events Manager → Test events to watch events
// land live while you verify the setup. Leave unset in normal production.
const TEST_CODE = process.env.META_CAPI_TEST_EVENT_CODE;
const API_VERSION = "v21.0";
// Verbose by default (the account asked for maximum visibility). Set
// META_CAPI_VERBOSE=0 to quiet the logs once you trust the pipe.
const VERBOSE = process.env.META_CAPI_VERBOSE !== "0";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ugcorigin.com").replace(/\/$/, "");

export function capiConfigured(): boolean {
  return !!(PIXEL_ID && TOKEN);
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// Meta requires identifiers normalized (trim + lowercase) then SHA-256 hashed.
function hashEmail(email?: string | null): string[] | undefined {
  if (!email) return undefined;
  const norm = email.trim().toLowerCase();
  if (!norm || !norm.includes("@")) return undefined;
  return [sha256(norm)];
}

export type CapiEvent = {
  eventName: string; // "Purchase" | "Subscribe" | "CompleteRegistration" | "Lead" | ...
  eventId: string; // stable id for dedup / retry-collapse (we use the Paystack reference)
  eventTime?: number; // unix seconds; defaults to now
  email?: string | null; // raw email; normalized + hashed here
  value?: number;
  currency?: string; // e.g. "NGN"
  contentName?: string;
  contentType?: string;
  contentIds?: string[];
  eventSourceUrl?: string; // defaults to the site URL
  clientIp?: string | null;
  userAgent?: string | null;
  custom?: Record<string, unknown>;
};

/**
 * Fire-and-forget: POST one or more events to the Conversions API. NEVER throws
 * — tracking must not break a payment webhook — and returns true only when Meta
 * accepted the batch. Await it in serverless handlers so the request actually
 * flushes before the function freezes.
 */
export async function sendCapiEvents(events: CapiEvent[]): Promise<boolean> {
  if (!capiConfigured() || events.length === 0) return false;
  const now = Math.floor(Date.now() / 1000);

  const data = events.map((e) => {
    const user_data: Record<string, unknown> = {};
    const em = hashEmail(e.email);
    if (em) user_data.em = em;
    if (e.clientIp) user_data.client_ip_address = e.clientIp;
    if (e.userAgent) user_data.client_user_agent = e.userAgent;

    const custom_data: Record<string, unknown> = { ...(e.custom ?? {}) };
    if (e.value != null) custom_data.value = e.value;
    if (e.currency) custom_data.currency = e.currency;
    if (e.contentName) custom_data.content_name = e.contentName;
    if (e.contentType) custom_data.content_type = e.contentType;
    if (e.contentIds) custom_data.content_ids = e.contentIds;

    return {
      event_name: e.eventName,
      event_time: e.eventTime ?? now,
      event_id: e.eventId,
      action_source: "website",
      event_source_url: e.eventSourceUrl ?? SITE_URL,
      user_data,
      custom_data,
    };
  });

  const body: Record<string, unknown> = { data };
  if (TEST_CODE) body.test_event_code = TEST_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(TOKEN!)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      fbtrace_id?: string;
      error?: { message?: string };
    };
    if (!res.ok) {
      if (VERBOSE) console.error(`[CAPI] rejected ${res.status}: ${json?.error?.message ?? JSON.stringify(json)}`);
      return false;
    }
    if (VERBOSE) {
      const names = events.map((e) => `${e.eventName}${e.value != null ? `(₦${e.value})` : ""}`).join(", ");
      console.log(`[CAPI] sent ${events.length} event(s) [${names}] → received=${json?.events_received ?? "?"} fbtrace=${json?.fbtrace_id ?? "-"}`);
    }
    return true;
  } catch (err) {
    if (VERBOSE) console.error("[CAPI] network error:", err);
    return false;
  }
}

/** Convenience single-event sender. */
export function sendCapiEvent(event: CapiEvent): Promise<boolean> {
  return sendCapiEvents([event]);
}
