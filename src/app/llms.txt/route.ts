import { JOURNAL } from "@/content/journal";
import { SITE_URL } from "@/components/seo/json-ld";

// llms.txt, a concise, structured site summary for AI / answer / generative
// engines (AEO/GEO). Plain-text Markdown, no private data. The journal list is
// generated from the same posts the sitemap and RSS feed use, so it grows
// when a post is added.
export function GET() {
  const journal = JOURNAL.map((post) => `- [${post.date}] ${post.title}: ${SITE_URL}/journal/${post.slug}`).join("\n");
  const body = `# UGCOrigin

> The creator network for original, human, verified content. Nigeria-first. Hire identity-verified UGC creators with escrow-protected payments.

UGCOrigin (a product by Dream Intrepid Ltd.) connects brands with real, identity-verified Nigerian creators for authentic user-generated content, video, images, testimonials, unboxings and more. It is deliberately anti-AI: every creator is a verified human, never an AI avatar or generated content.

Creators appear in the directory and in the sitemap only when their profile is live. Briefs and campaigns appear publicly only when the brand is verified. An unverified account can sign up. It cannot post, apply, or be indexed.

## How it works
- Brands verify their CAC/RC number, then post a brief, fund a campaign, or send an offer. Creators finish identity verification, then apply or accept.
- Creators deliver in a shared workspace; brands review and approve.
- On approval, escrow releases and the creator is paid out to a Nigerian bank account.

## Money
- Creators keep 100% of their agreed rate (no creator-side cut).
- Brands pay a 12% service fee on the creator rate, plus the current tax. A ₦20,000 video costs the brand ₦22,400 before tax. The creator keeps ₦20,000. The exact charge is shown before payment.
- Creators set their own rates within tier-based price floors (from NGN 10,000 at entry); they climb 7 tiers (Origin, Rising, Pro, Standout, Elite, Signature, Luminary) by completing work and earning reviews.
- Per-view campaigns: brands fund a pool and pay creators per 1,000 verified views. The payout cannot exceed the money still in the pool.

## Key pages
- Find creators: ${SITE_URL}/creators
- For brands: ${SITE_URL}/for-brands
- For creators: ${SITE_URL}/for-creators
- Pricing: ${SITE_URL}/pricing
- Documentation (fees, escrow, payouts, trust & safety): ${SITE_URL}/docs
- Open briefs: ${SITE_URL}/briefs
- Per-view campaigns: ${SITE_URL}/campaigns
- Journal: ${SITE_URL}/journal
- Journal feed: ${SITE_URL}/journal/feed.xml
- Sitemap: ${SITE_URL}/sitemap.xml

## Journal
${journal}

## Trust & safety
- Escrow on every deal; funds released only on approval.
- Identity-verified creators only. Verified brands only, for anything public.
- Disputes are decided against the written brief using the workspace record.
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
