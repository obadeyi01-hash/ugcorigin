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

function render({ heading, body, bodyHtml, preheader, ctaLabel, ctaUrl }: EmailInput): string {
  const button =
    ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:20px;padding:12px 22px;background:#ec4899;color:#fff;border-radius:999px;font-weight:600;text-decoration:none">${ctaLabel}</a>`
      : "";
  const content = bodyHtml ?? `<p style="margin:0;color:#3f3f46;font-size:15px;line-height:1.6">${body}</p>`;
  const hidden = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  ${hidden}
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="font-weight:800;font-size:20px;letter-spacing:-0.3px"><span style="color:#ec4899">UGC</span>ORIGIN</div>
    <div style="margin-top:20px;background:#fff;border:1px solid #ececea;border-radius:16px;padding:28px">
      <h1 style="margin:0 0 12px;font-size:20px;color:#141519">${heading}</h1>
      ${content}
      ${button}
    </div>
    <p style="margin:18px 2px 0;color:#9a9a95;font-size:12px">You're receiving this from ${BRAND}. Manage email preferences in your settings.</p>
  </div></body></html>`;
}

/** Send one transactional email. Returns true if actually sent. */
export async function sendEmail(input: EmailInput): Promise<boolean> {
  if (!emailConfigured()) return false;
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
    return res.ok;
  } catch {
    return false;
  }
}
