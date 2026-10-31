import "server-only";

// Transactional email via Resend's HTTP API. Fully env-gated: with no
// RESEND_API_KEY set it is a silent no-op, so the app works without email
// configured and never throws into a user action.
//
// Env:
//   RESEND_API_KEY   server-side key
//   EMAIL_FROM       e.g. UGCOrigin <no-reply@hey.ugcorigin.com> (NO quotes).
//                    Must be an address on the Resend-VERIFIED sending domain:
//                    the hey.ugcorigin.com subdomain, not the apex ugcorigin.com.
//                    A From on an unverified domain is rejected on every send.

const BRAND = "UGCOrigin";

export const emailConfigured = () => !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

/** Why a send did not go out, so callers (and the admin UI) can say which. */
export type SendFailure = "not_configured" | "rejected" | "error";
export type SendResult = { ok: true } | { ok: false; reason: SendFailure; detail: string };

export type EmailInput = {
  to: string;
  subject: string;
  heading: string;
  /** Plain one-paragraph body. Ignored when `bodyHtml` is given. */
  body: string;
  /**
   * Rich HTML body block (paragraphs, lists…) used instead of wrapping `body`
   * in a single <p>. Caller is responsible for escaping any untrusted text.
   */
  bodyHtml?: string;
  /** Short hidden preview text shown in the inbox line next to the subject. */
  preheader?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** http(s) only, or a same-site path turned into an absolute link. */
function safeHref(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://ugcorigin.com").replace(/\/$/, "");
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) return `${site}${url}`;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
  } catch {
    return undefined;
  }
  return undefined;
}

function render({ heading, body, bodyHtml, preheader, ctaLabel, ctaUrl }: EmailInput): string {
  const href = safeHref(ctaUrl);
  const button =
    ctaLabel && href
      ? `<a href="${esc(href)}" style="display:inline-block;margin-top:20px;padding:12px 22px;background:#ec4899;color:#fff;border-radius:999px;font-weight:600;text-decoration:none">${esc(ctaLabel)}</a>`
      : "";
  const content = bodyHtml ?? `<p style="margin:0;color:#3f3f46;font-size:15px;line-height:1.6">${esc(body)}</p>`;
  const hidden = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  ${hidden}
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="font-weight:800;font-size:20px;letter-spacing:-0.3px"><span style="color:#ec4899">UGC</span>ORIGIN</div>
    <div style="margin-top:20px;background:#fff;border:1px solid #ececea;border-radius:16px;padding:28px">
      <h1 style="margin:0 0 12px;font-size:20px;color:#141519">${esc(heading)}</h1>
      ${content}
      ${button}
    </div>
    <p style="margin:18px 2px 0;color:#9a9a95;font-size:12px">You're receiving this from ${BRAND}. Manage email preferences in your settings.</p>
  </div></body></html>`;
}

/** Pull a short human reason out of a Resend error body (it returns JSON like
 * {"message":"The hey.ugcorigin.com domain is not verified..."}). */
function resendReason(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed.message === "string" && parsed.message.trim()) return parsed.message.trim();
  } catch {
    /* not JSON */
  }
  return `Resend returned HTTP ${status}`;
}

/** Send one transactional email.
 *
 * Never throws. Returns a typed result so callers can tell a missing env var
 * (`not_configured`) from a Resend rejection (`rejected`, e.g. an unverified
 * sending domain or a malformed `EMAIL_FROM`) from a transport failure
 * (`error`). Every failure is also logged, with the `from` echoed so a stray
 * quote or wrong sending domain is obvious at a glance. */
export async function sendEmail(input: EmailInput): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    const missing = !process.env.RESEND_API_KEY ? "RESEND_API_KEY" : "EMAIL_FROM";
    console.warn(`[email] skipped: ${missing} is not set in this environment`);
    return { ok: false, reason: "not_configured", detail: `${missing} is not set` };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: render(input),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const detail = resendReason(res.status, body);
      console.error(
        `[email] Resend rejected the send (HTTP ${res.status}) from=${JSON.stringify(process.env.EMAIL_FROM)} to=${JSON.stringify(input.to)}: ${body.slice(0, 500)}`,
      );
      return { ok: false, reason: "rejected", detail };
    }
    return { ok: true };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    console.error("[email] request to Resend failed:", detail);
    return { ok: false, reason: "error", detail };
  }
}
