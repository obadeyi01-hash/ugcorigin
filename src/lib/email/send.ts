import "server-only";

// Transactional email via Resend's HTTP API. Fully env-gated: with no
// RESEND_API_KEY set it is a silent no-op, so the app works without email
// configured and never throws into a user action.
//
// Env:
//   RESEND_API_KEY   server-side key
//   EMAIL_FROM       e.g. "UGCOrigin <hello@ugcorigin.com>" (verified sender)

const BRAND = "UGCOrigin";

export const emailConfigured = () => !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

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

/** Send one transactional email. Returns true if actually sent.
 *
 * Failures are logged (never thrown) so the reason is visible in the server
 * logs: a missing env var, or the exact rejection Resend returned (an
 * unverified sending domain and a malformed `EMAIL_FROM` are the usual two).
 * The logged `from` makes a stray quote or wrong domain obvious at a glance. */
export async function sendEmail(input: EmailInput): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.warn(
      `[email] skipped: ${!process.env.RESEND_API_KEY ? "RESEND_API_KEY" : "EMAIL_FROM"} is not set in this environment`,
    );
    return false;
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
      const detail = await res.text().catch(() => "");
      console.error(
        `[email] Resend rejected the send (HTTP ${res.status}) from=${JSON.stringify(process.env.EMAIL_FROM)} to=${JSON.stringify(input.to)}: ${detail.slice(0, 500)}`,
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] request to Resend failed:", err instanceof Error ? err.message : "unknown");
    return false;
  }
}
