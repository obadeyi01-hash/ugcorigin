import "server-only";
import type { EmailInput } from "./send";

// Well-written transactional templates for the big "you're approved" moments.
// These are important enough to always send (not gated behind product-update
// preferences), so the admin verify paths send them directly via sendEmail.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ugcorigin.com";

const P = "margin:0 0 12px;color:#3f3f46;font-size:15px;line-height:1.6";
const LI = "margin:0 0 8px;color:#3f3f46;font-size:15px;line-height:1.5";

/** Minimal HTML escape for names that go into the template. */
function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function nextSteps(items: string[]): string {
  return `<ul style="margin:0 0 4px;padding-left:20px">${items.map((i) => `<li style="${LI}">${i}</li>`).join("")}</ul>`;
}

/** Creator identity verified → profile is live in the directory. */
export function creatorApprovedEmail(to: string, opts: { name?: string | null; handle?: string | null }): EmailInput {
  const name = opts.name?.trim() ? esc(opts.name.trim().split(/\s+/)[0]) : "there";
  const bodyHtml = `
    <p style="${P}">Hi ${name}, great news — your identity is verified and your UGCOrigin profile is now <strong>live in the creator directory</strong>. Brands can find you, view your work, and send you offers.</p>
    <p style="${P}">Here's how to make the most of it:</p>
    ${nextSteps([
      "Add your bank details so payouts land the moment a gig is approved.",
      "Polish your profile — add packages, portfolio links and a few sample videos.",
      "Browse open briefs and apply to the ones that fit your niche.",
      "Keep your response time quick — it lifts you up the tier ladder.",
    ])}
    <p style="${P}">Welcome aboard. We're glad you're here.</p>`;
  return {
    to,
    subject: "You're verified — your UGCOrigin profile is live 🎉",
    heading: "You're verified and live",
    body: "Your identity is verified and your profile is now live in the creator directory.",
    bodyHtml,
    preheader: "Brands can now find and hire you on UGCOrigin.",
    ctaLabel: "Open your dashboard",
    ctaUrl: `${SITE}/dashboard`,
  };
}

/** Brand business verification approved → Verified brand badge. */
export function brandApprovedEmail(to: string, opts: { companyName?: string | null }): EmailInput {
  const company = opts.companyName?.trim() ? esc(opts.companyName.trim()) : "your business";
  const bodyHtml = `
    <p style="${P}">Good news — <strong>${company}</strong> is now a verified brand on UGCOrigin. Creators see a <strong>Verified brand</strong> badge on your offers and briefs, which builds trust and gets you more (and better) applicants.</p>
    <p style="${P}">Here's what to do next:</p>
    ${nextSteps([
      "Post a brief describing the content you need — the clearer the ask, the stronger the responses.",
      "Browse the creator directory and make direct offers to creators you like.",
      "Fund gigs through secure escrow — creators only get paid once you approve the work.",
      "Save creators you want to work with again for faster re-bookings.",
    ])}
    <p style="${P}">Let's get your first campaign moving.</p>`;
  return {
    to,
    subject: "Your brand is verified on UGCOrigin ✓",
    heading: "Your brand is verified",
    body: "Your business is verified. Creators now see a Verified brand badge on your offers.",
    bodyHtml,
    preheader: "The Verified brand badge now shows on your offers and briefs.",
    ctaLabel: "Browse creators",
    ctaUrl: `${SITE}/creators`,
  };
}
