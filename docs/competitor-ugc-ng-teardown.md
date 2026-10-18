# Competitor teardown — ugc.ng (feature & page inventory for parity)

> **Purpose:** UGCOrigin must match or exceed everything ugc.ng does. This is the parity checklist. Captured 2026-10-17 from public pages (homepage, /pricing, /gigs, FAQ). Directory/gig *filter sets* load dynamically and need an authenticated browser pass to fully enumerate (TODO).
> **Note on data:** we are NOT harvesting ugc.ng's creator signups' personal data (privacy/NDPR risk). This is product/structure research only. See the recruitment playbook in the PRD discussion instead.

## Positioning & copy
- Tagline: "Nigeria's UGC marketplace." Hero: **"get content made."** / "Post a gig. Find creators. Any budget."
- Trust line: "Payments stay protected until the work is approved. Creators keep 100% of their rate."
- Built by Pristine3D (agency credit in footer).

## Navigation / page map
- **Top nav:** Gigs · Services · Creators · Blog · Log in · Sign up · Inbox icon.
- **Footer:** Gigs · Services · Creators · Pricing · Blog · Terms.
- **Key pages:** `/` · `/gigs` · `/gigs/new` (post a gig) · `/services` · `/creators` · `/pricing` · `/blog` · `/terms` · creator profiles · brand profiles · gig detail pages · campaign (per-view pool) pages · FAQ.

## Three product surfaces (we have 2; they have 3)
1. **Gigs** — brand-posted briefs creators apply to (our Path B). Stat shown: "15 gigs."
2. **Services** — creator-listed packages brands buy directly (Fiverr-style; our Packages, but as a browsable marketplace surface). Stat: "199 services," prices ₦5,000–₦25,000.
3. **Creators** — the directory. Stat: "1,187 creators."
> **Parity gap:** ugc.ng exposes **Services as its own browsable marketplace** (creator-listed fixed packages), distinct from Gigs (brand-posted). UGCOrigin should expose packages as a browsable "Services" surface too, not only on profiles.

## How hiring works (3 steps)
1. Post a gig OR send a direct offer.
2. Agree scope/deliverables/rate before money moves.
3. Fund the deal — brand pays upfront, funds held under purchase protection until approval.

## How money moves (4 steps) — escrow mechanics
1. Brand accepts an application and **pays upfront**.
2. Creator delivers; work submitted & reviewed **on-platform**.
3. **7-day review window** — brand approves or disputes with **one click from an email**. If brand is silent, **ugc.ng reviews the delivery and pays the creator only if it matches the brief.**
4. Payout to creator's **bank account the next day**.
- Funds "held by the platform, not sent to the creator." Disputes decided **against the written gig spec**, not who argues hardest.
- Nigerian **bank account required** for creators; bank transfer is the only payout method.

## Fees / pricing
- **Creators keep 100%.** **Brands pay 15% protection fee, ₦500 minimum.** Example: ₦50,000 gig → brand pays ₦57,500.
- Posting gigs, browsing, messaging = **free**. Fees apply when you fund a deal or buy visibility.
- **Paid visibility:** **Boost a Gig** = ₦5,000 / 7 days (priority + "Boosted" badge). **Featured Creator** = ₦5,000/month or ₦30,000/year (directory priority + instant campaign alerts).

## Gig types & card fields
- **Types:** "Original Post", "Affiliate" (commission, labeled **"Not payment protected"**), "Other".
- **Gig card shows:** title · type label · protection status · budget (₦ or "$74/sale") · posted date · "Posted by" brand link · applicant/submission count · **"Need N"** open-slots label for multi-creator gigs.

## Per-view "funded pool" campaigns (notable feature we lack)
- A brand funds a pool; creators submit; pay is **per views** (e.g., "Funded pool · ₦1,000 per 1,000 views").
- **Campaign pools, submissions, claims, payouts, and forfeited claims are publicly visible** on the campaign page.
- **Inflated view claims are forfeited, and the forfeit stays visible** (public anti-fraud shaming).
- Unspent campaign money → **wallet credit** (including its fee share).

## Creator card fields (directory)
- Location · skills/tags · **starting rate** · follower count. (Full filter set = TODO via browser.)

## Categories / niches / tags
- **Content types:** Voice Over, Unboxing, Video Testimonials, Brand Ambassador, Product Demo, AI UGC, Product Reviews, Social Posts, Podcast/Interview, Animation, Skits.
- **Production:** Videography, Modeling, Editing, Directing, Scriptwriting.
- **Verticals:** Beauty & Skincare, Styling & Makeup, Fashion, Food & Cooking, Travel & Lifestyle.

## FAQ / policy topics (parity for our Trust & Safety + FAQ pages)
Experience & equipment requirements · getting a first gig · location (outside Lagos OK; NG bank account required) · creator verification · **usage rights** · **paying from outside Nigeria** · earnings/rates · free creator accounts · payout timing · **non-payment & unfair-rejection policy** · discovery via search + AI tools · profile removal · account deletion · email contact.

## Wallet / credits
- Creators & brands have **wallets**; unspent campaign funds become wallet credit.

---

## Parity checklist for UGCOrigin (must-have ≥ ugc.ng)
- [ ] Three surfaces: **Gigs (briefs)**, **Services (creator packages, browsable)**, **Creators (directory)**.
- [ ] Escrow w/ **upfront funding**, funds held, **review window (ours configurable; default 7 days)**, **one-click email approve/dispute**, **platform fallback adjudication against the written brief**.
- [ ] **Next-day bank payout** (Paystack transfers), NG bank account required.
- [ ] Brand-side protection fee (ours **12%**, vs their 15%) + minimum floor.
- [ ] **Boost a Gig** + **Featured Creator** paid visibility (bounded; ours labeled, capped — §9 guardrail).
- [ ] **Gig types:** Original Post / Affiliate (unprotected, clearly labeled) / Other; **"Need N"** multi-slot gigs.
- [ ] **Per-view funded-pool campaigns** with public pools/claims/**forfeits** (strong anti-fraud + virality feature).
- [ ] **Wallets + credits** for both sides.
- [ ] Full **category/niche/tag taxonomy** (adopt theirs as a baseline, extend).
- [ ] **FAQ + policy pages** covering every topic above.
- [ ] **Free to post/browse/message**; fees only on funding/visibility.

## Where UGCOrigin must BEAT ugc.ng (our differentiation)
- Cleaner, Apple-grade, lightning-fast, mobile-first UI (theirs is functional, agency-built).
- Stronger **anti-AI / verified-human** positioning + stringent verification gate.
- **Heavier recommendation/ranking engine** (top 3–5 + interleaved suggestions; exploration quota).
- **Gamified weekly tier ladder + redemption + leaderboards** (they have none).
- **Live on-profile embeds** of X/IG/TikTok posts (view work without leaving platform).
- **Jolts** (native X-style posts) for creator presence/freshness.
- **Review syndication** to Trustpilot/Google (they don't syndicate).
- **AI assist** for briefs/contracts/profiles.
- Lower creator-facing friction via **"fuel money"** micro-fees vs their flat paid-visibility only.
- Deeper analytics (GA4/Clarity/Meta/PostHog) + SEO/AEO/GEO engine.
