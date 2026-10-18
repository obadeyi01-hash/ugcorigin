import { SITE_URL } from "@/components/seo/json-ld";

// llms.txt, a concise, structured site summary for AI / answer / generative
// engines (AEO/GEO). Plain-text Markdown, no private data.
const BODY = `# UGCOrigin

> The creator network for original, human, verified content. Nigeria-first. Hire identity-verified UGC creators with escrow-protected payments.

UGCOrigin (a product by Dream Intrepid Ltd.) connects brands with real, identity-verified Nigerian creators for authentic user-generated content, video, images, testimonials, unboxings and more. It is deliberately anti-AI: every creator is a verified human, never an AI avatar or generated content.

## How it works
- Brands post a brief or browse verified creators, agree a deal, and fund it into escrow.
- Creators deliver in a shared workspace; brands review and approve.
- On approval, escrow releases and the creator gets a next-day payout to a Nigerian bank account.

## Money
- Creators keep 100% of their agreed rate (no creator-side cut).
- Brands pay a small flat service fee, always shown before payment; it funds escrow, verification and payouts.
- Creators set their own rates within tier-based price floors (from NGN 10,000 at entry); they climb 7 tiers (Origin, Rising, Pro, Standout, Elite, Signature, Luminary) by completing work and earning reviews.
- Per-view campaigns: brands fund a pool and pay creators per 1,000 verified views.

## Key pages
- Find creators: ${SITE_URL}/creators
- For brands: ${SITE_URL}/for-brands
- For creators: ${SITE_URL}/for-creators
- Pricing: ${SITE_URL}/pricing
- Documentation (fees, escrow, payouts, trust & safety): ${SITE_URL}/docs
- Open briefs: ${SITE_URL}/briefs
- Per-view campaigns: ${SITE_URL}/campaigns

## Trust & safety
- Escrow on every deal; funds released only on approval.
- Identity-verified creators only.
- Disputes are decided against the written brief using the workspace record.
`;

export async function GET() {
  return new Response(BODY, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
