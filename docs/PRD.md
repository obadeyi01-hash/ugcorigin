# UGCOrigin — Product Requirements Document (PRD)

> **Status:** Living document — v0.35
> **Last updated:** 2026-10-17
> **Parent entity:** Dream Intrepid Ltd. (UGCOrigin is a product in the Dream Intrepid ecosystem)
> **Owner:** Founder (obadeyi04@gmail.com)
> **Canonical location:** `docs/PRD.md`. Single source of truth. Update progressively with a dated Changelog entry; never fork into side copies.
> **Budget posture:** LEAN / near-zero. Every stack and vendor choice must justify itself against a ~$0 starting budget while being architected for rapid scale. [LOCKED]

---

## 0. How to read this document
- **[LOCKED]** = decided; don't relitigate without reason.
- **[DEFAULT]** = working assumption until overridden.
- **[OPEN]** = needs a founder decision (collected in §19).
- **[LATER]** = deliberately deferred past MVP (but may still be *built and feature-flagged off* — see §2.2).

---

## 1. Product summary

**UGCOrigin** is a **Nigeria-first → Africa → global** two-sided marketplace connecting **brands** (needing authentic, conversion-focused content: video, images, memes, testimonials) with **real, verified human creators**. A **Dream Intrepid Ltd.** product.

**Wedge / positioning:** the home of *original, human, verified* content against a flood of synthetic AI media — an explicit **anti-AI / proof-of-human** promise embodied in the logo's verification node. [LOCKED]

**Model blend:** ugc.ng (local escrow, Naira, creators keep 100%, brand pays fee) + Social Cat (gifted→paid progression, structured briefs, clean review loop) + Collabstr (marketplace layout/IA reference) + Upwork (split brand/creator onboarding, bids, profiles, reputation). [LOCKED]

**One-line:** *Collabstr's clean layout + ugc.ng's local escrow + Social Cat's brief/review flow — more wholesome, gamified, Apple-grade in feel, and engineered to make brands return.*

---

## 2. Goals, non-goals, metrics

### 2.1 Goals
1. **Supply density first** — mass of high-quality, *fully verified* NG creators in key niches (beauty/skincare, fintech, e-commerce, food, lifestyle, SaaS/tech) before pushing brands. [LOCKED]
2. **Zero-ambiguity, escrow-protected transactions** — brief-first, funds protected by default, both sides guaranteed.
3. **Repeat-business engine** — effortless re-hire, reviews that syndicate out (Trustpilot/Google), product feedback loop that pulls brands back.
4. **Quality as the moat** — heavy, trustworthy ranking that surfaces genuinely good creators/gigs, not pay-to-win noise.
5. **Light, tasteful gamification** — weekly tier ladder; reward excellence, nudge underperformers, redemption always available; premium feel, never tacky.
6. **Lean-to-scale economics** — free for creators at first, then gradual "fuel money" micro-charges that feel tiny per creator but compound fast for the platform (§8).

### 2.2 Non-goals / scope rules
- Not an influencer-reach marketplace (we sell usable content assets, not a celebrity's audience). [LOCKED]
- Not a managed agency at MVP (concierge = manual growth tactic). [LATER]
- **Build-complete, reveal-gradually:** advanced systems (full tier ladder, Path B, syndication, AI assist tiers) are **built but feature-flagged off** at launch, switched on when liquidity supports them. [LOCKED — founder: "the full thing should be built, just not available."]

### 2.3 Metrics
- **North star:** value of approved content delivered/month (GMV of escrow-released gigs).
- **Supply:** # fully-verified active creators, niche coverage, % profiles at 100% + verified.
- **Demand:** active brands, time-to-first-hire, AOV, **repeat purchase rate** (most important), delivery success rate, dispute rate.
- **Trust:** NPS both sides, review volume + syndication rate, verification pass rate.
- **Economics:** realized take rate, creator "fuel" revenue/active creator, payout success, refund/chargeback rate, infra cost/active user (keep near-zero).

---

## 3. Brand & visual identity

### 3.1 Name, domain, entity
- **UGCOrigin** (singular), **ugcorigin.com**. Under **Dream Intrepid Ltd.** [LOCKED]
- **Standalone brand** (own auth/branding/billing — NOT shared with other Dream Intrepid products), with a light footer attribution **"A product by Dream Intrepid Ltd."** across key pages/regions. [LOCKED — Q12]
- Emails once live: `hello@`, `support@`, `creators@`, `brands@`, `disputes@`, `security@`. Interim Gmail: `ugcorigin.hq@gmail.com`. [DEFAULT]

### 3.2 Logo system
Three responsive lockups (provided `/images/1–3.jpg`): **Symbol** (continuous-line "U" monogram → up-right arrow wedge + verification node = UGC + ascent + human-origin anchor, also reads as hook/anchor — "the hook" is the first 3s of short-form video; use for favicon/app icon/avatar/**video watermark**/badges), **Wordmark** (`UGC` heavy + `ORIGIN` light, tight kerning, geometric grotesk), **Combined** (horizontal nav + stacked mobile/hero). Monochromatic by design → perfect light/dark parity.

### 3.3 Color & type [LOCKED]
- **Base:** powder/off-white `#F7F7F5`; surfaces `#FFFFFF` / `#F2F2EF`; ink matte black/charcoal `#15161A`, secondary `#3A3B40`.
- **Accent — "Origin Pink" `#DB2777`** (hover `#BE185D`; bright `#EC4899` for highlights on dark; soft tint `#FCE7F3`; white text on pink). **Decision: PINK (amber replaced).** [LOCKED] Collabstr-style. "UGC" in the wordmark is pink; "ORIGIN" charcoal. Used on buttons, links, highlights, active states.
- **Soft pastels** (color-wheel harmonious with pink) for team/feature cards: pink tint `#FCE7F3`, peach `#FFE3D3`, lavender `#ECE9FE`, mint `#D8F5E6` — Collabstr-style, restrained.
- **Status colors (muted, functional only):** success `#2E9E6B`, warning `#C8861B`, error `#C0392B`, info `#4A6FA5`. Not decorative.
- **Type:** UI = **Inter**; display/headings = one geometric face (**Space Grotesk** or **Plus Jakarta Sans**). Tight, confident, editorial.

### 3.4 Design principles & motion [LOCKED — "Apple-grade, not vibe-coded"]
- **Apple-style restraint:** generous whitespace, strong type hierarchy, real imagery, **bento grids** and clean card grids, crisp edges. **No lazy gradients, no "dead vibe-coded" look, no AI-slop filler copy ("AI slur text") anywhere.**
- **Microcopy is human and specific** — written like a person, no AI clichés, no generic marketing mush.
- **Motion:** smooth, purposeful **scroll-triggered reveals** (enter/leave for sections & cards), **hover effects**, **touch/press feedback**, page/element transitions — all subtle, never over the top.
- **Instant click feedback (perceived performance):** every actionable click shows immediate state (optimistic UI, pressed states, skeletons/spinners, toasts) so the user *knows* it registered. Never a dead click.
- **Lightning fast & interactive:** aggressive performance budget; fast loaders; prefetch; edge/CDN; images optimized (AVIF/WebP, responsive sizes, lazy-load).
- **Mobile responsiveness is the #1 build priority, from scratch** — design mobile-first, test every surface at phone width, no desktop-only afterthoughts. [LOCKED]
- **Composability & resource optimization** baked in: reusable component system, design tokens, no bloat, tree-shaking, minimal JS, code-split.

---

## 4. Users, roles, verification & sign-in

### 4.1 Roles
- **Creator**, **Brand**, **Admin/Staff** (layered — §13). One account may hold both a creator and a brand profile with explicit context switching.

### 4.2 Sign-in / sign-up [LOCKED]
- **Social OAuth: Google, Meta (Facebook/Instagram), X**, plus email. (TikTok/Apple [DEFAULT/LATER].)
- Dedicated, high-converting **sign-in / sign-up landing pages** for *both* brands and creators (traffic-driving, SEO/paid-ready — §15).
- Split onboarding fork at entry ("I'm a Brand" / "I'm a Creator"), Upwork-style.

### 4.3 Stringent verification gate [LOCKED]
- **Signing up is easy; being *on the platform* is earned.** A creator can register freely but is **not discoverable and cannot transact until:**
  1. **Profile 100% complete** (niches, packages/rates, portfolio/samples, bio, socials linked),
  2. **Bank details verified** (Paystack account-name resolution — free/cheap),
  3. **Identity verified** (one KYC provider at the gate — §12.5),
  4. Agreements accepted.
- Only then does the **"Verified Human"** badge appear and the profile goes live (after a light review for cold-start quality).
- Brands: **business/store verified** before funding escrow.

### 4.4 Social account linking + live embeds (not a follower gate) [LOCKED]
- Link **Instagram, TikTok, YouTube, Twitch, X** for portfolio/presence/proof-of-human. Follower count is *not* a gate (irrelevant for UGC).
- **Live on-profile embeds:** when a creator posts a link to their work (X post, IG reel, TikTok, YouTube, Twitch clip), **render it live/embedded on the UGCOrigin profile so viewers watch the work without leaving the platform.** Use free **oEmbed / native embed widgets** (X, Instagram, TikTok, YouTube, Twitch all support embeds at $0 — no paid API needed). Automated content *pulls* (scraping a feed) come later and are cost-gated; embeds are the launch mechanism. [LOCKED — resolves the "show work without leaving" goal cheaply]

---

## 5. Information architecture & page map
(Layout reference = Collabstr; features = ugc.ng + Social Cat but more wholesome. Public pages SEO/AEO/GEO-optimized — §15. Every surface mobile-first.)

- **Public/marketing:** Home (anti-AI/human hero, dual CTA, featured creators, trust signals, niche browse, social proof, bento sections) · **For Brands** · **For Creators** · **Creator directory** (Collabstr-style grid + filters: niche/format/price/language/location/rating/verification/availability; top recommended cards + interleaved suggestion slots — §9) · **Creator profile / shareable rate card** at `ugcorigin.com/@{handle}` (reel, niches, **rate card/packages & prices**, reviews, verified+tier badges, response time, repeat-client count, **Jolts** feed — §7a; one-tap share: link, **QR code**, socials, "Make an offer" CTA — see §5.5) · **Open briefs board** (Path B) · Pricing · Trust & Safety/Escrow · Blog/Guides (SEO engine) · Reviews · Legal · dedicated **sign-up/sign-in** pages.
- **Creator app:** Dashboard · Profile editor · Packages/rates · Briefs feed + applications · Offers inbox · Active gigs workspace · **Jolts composer** · Wallet/payouts · Reviews · Tier/Ladder status · Leaderboard · Notifications · Settings.
- **Brand app:** Dashboard · Browse/search creators · Post a brief (wizard) · My campaigns · Offers/applications review · Active gigs workspace · Approvals & downloads · Wallet/billing/escrow · Reviews given · Saved creators/lists · Repeat-hire shortcuts · Notifications · Settings.
- **Admin:** §13.

### 5.5 Shareable creator card / rate card [LOCKED feature]
Every creator has a public, self-contained card at **`ugcorigin.com/@{handle}`** — everything a customer needs to make an offer in one place: photo, verified + tier badges, niches, **rate card (packages & prices)**, sample/portfolio work, linked socials (live embeds — §4.4), response time, and a **"Make an offer / Hire" CTA**. One-tap sharing: **copy link, QR code (generated on the page), social share, optional vCard download**. Designed for the offline→online moment: meet a creator at an event, scan their QR or take their `@handle`, land on the card, send an offer. Public (works logged-out); the offer CTA routes to sign-up/checkout. *(Build next.)*

---

## 6. Rules of engagement [LOCKED]
1. **Zero Ambiguity (Brief-First)** — every engagement starts from a structured Campaign Brief (format, hook angles, do's/don'ts, raw vs edited, usage rights, deadline).
2. **Escrow Shield (Trust by Default)** — funds never held by either party; locked on hire; creator guaranteed on approval, brand guaranteed against ghosting (via §12 provider-native mechanism).
3. **Professional, Not Corporate** — comms stay on-platform (Slack-style messenger tied to the deliverable); off-platform contact discouraged (voids escrow protection).

---

## 7. Core flows

### 7.1 Onboarding (supply first)
- **Creator:** OAuth → role=creator → link socials/portfolio → niches → pricing tiers (gifted vs paid) → **verification gate (§4.3)** → live after review. Early incentive: **0% creator fee at launch**, featured placement, possibly seeded gigs for first cohorts.
- **Brand:** OAuth → role=brand → verify company/store → curated verified-human directory.

### 7.2 Campaign lifecycle
**Path A — Direct Hire (MVP-visible):** browse/filter → **Project Offer** (fixed brief + price + deadline) → creator Accept/Counter/Decline within 48h → on accept, brand **funds escrow** → workspace opens.
**Path B — Open Brief (built, flagged off at launch):** brand posts open campaign → creators apply (1-line pitch/sample) → brand selects → **escrow locked for the batch** → workspaces open.

### 7.3 Creation & review (friction zone)
Per-gig **workspace/timeline card:** draft upload (raw/watermarked) → brand **time-stamped video comments** → bounded revisions (1–2 included; extra = add-on) → **Approve & Release Funds** → high-res unwatermarked files + agreed usage rights unlock.

### 7.3b Review window & auto-adjudication (ugc.ng parity, improved) [LOCKED]
- **Configurable review window (default 7 days).** Brand approves or disputes with **one click, including from the notification email.**
- **If the brand goes silent past the window:** UGCOrigin's Trust & Safety reviews the delivery against the **written brief** and releases to the creator **only if it matches** — protecting creators from ghosting while protecting brands from off-brief work. Disputes are decided **against the written spec, not who argues hardest.**

### 7.4 Delivery & payout
Approval → files unlock → escrow **auto-releases** to creator wallet → **next-day bank payout** (Paystack transfers; NG bank account required) → both leave **rating + review** (speed/comms/quality) → reputation + syndication (§11). Both sides have **wallets**; unspent campaign funds become **wallet credit** (§7b).

### 7b. Marketplace surfaces, gig types & campaign formats (ugc.ng parity) [LOCKED]
UGCOrigin must match or exceed ugc.ng's surfaces (full teardown: `docs/competitor-ugc-ng-teardown.md`).
- **Three browsable surfaces:** **Gigs** (brand-posted briefs, our Path B), **Services** (creator-listed fixed packages, browsable Fiverr-style — not only on profiles), **Creators** (directory). [LOCKED — ugc.ng exposes all three; we were missing Services-as-surface.]
- **Gig types:** *Original Post* (protected), *Affiliate/commission* (clearly labeled **"Not payment protected"**), *Other*. **"Need N"** multi-slot gigs (hire several creators to one brief).
- **Per-view "funded pool" campaigns:** brand funds a pool; creators submit; pay is **per views** (e.g., ₦/1,000 views). **Pools, submissions, claims, payouts and forfeited claims are publicly visible; inflated/fraudulent view claims are forfeited and the forfeit stays visible** (public anti-fraud). Unspent pool → wallet credit. [DEFAULT — build, likely flagged off until liquidity; strong virality + anti-fraud feature.]
- **Free to post/browse/message**; fees apply only when funding a deal or buying visibility.
- **Paid visibility (bounded, labeled — §9 guardrail):** *Boost a Gig* and *Featured Creator*. Reference pricing (ugc.ng): Boost ₦5,000/7 days; Featured ₦5,000/mo or ₦30,000/yr — ours tunable, part of "fuel money" (§8.2).
- **Taxonomy:** adopt ugc.ng's niche/content/production tags as a baseline and extend (see teardown doc).

### 7.5 Dispute / refund (trust backbone — must be designed, not stubbed)
- If a brand says "not per brief": structured dispute → evidence from the on-platform workspace (brief, drafts, comments) → **mediation by Trust & Safety admin** → outcomes: release, partial release, revision mandate, or refund. Escrow stays held during dispute. Clear, fair, documented rules. [DEFAULT — detailed UX to design in Phase 1]

### 7.6 Anti-overwhelm [LOCKED]
Progressive-disclosure 3-step brief wizard (*What are you selling? → What creator? → Budget & deadline*) · smart templates (Unboxing & Testimonial, Problem-Solver Ad, SaaS Screen Recording, Meme/Trend) · chat over complexity.

### 7a. Jolts (native X-style posts) [LOCKED concept]
- **"Jolts" = the platform's name for short posts** (X/tweets, rebranded since Twitter → X). Creators publish Jolts from their profile: portfolio moments, availability ("open for skincare gigs this week"), trend takes, before/after clips, wins.
- First-class content type: text + media, likes/reactions, appears on the creator profile and optionally a discovery feed; feeds freshness/activity signal into ranking (§9).
- **Optional cross-post to X** via X API (cost/rate-limited — flagged, off by default; §19-Q13). Native Jolts work with zero external cost regardless.

---

## 8. Monetization — "free first, fuel money later" [LOCKED direction]

### 8.1 Launch
- **Creators: 0% fee / keep 100%** (headline promise, supply magnet).
- **Brands: ~12% brand-side take rate** at launch (undercuts ugc.ng's 15%; test toward 15% as trust/repeat proven). **Decision: start 12%.**

### 8.2 The "fuel money" creator ladder (phase in as dependency grows)
Individually tiny, feels like fuel; stacks fast for the platform. Introduce gradually, transparently, only once creators rely on the system:
- **Payout/withdrawal processing fee** (small flat or ~1%).
- **Instant payout** convenience fee (vs. standard).
- **Profile / Jolt boosts** (bounded, labeled — never corrupts the organic algorithm, §9).
- **Pro tools subscription (secondary):** advanced analytics, extra portfolio slots, custom profile, higher AI-assist quota (§16).
- **Open-brief application credits:** free weekly quota; power users buy more.
- **Verification fast-track**, **rush/priority**.
> **Guardrails:** subscription is *secondary*; the real engine is transaction take rate + stacked micro-fees. Monetization must never degrade match quality or trust. Paid boosts move only a small, capped, labeled slice of ranking.

### 8.3 Reference pricing (verify live §19): entry UGC ₦15k–₦80k, mid ₦80k–₦200k, specialist ₦200k–₦500k+, global $50–$500+. Gifted (product-only) = entry rung.

---

## 9. Recommendation / ranking engine (the moat — "heavy & solid")
- **Applies to:** directory ordering, featured creators, **top 3–5 recommended cards + interleaved "you might also like" suggestion slots**, brief↔creator matching both directions, bids/proposals ordering.
- **Signals (quality-weighted, anti-gaming):** outcome (approval rate, on-time, low revisions, dispute-free, **repeat-hire**, review scores, re-save) > fit (niche/format/budget/language/region/usage-rights/availability) > freshness (response time, recent activity incl. Jolts, acceptance rate) > tier standing > verification level > *bounded* paid boost. Anti-gaming: down-weight self-dealing/review rings/anomalies; **exploration quota** so new/returning creators get fair shots (redemption/opportunity slots).
- **Build path:** Phase 1 transparent rules-based weighted score (explainable, tunable, no ML). Phase 2 learning-to-rank/embeddings for semantic match + personalization. [LATER]

---

## 10. Gamified weekly tier ladder [LOCKED concept — built, flagged off at launch]

> **Full model incl. the entry "leveler" (crediting established creators on a decaying head start without burying newcomers), concrete scoring formulas, worked examples, and the exploration/opportunity-slot mechanic → `docs/tiering-and-ranking.md`. Schema in `supabase/migrations/*_tiering.sql`.** Entry is capped at Pro (Elite/Signature earned only); newcomers get reserved exploration slots funded by capping top creators' impression share — these are the interleaved "suggestion" slots between the top 3–5 cards.
- **Weekly** ladder; climb or drop weekly on rolling performance (approval %, on-time %, dispute rate, reviews, activity).
- **Tiers (names/thresholds tunable):** Origin → Rising → Pro → Elite → Signature. Up = higher ranking weight, more featured slots, fee perks, early premium-brief access, badge, payout-speed perks, leaderboard placement. Down = reduced visibility, lost featured slots — **never** fund seizure or lockout.
- **Redemption always available** [LOCKED] — comeback streaks, redemption gigs, recovery quota; rewards trajectory, not just absolute score.
- **Brand-side trust tiers** (complement): prompt approvers / fair feedback / repeat buyers get perks (priority creator access, better rates, featured brand status, loyalty credits) → drives the repeat-business loop.
- **Leaderboards:** overall + per-niche + "rising this week"; celebrate top movers, never shame the bottom.

---

## 11. Reviews, reputation & syndication (repeat engine)
- **Two-way, verified-transaction-only** reviews (speed/comms/quality + text).
- **Repeat-hire tooling:** one-click re-hire, rebook winners, saved lists, "same / new / mix" toggle for recurring campaigns.
- **Syndication:** approved reviews feed Trustpilot/Google + on-site structured data (compliant invitation flows, not scraping; confirm policies §19). **Product-feedback loop** keeps brands returning.

---

## 12. Payments, escrow & financial security [AIRTIGHT — top risk]

### 12.1 Providers — no Stripe for now, provider-agnostic & swappable [LOCKED]
- **Primary (NG): Paystack** (account ready) **and Flutterwave.** Alternates behind the same abstraction: **Korapay, Monnify, Squad (GTCO)**, and **Bachs (bachs.io)** — a payments/billing platform (checkout, recurring billing, API-usage billing, instant NGN payouts ~1.5% capped ₦2,000, USD/stablecoin settlement). Bachs is a strong fit for the later **subscription/"fuel money" billing** and **diaspora USD** settlement, but its payout claims are self-reported/unproven — keep it as an **alternate to verify directly**, Paystack stays primary.
- **Payment-provider abstraction layer** so we can route/switch provider "at a moment's notice" (per-transaction or via config), with health-based failover. **No hard dependency on any one provider; Stripe excluded for now** (re-evaluate for global expansion later).
- **Global (later):** cross-border payout options (e.g., Wise) when we expand; not Stripe-dependent.

### 12.2 CRITICAL escrow constraint ⚠️ [LOCKED]
**Never hold third-party funds in UGCOrigin's own account** — that risks unlicensed payment/escrow/money-transmitter classification (NG + most jurisdictions). Paystack/Flutterwave have **no true indefinite hold**, so compliant options are:
- **(a)** a **licensed escrow-as-a-service partner** holds funds, or
- **(b)** controlled PSP settlement timing + a **ring-fenced, reconciled client-funds account** — only with **legal sign-off.**
- **Founder action [OPEN §19-Q5]:** engage a Nigerian fintech/payments lawyer to confirm the hold mechanism **before** building escrow. I'll specify exactly what to configure per provider at build time.

### 12.3 Money flows: fund → hold → (dispute: partial/refund) → release on approval → payout → fee capture → reconciliation. Handle NGN primary (multi-currency later), FX, transparent fees, failed-payout retries, refunds, chargebacks.

### 12.4 Financial controls: immutable **double-entry ledger** for every cent; idempotent webhooks; reconciliation jobs; payout approval thresholds; fraud/velocity checks; dispute hold states; **dual-control (maker-checker)** on large releases.

### 12.5 Identity/bank verification [LOCKED approach]
- **Bank details:** Paystack **account-name resolution** (free/cheap) — mandatory before creator goes live.
- **Identity KYC:** **one provider at the gate, behind an abstraction with waterfall failover** (not parallel-always — that burns budget). Candidates: **Dojah** or **Smile ID** (NG-strong, BVN/NIN/liveness); Prembly alt. Pick primary §19-Q4. Store minimal PII, encrypted (§12.6).
- **Cost model [DEFAULT]:** KYC is **per-check** (not a flat subscription) — roughly **₦30–₦150** per NIN/BVN lookup and **₦100–₦300** for liveness/selfie, so a full verification is typically **~₦200–₦500 per creator** (varies by vendor/volume; confirm live). **Platform absorbs this at launch** rather than charging creators upfront — charging a ₦1–2k "verification fee" to join contradicts the "free for creators" supply magnet and adds friction exactly when we need supply. If recovered later, do it **from the creator's first payout** (not before they've earned), or as an optional fast-track. It's cheap enough that absorbing it is the right call early. [LOCKED direction]
- **RESOLVED → Smile ID primary, Dojah backup** (waterfall failover; focus Smile ID for pan-African reach). Backups are mandatory for resilience. Confirm exact live per-check pricing at integration.

### 12.6 Data security (airtight, layered) [LOCKED]
Encrypt PII at rest + in transit; least-privilege DB/row-level security; secrets management; tokenize/minimize stored KYC & bank data; audit every access; rate limiting + WAF; **bot protection (Cloudflare Turnstile)**; backups; incident plan. PII never exposed raw in any UI/log.

---

## 13. Admin console (comprehensive, layered, flexible roles) [LOCKED]
- **Flexible RBAC** (not fixed tiers): composable permissions assignable to roles; founder can define/adjust roles. Baseline roles: **Super Admin** (founder), **Finance/Payments**, **Trust & Safety/Moderation**, **Support**, **Growth/Marketing/CMS**, **Analyst (read-only)**.
- **Role switch / impersonation ("view as user")** — heavily audited, scoped, consent-aware; financial actions blocked without elevation. [LOCKED requirement]
- **Surfaces:** user/creator/brand mgmt + **verification queue**; gig/campaign oversight; **escrow & payout control** (release/hold/refund, dual-control); **dispute mediation workspace**; content moderation (video/image/meme + anti-AI checks + takedowns); ranking/tier config & overrides; featured/boost mgmt; reviews & syndication moderation; **CMS** for marketing/SEO pages; referral/incentive mgmt; analytics; **full audit log** (who/what/when/before/after); **feature flags** (for build-complete-reveal-gradually); announcements.
- **Admin security:** mandatory **MFA**, least-privilege, dual-control on money, complete audit trail, session timeouts, optional IP allowlist.

---

## 14. Analytics, tracking & bot protection (cheap/free stack) [LOCKED]
- **On every relevant page:** **Google Analytics (GA4)**, **Microsoft Clarity** (heatmaps/session replay, free), **Meta Pixel** (brand retargeting/attribution), plus **PostHog** (product analytics, free tier) for funnels/events. Consent-aware, privacy-respecting.
- **Meta integration fully on-platform** for growth/attribution (Pixel + conversions); Meta Ads tooling available in workspace for later campaigns.
- **Bot traffic handling** to protect near-zero hosting: **Cloudflare Turnstile** + WAF + rate limiting + caching/edge so bots don't burn resources.
- **Dashboards:** creator (earnings, win rate, response time, rating trend, tier trajectory, views→hire funnel, repeat count), brand (spend, AOV, delivery success, content performance, repeat, time-to-first-hire), admin (GMV, take rate, supply/demand per niche, liquidity, dispute rate, payout success, NPS, cohort retention, **infra cost/active user**).

---

## 15. SEO / AEO / GEO (discovery must be spot on) [LOCKED]
Fast SSR/edge public pages; creator/niche/location landing pages + dedicated brand/creator sign-up landing pages to drive paid + organic traffic; blog/guides engine; structured data (Review, Product, FAQ, Breadcrumb, Organization); sitemaps; Core Web Vitals; internal linking. **AEO:** FAQ + schema + concise authoritative answers so AI assistants cite us. **GEO:** structured, citable, consistent entity presence. Review syndication feeds trust + search. Programmatic SEO (niche×location×format) architected for later.

---

## 16. AI assist features (smooth, not over the top, cost-aware) [DEFAULT]
- **For brands:** AI brief/post/contract drafter inside the 3-step wizard (turn a product description into a structured brief + usage-rights contract), AI creator-match suggestions.
- **For creators:** AI profile/portfolio setup assistant (write bio, structure packages, suggest niches), AI Jolt/caption helper.
- **Cost guardrails (lean budget):** use efficient/cheap models, cache aggressively, free-quota + paid overage (ties to §8 fuel model), rate-limit, never block core flows on AI. Keep it helpful and invisible, not gimmicky.

---

## 17. Notifications & messaging
In-app + email + push + **WhatsApp/SMS (NG reach, transactional nudges only)**. Triggers: new offer, accepted/declined, escrow funded, draft submitted, feedback left, approved, paid, review received, tier change, redemption nudge, dispute updates, Jolt engagement. Slack-style on-platform messenger per gig; off-platform contact discouraged (escrow-void warning).

---

## 18. Tech & architecture (near-zero cost, composable, fast, mobile-first) [DEFAULT — confirm §19-Q6]

### 18.1 Stack
- **Frontend + app server:** **Next.js (App Router) + TypeScript + Tailwind**, token-based component system (§3.4). Deploy on **Vercel**. **Decision: Vercel (Q6b).** Rationale + the honest cost facts in §18.4.
  - **Scaffolded reality (as built, 2026-10-17):** Next.js **16.4.2**, React **19.3**, TypeScript 5, **Tailwind CSS v4** (CSS-first `@theme` tokens), lucide-react, Inter + Space Grotesk. ⚠️ This Next is very new with **stricter prerender rules** (`cacheComponents`/`partialPrefetching` on) — no `new Date()`/random in server render without the right pattern. Full stack list: `docs/tech-stack.md`.
- **Domain/DNS [LOCKED — Q15]:** buy **`ugcorigin.com` on Namecheap**, then point nameservers to **Cloudflare** and manage DNS, CDN, WAF, Turnstile, and R2 there.
- **Backend/data:** **Supabase** (managed **Postgres** + **Auth** for Google/Meta/X OAuth + Row-Level Security + Storage + Realtime) — generous free tier, strong fit, minimal ops. This **is the "server"** for data/auth/storage; app/business logic runs in Next.js server components + route handlers (on Vercel) and Supabase Edge Functions.
- **Media:** **Cloudflare R2** (zero egress) or Supabase Storage + CDN; watermarked drafts vs unwatermarked finals; transcoding/compression; AVIF/WebP; time-stamped video comments.
- **Payments:** Paystack/Flutterwave/Korapay/Monnify/Squad behind a provider abstraction (§12.1).
- **Bot/security:** Cloudflare Turnstile + WAF + rate limiting (§12.6, §14).
- **Analytics:** GA4 + Clarity + Meta Pixel + PostHog (§14).

### 18.2 Client/server separation [DEFAULT — answers founder's question]
- **Start as a modular monolith with clean internal boundaries** (UI layer ↔ well-isolated domain/service layer ↔ data), deployed together to stay near-$0. This gives the *benefits* of separation (clear contracts, composability, testability) **without paying for separate infra now**, and the domain/API layer can **extract into a standalone service later** when scale demands. Pure split-from-day-one is rejected on cost/ops grounds for a lean start.

### 18.3 Principles: mobile-first from scratch; performance budget; composable reusable components + design tokens; minimal JS, code-split, prefetch; optimistic UI everywhere; accessibility; everything cheap-to-free and scale-ready.

### 18.4 Host decision & the honest cost/server facts [LOCKED → Vercel]
**Where the "server" lives:** there are really three server-side pieces — (1) **Next.js server** (SSR, server components, API route handlers) → runs on **Vercel**; (2) **data/auth/storage/realtime** → **Supabase**; (3) **media + edge/bot** → **Cloudflare (R2, Turnstile, CDN)**. There is no separate always-on backend box to pay for; it's serverless + managed services. That keeps idle cost near-zero.
- **Vercel (chosen):** best DX, fastest path, Next.js-native, instant global edge, preview deploys, and Vercel MCP is wired into this workspace. **Costs:** Hobby is free but **non-commercial** → we need **Pro ≈ $20/mo per member**. Pro includes generous limits; **hidden risk = usage overages** (bandwidth, function execution/duration, image optimization) that can spike under heavy video traffic. **Mitigation:** serve media from **Cloudflare R2 (zero egress)** not Vercel, use ISR/edge caching, set **spend limits/alerts**. Net: ~$20/mo + controllable usage.
- **Cloudflare Pages/Workers (not chosen for frontend):** genuinely **$0** with a very generous free tier and **no egress fees**, but **more setup friction and some platform limits** (Workers runtime constraints, less seamless Next.js support, more plumbing). You were right that it's "more work." We still **use Cloudflare for what it's best at** (R2 media, Turnstile, CDN/WAF) alongside Vercel — best of both.
- **Verdict:** **Vercel for the app** (smooth, no nasty surprises if we keep media off it and set spend caps), **Supabase for backend**, **Cloudflare for media/edge/bot**. Total realistic early run-rate: **~$20/mo + usage**, not thousands. We can migrate the frontend to Cloudflare later if usage economics demand it — the modular-monolith boundaries (§18.2) make that portable.

---

## 19. Open decisions needing founder input

| # | Question | Status / recommendation |
|---|----------|--------------------------|
| Q1 | Accent color | **RESOLVED → Origin Amber `#E8A317`.** |
| Q2 | Identity verification approach | **RESOLVED → one KYC provider at gate + waterfall failover (not parallel); Paystack free bank-name resolution for bank verify.** Vendor pick open → Q4. |
| Q3 | Take rate | **RESOLVED → brand-side 12% at launch (test to 15%); creators 0%; "fuel money" micro-charges phased in (§8.2).** |
| Q4 | **Primary KYC vendor** | **RESOLVED → Smile ID primary + Dojah backup (waterfall).** Cost absorbed by platform at launch. |
| Q5 | **Escrow legal/hold mechanism** + fintech lawyer | **PARTLY RESOLVED — founder has a lawyer.** Action: send her the escrow-structure brief (see discussion) so she advises on the compliant hold mechanism + cost. Still blocks building escrow until her answer. |
| Q6 | Confirm stack (Next.js + Supabase + Cloudflare) | **RESOLVED → confirmed. Q6b RESOLVED → Vercel for app + Supabase backend + Cloudflare media/edge/bot (§18.4).** |
| Q7 | MVP visibility cut | **RESOLVED → build full product, launch-visible = Direct-Hire + escrow + reviews + basic ranking + Jolts; Path B, full ladder, syndication built but flagged off.** |
| Q8 | Geography at launch (NG-only vs NG + global brands paying USD) | Rec: NG-first; add global brands when a non-Stripe cross-border path is ready. |
| Q9 | Gifted (product-only) rung at launch? | Rec: yes, include as entry rung. |
| Q10 | Creator fee truly 0% long-term, or 0% then fuel-fees only? | Rec: keep *rate* 100% to creator; monetize via brand take + micro-fees, not a rate cut. |
| Q11 | Which social platforms to *integrate deeply* first (IG/TikTok/YouTube/Twitch/X) given each API's cost/limits? | Rec: X + IG + TikTok linking first; YouTube/Twitch next. |
| Q12 | Dream Intrepid ecosystem ties | **RESOLVED → standalone brand; footer "A product by Dream Intrepid Ltd." No shared auth/billing.** |
| Q13 | Jolts → cross-post to X via API (paid/limited) or native-only at launch? | Rec: native-only first; X cross-post flagged for later. Live **embeds** of linked posts ship at launch (§4.4, free). |
| Q14 | Entity/payment readiness | **RESOLVED — Dream Intrepid Ltd. registered; Paystack ready. "bachs.io" = Bachs (billing/USD alt). Flutterwave + Bachs + bank accounts added later** → build Paystack-first behind the abstraction. |
| Q15 | **Domain + DNS** | **RESOLVED → buy `ugcorigin.com` on Namecheap, manage DNS/CDN/WAF via Cloudflare.** |
| Q16 | **GTM / waitlist** | **RESOLVED → NO waitlist; launch-first, bring people in live (`docs/go-to-market-90-day.md`).** |
| Q17 | **Visual aesthetic** | **RESOLVED → Collabstr-grade: dark always-on hero + search bar + creator strip, bento, tasteful motion; our powder-white/matte-black/amber palette.** |

---

## 20. Phased roadmap
- **Phase 0 — Foundations:** brand/design system + tokens, legal pages, Supabase auth (Google/Meta/X), profiles, **verification gate**, payment+escrow abstraction (provider-native/legal), ledger, admin core + RBAC + feature flags, security + bot protection baseline, analytics stack.
- **Phase 1 — MVP (visible):** creator directory + profiles + Jolts, Direct-Hire (Path A), brief wizard + templates + AI brief assist, gig workspace (upload, time-stamped feedback, approve), escrow release + payouts, two-way reviews, rules-based ranking, dispute/mediation, notifications, analytics, SEO base + sign-up landing pages. Seed 50–150 NG creators; concierge first brands. *(Path B, full ladder, syndication built but flagged off.)*
- **Phase 2 — Loops/growth:** switch on Open Briefs, weekly tier ladder + leaderboards + redemption, review syndication, bounded boosts/featured, repeat-hire tooling, "fuel money" creator fees, deeper analytics, AEO/GEO engine, brand memberships, Pro tools.
- **Phase 3 — Scale:** learning-to-rank, global/cross-border payments, multi-seat brands, managed/concierge, data/insights products, Pan-African rollout, deeper social integrations.

---

## 21. Risks & mitigations (top)
- **Escrow/regulatory** → provider-native/licensed-partner holds + lawyer (§12.2). *Existential — first.*
- **Zero-budget vs. ambition** → free-tier-first stack (Supabase/Cloudflare), build-complete-flag-off, cheap/free integrations; watch infra cost/active user.
- **Cold-start/liquidity** → supply-first, manual recruiting, concierge matching, seeded gigs.
- **Quality/trust & review gaming** → verified-transaction reviews, anti-gaming ranking, stringent verification gate.
- **Monetization vs quality** → bounded boosts; organic algorithm dominates; fuel fees kept small/transparent.
- **Fraud/chargebacks/payout fraud** → KYC, velocity checks, dual-control, dispute holds.
- **Off-platform leakage** → on-platform comms + escrow-void messaging + workspace convenience.
- **AI-content infiltration** (undermines positioning) → human verification, provenance checks, moderation.
- **Social API cost/limits** (X/IG/TikTok) → native-first, link-only where APIs are costly, flag paid features.

---

## 22. Data model / core entities & relationships [DEFAULT — scope lock for build]

**Identity & roles**
- **Account** (auth identity; OAuth Google/Meta/X or email). 1 Account → 0..1 **CreatorProfile**, 0..1 **BrandProfile**.
- **Role** & **Permission** (flexible RBAC, many-to-many; roles composable, founder-editable) → assigned to **StaffUser**/Account. **AuditLog** records every privileged action.
- **Verification** (per Account/Profile: email, phone, identity/KYC record, bank-verification result, business-verification; status + timestamps; minimal encrypted PII).

**Creator side**
- **CreatorProfile** (niches[], bio, completeness %, verification status, tier standing, ratings aggregate, repeat-client count). 1 → * **SocialAccount** (platform ∈ {instagram,tiktok,youtube,twitch,x}, handle, linked status, scoped tokens). 1 → * **Package/Rate** (type: gifted|paid, format, price, revisions, usage rights). 1 → * **Jolt** (text+media, reactions) → * **JoltEngagement**.
- **TierStanding** (weekly snapshot: tier, score, movement, redemption state).

**Brand side**
- **BrandProfile** (company/store, verification status, trust tier, saved lists). 1 → * **SavedCreatorList**.

**Marketplace & work**
- **Brief/Campaign** (Path B open; or embedded brief in Offer). Brand 1 → * Brief. Brief 1 → * **Application** (creator pitch) → selected creators.
- **Offer** (Path A direct: brand→creator, brief+price+deadline, status).
- **Gig/Contract** (the engagement; belongs to Brand + Creator + (Brief|Offer); status machine: pending→funded→in_progress→in_review→approved→released→closed | disputed | cancelled). 1 → * **Deliverable** (draft versions, watermarked/final, media refs) → * **TimestampedComment**. 1 → 0..1 **Dispute** (evidence, mediation, resolution).

**Money**
- **EscrowTransaction** (per Gig; provider, external refs, amount, fee, status). 1 → * **LedgerEntry** (immutable double-entry: escrow_in, held, fee, release, payout, refund). **Payout** (creator, provider, status, retries). **Wallet/Balance** (derived from ledger).

**Trust & engagement**
- **Review** (per Gig, two-way, verified-transaction-only; speed/comms/quality + text; syndication status).
- **Notification** (channel, type, read state). **FeatureFlag** (global/segment). **FileAsset** (media, R2/Storage ref, watermark state, usage-rights metadata).

*(Full field-level schema + state diagrams to be produced in Phase 0 build; this section locks the entity set and relationships.)*

---

## 23. Build status (codebase)
- **Scaffolded & running locally (`src/`):** Next.js app + full **design system** — tokens (powder-white/matte-black/**Origin Amber `#E8A317`**, light+dark, fixed `obsidian`/`chalk` for always-dark panels), components (Button, Card, Badge, VerifiedBadge, Input, Avatar, Chip, Rating, Logo [SVG monoline placeholder], ThemeToggle, Reveal, Container, SectionHeading), CreatorCard, SiteHeader/Footer, HeroSearch, StatsBand.
- **Pages:** `/` (Collabstr-style landing — dark hero + search + creator strip + stats + how-it-works + featured + team cards + anti-AI CTA) and `/styleguide` (component/token showcase). Verified in light + dark.
- **Logos:** raster in `assets/brand/` (symbol + combined-stacked). In-app logo is a themeable SVG recreation — **need designer's final SVG** (horizontal lockup + favicon) for production.
- **Docs:** `docs/PRD.md` (this), `docs/competitor-ugc-ng-teardown.md`, `docs/tech-stack.md`, `docs/go-to-market-90-day.md`.
- **Backend scaffolded (2026-10-17):** Supabase wired — full **schema migrations** (`supabase/migrations/`: 24 tables + enums + triggers covering §22) with **RLS on every table** (money tables `escrow_transactions`/`ledger_entries`/`payouts` + `audit_log` have **no user write policies** — service-role only). App clients (`src/lib/supabase/` browser/server/admin), session `src/middleware.ts` (env-guarded), and **auth** — `/login`, `/signup` (Google/Meta/X OAuth + email magic link + creator/brand fork), `/auth/callback`, `/auth/signout`. Typechecks clean. Setup steps (project, env, OAuth) in `docs/backend-setup.md` — needs founder to create the Supabase project + register OAuth apps.
- **Backend is LIVE (2026-10-18):** founder created the Supabase project, set env in `.env.local`, and the migrations are applied (verified: `creator_profiles`/`creator_metrics` return `200 []` via REST; RLS working).
- **Onboarding built:** `/onboarding` (role fork → creator 3-step wizard / brand form, writes to `creator_profiles`/`brand_profiles` via server actions under RLS), `/dashboard` (profile status + verification prompts + "view my card"), auth callback routes OAuth/magic-link → onboarding. Auth-gated (verified: unauth → `/login`). Auth pages use the `cacheComponents` Suspense pattern (dynamic work inside `<Suspense>`). Typechecks clean.
- **Verification gate built (2026-10-18):** `/verify` → profile completeness + **Paystack bank verification** (live once `PAYSTACK_SECRET_KEY` added) + **identity (Smile ID/Dojah)** (scaffolded, "not connected" until keys) + agreements acceptance → `goLiveAction` sets `is_live` via the **service role**. **Airtight:** new `*_harden_grants.sql` migration locks verification/tier/is_live columns to service-role writes (creators can only edit profile fields) — **must be applied**. Provider abstraction in `src/lib/payments/paystack.ts` + `src/lib/kyc/`. Typecheck clean; `/verify` gated (verified).
- **Creator directory built (2026-10-18):** `/creators` (public) reads **live creators from the DB** (`is_live=true` via RLS) with **niche / price / text-search filters** (URL-driven), honest empty states ("directory is just opening" / "no creators match"), and a `GridSkeleton`. CreatorCard now handles real data (optional photo → initials placeholder, verified badge, links to `/@handle`). Verified live (empty, since no creators are live yet). Landing niche pills point here.
- **Hiring flow (Path A) built (2026-10-18):** public creator profile `/[handle]` (`/@handle` URLs) with rate card + "Make an offer" → offer form (`/[handle]/hire`) → `offers` table → **offers inbox `/offers`** (creator accept/decline, brand withdraw/**fund escrow**) → on fund, **Paystack checkout** → **webhook `/api/paystack/webhook`** creates the **gig + escrow + double-entry ledger + notifications** via the service role, idempotently → minimal gig page `/gigs/[id]`. Fee = 12% (`src/lib/fees.ts`). Funding shows "payments not connected" until `PAYSTACK_SECRET_KEY` is set. **`gigs` writes now locked to service role** (`*_gig_grants.sql`). Typecheck clean; `/@handle` verified.
- **Shareable creator card built (2026-10-18):** `/@handle` is now the full card — header + verified badge, **social icon links** (IG/TikTok/YouTube/Twitch/X), bio, niches, a **packages rate card** (from the `packages` table, falls back to starting rate), "Make an offer" CTA, and a **Share modal** with a scannable **QR code**, copy-link, native share, and **save-contact (vCard)**. Components: `creator-profile.tsx`, `share-card.tsx` (`qrcode.react`), `ui/social-icons.tsx`. `/@demo` renders a sample for preview. Verified live (profile + QR modal). Live social *embeds* (oEmbed) still to come.
- **Gig workspace built (2026-10-18) — core money loop complete:** `/gigs/[id]` — creator **uploads a draft** (direct-to-Supabase-Storage via service-role signed URLs; private `deliverables` bucket), both parties leave **time-stamped video feedback** (`deliverable_comments`, click a timecode to seek), brand **requests revision** or **approves & releases** → service role marks deliverable approved, completes the gig, releases escrow, writes release+payout **ledger** entries, and **queues a Paystack transfer payout** to the creator's recipient (bank details + recipient code captured at verification; gated on Paystack). Dashboard lists "Your gigs". `/gigs/demo` preview verified live (video, feedback, approve). Components: `gig-workspace.tsx`; actions `src/app/gigs/actions.ts`.
- **Full loop now works (architecturally):** discover → profile/share → offer → fund escrow → deliver → feedback → approve → **release → payout**.
- **Reviews + disputes built (2026-10-18):** **two-way, verified-transaction reviews** (only on completed gigs, one per side via `unique(gig_id, role)`, author/subject enforced; aggregate recomputed into `creator_metrics`) shown on `/@handle` and submittable on the gig page. **Disputes:** a participant can open a dispute from the gig page (→ gig `disputed`, escrow held, banner shown); a minimal **`/admin/disputes`** mediation page (admin-gated via `admin_users` RLS) resolves **release / refund / split**, applying ledger entries + queued payout/refund via the service role. Actions in `src/app/gigs/trust-actions.ts`. Reviews display verified live (`/@demo`).
- **Admin console built (2026-10-18):** `/admin` with **layered RBAC** (`src/lib/admin/rbac.ts` — roles super_admin/finance/trust_safety/support/growth/analyst → section access; analyst read-only; nav + pages + write-actions all gated). Sections: **Overview** (live stats), **Verification queue** (approve identity / set live — doubles as the manual KYC gate until Smile ID is wired), **Users** (creators + brands, feature toggle), **Gigs** (oversight), **Finance** (escrow release/refund + payout controls), **Disputes** (mediation), **Roles** (add/change/remove admins by email). All writes via service-role actions in `src/app/admin/actions.ts`. Gate verified (non-admin → redirected). **To access: add yourself to `admin_users` via SQL** (`insert into admin_users (user_id, role) values ('<your-auth-uid>','super_admin')`). No new migration.
- **Note:** Next 16 deprecation — `middleware.ts` → `proxy.ts` **done** (`src/proxy.ts` exports `proxy`, old file removed; matcher excludes static + `/brand/` logo assets).
- **Open briefs / Path B built (2026-10-18):** brands **post a brief** (`/briefs/new` → `briefs` table), a **public briefs board** (`/briefs`), **brief detail** (`/briefs/[id]`) where creators **apply** (pitch + sample → `applications`) and the brand owner sees applications and **"Select & fund"** → creates an accepted offer from the brief and funds it via the existing escrow flow (Paystack). Dashboard links added (brand: Post a brief; creator: Find briefs). Actions in `src/app/briefs/actions.ts`. Board verified live (empty state). Reuses offer→fund→webhook→gig machinery.
- **Notifications UI built (2026-10-18):** a **client bell island** (`components/layout/notification-bell.tsx`) with unread count + dropdown, reading the `notifications` table via the browser client (RLS: own), **Supabase Realtime** for live new-notification pushes (migration `*_notifications_realtime.sql` adds the table to the publication), mark-read on click + mark-all. Added to SiteHeader, dashboard, and offers headers (renders nothing when logged out, so marketing pages stay static). Full list at `/notifications`. Header verified unaffected logged-out.
- **Live social embeds built (2026-10-18):** creators add post links (platform auto-detected) in the dashboard **"Featured work"** manager → they render as **live embeds** on `/@handle` ("Recent work"). YouTube via iframe; X / TikTok / Instagram via their official embed scripts (oEmbed-style blockquotes, no API keys). New `portfolio_links` table (`*_portfolio_links.sql`, RLS public-when-live/owner). Components: `social-embeds.tsx`, `dashboard/portfolio-manager.tsx`, `lib/social/detect.ts`, actions `app/portfolio/actions.ts`. **Verified live** on `/@demo` — YouTube + a real X post both rendered.
- **Per-view funded-pool campaigns built (2026-10-18, ugc.ng parity):** brands create a campaign (`/campaigns/new`) with a **pool** + **rate per 1,000 views**, **fund the pool** via Paystack (webhook extended for `campaign_funding`); a **public board** `/campaigns`; detail `/campaigns/[id]` where creators **submit** a post + report views, and the brand **approves & pays** per-1,000 from the pool (queued Paystack payout) or **forfeits** inflated claims — **submissions, claims and forfeits are public** (anti-fraud). New `campaigns` + `campaign_submissions` tables (`*_campaigns.sql`, money columns service-role-locked). Nav updated (Campaigns). Board verified live.
- **Polish pass (2026-10-18):** `middleware`→`proxy` rename done; **Services surface** built (`/services` — public, reads active `packages` from live creators via RLS, honest empty state, in header nav); **real static `/pricing`** (100% to creators, 12% flat fee, ₦50k→₦56k example, per-view section — no fabricated data); shared `SimplePage` + `LegalNotice` → `/about`, `/trust`, and P0 legal stubs (`/terms`, `/privacy`, `/creator-agreement`, `/brand-agreement`, `/escrow-terms`, "being finalized with counsel" + `legal@ugcorigin.com`); **footer rewired to real routes only** (dead `/how-it-works`, `/payouts`, `/tiers`, `/blog`, `/contact` removed); verify-flow agreement links now resolve. Typecheck clean; `/services` + `/pricing` verified live.
- **Auth-aware shell + fixes (2026-10-18):** login crash fixed; auth-aware header + role profile dropdown; NotificationBell realtime fix; `PillRow` (no-wrap scroll) swept across all niche/category/filter pills; global + creator-scoped 404s; "marketplace"→"Network"; **verbose `/settings`** (photo/logo upload via Supabase Storage, profile fields, niches, notification prefs). New migration `*_settings_avatars.sql`.
- **Tier + pricing engine (2026-10-18):** 7 tiers (Origin→…→Luminary), per-tier price floors (trigger-enforced), entry cap at Pro, ±1-step no-jump progression, full EPS/ERS/metrics SQL engine + weekly standings, trigger-driven; TierBadge shown on dashboard/profile/settings. Migrations `*_tier_enum.sql` + `*_tier_engine.sql`. See `docs/tiering-and-ranking.md` v2.
- **Featured boost (2026-10-18):** paid Paystack-funded bounded visibility for creators/briefs/campaigns; `boosts` table + `active_boost_target_ids()`; `BoostButton` on dashboard/brief/campaign; featured band on directory + boards; `/admin/boosts` oversight. Migration `*_boosts.sql`. Never touches ranking.
- **Pricing + docs (2026-10-18):** value-led `/pricing` (no forward fee), real fee in-platform + in docs; `doc_pages` admin-editable documentation system (`/docs`, `/admin/docs`). Migration `*_doc_pages.sql`.
- **CRO landing pages (2026-10-18):** `/for-brands` + `/for-creators` (slim nav, hero→signup with role preselect, proof strip, value props, steps, FAQ). No migration.
- **WIP-integration gating (2026-10-18):** OAuth buttons gated by `NEXT_PUBLIC_OAUTH_PROVIDERS` (default google only); identity verification offers manual review (no dead end) → admin queue.
- **Downloadable card image (2026-10-18):** `/card/[handle]` `next/og` PNG (photo/name/tier/rate/niches), preview + download in the share modal. No migration.
- **SEO/AEO/GEO (2026-10-18):** Org/WebSite/ProfilePage/FAQ/Breadcrumb JSON-LD, per-page metadata + Twitter cards, creator OG reuses `/card`, default `opengraph-image`, dynamic `sitemap.ts` + `robots.ts` + `/llms.txt`.
- **Entry-signal auto-placement (2026-10-18):** `placeCreator()` writes `entry_signals` at go-live (self-serve + admin) → EPS places capped at Pro; honest inputs (portfolio count + niche demand), followers/prior-work TODO.
- **Content moderation (2026-10-18):** `reports` table + `ReportButton` (profile/review/submission) + `/admin/moderation` console (take profile offline / remove review / forfeit submission / dismiss, audited). Migration `*_reports.sql`.
- **Analytics (2026-10-18):** GA4 + Clarity + Meta Pixel behind a consent banner, env-gated, SPA page views; footer "Cookie preferences". No migration.
- **Not built yet:** real follower-API + verified prior-work for richer placement; KYC adapter completion (Smile ID/Dojah); real legal copy (lawyer); deliverable-report entry point (gig workspace). **All headline founder-brief phases are complete.** See [[ugcorigin-locked-decisions]].

## 24. Honesty / no-fabricated-data principle [LOCKED]
- **No fake data points, ever.** Metrics (creator/brand counts, ratings, review counts, GMV, testimonials) are **server-truth only** and render **only once real and past a sensible threshold**. Pre-launch shows a **temp look**: honest product-fact tiles (100% to creators, 12% fee, escrow, next-day payouts), not invented counts. Components are built data-driven (e.g. `CreatorCard` shows a rating only if one exists).
- **Imagery = real people, representative of our market:** African / Nigerian creators (Pexels free/commercial, hotlink-OK via `images.pexels.com`), never white/Asian stock with Nigerian names, never AI faces. Marketing creator cards are representative (photo + name + niche + illustrative rate), with **no fabricated ratings/metrics**.
- **No emoji/sparkle junk** in UI — trust is conveyed with real signals (escrow-protected, identity-verified, Paystack payouts) and clean iconography.

## 25. Legal & compliance
Full framework, document set, NDPR/escrow/IP considerations, and the one-page lawyer brief → **`docs/legal-framework.md`**. Top risks: escrow structure (no self-custody of funds — §12.2) and NDPR data handling. P0 docs (ToS, Privacy, Escrow/Payment terms, Creator & Brand agreements) must be published and click-accepted (versioned, timestamped) before the first real paid gig. **Starter drafts now exist in `docs/legal/`** (ToS, Privacy, Creator & Brand agreements, Escrow & Payment terms + README) — marked NOT-LEGAL-ADVICE, with `[PLACEHOLDERS]` and ⚖️ open questions, for the lawyer to finalize. (Content Licensing can be folded into the agreements or drafted separately.)

## Changelog
- **2026-10-18 — v0.37:** **Categories + rich filters + recommendation-ranked directory.** Full service taxonomy (`src/lib/categories.ts`, ~42 categories — **no "AI UGC"**, anti-AI) now drives onboarding/filters/forms (NICHES re-exports CATEGORIES). `/creators` rebuilt: filter by **service, region (NG states), budget, platform** (via indexed `social_accounts` prefilter) + **sort** (Recommended default, Top rated, Price, Recently active). **Recommendation engine** `src/lib/ranking.ts` scores the candidate set by outcome (ERS) + reviews + tier + verification + niche/text fit + freshness + bounded boost (the model in `docs/tiering-and-ranking.md`). DB does indexed filtering, app ranks the bounded set — fast. New migration `*_directory_indexes.sql` (GIN on niches, live+rate / live+ERS btrees, pg_trgm on name+location, social platform index). Applied live; verified. Typecheck clean.
- **2026-10-18 — v0.36:** **In-app messaging + push/deploy milestone.** Brand↔creator **conversations** with realtime chat, **attachments** (private `chat` bucket, image/PDF, 10MB, signed-URL reads), and **contact-detail redaction** (phones/emails/links/off-platform handles hidden until a funded contract exists, sender warned). `/messages` inbox + `/messages/[id]` thread, header link, **Message** button on profiles, message notifications. **Admin** read-only oversight at `/admin/messages` (new RBAC `messages` section; admins read all via RLS). Migration `*_messaging.sql`. Also: fixed dark-section heading colors (for-brands/creators/pricing), auth pages now use a full-bleed creator photo + dark overlay, **all em/en dashes removed** from copy, **Snapchat** added as a social (`*_snapchat.sql`), `.env.local` synced. **All migrations applied to the live DB; repo pushed to github.com/obadeyi01-hash/ugcorigin.** Typecheck clean.
- **2026-10-18 — v0.35:** **Analytics behind consent (privacy-first).** `src/components/analytics/analytics.tsx` — GA4 + Microsoft Clarity + Meta Pixel load via `next/script` **only after the visitor clicks Accept AND only if that provider's env ID is set** (`NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_CLARITY_ID` / `NEXT_PUBLIC_META_PIXEL_ID`); with no keys or no consent, **zero third-party scripts run**. Cookie consent banner (Accept / Decline, links to Privacy) stored in localStorage; a footer **"Cookie preferences"** link reopens it (custom event). SPA page_view tracking on route change (gtag + fbq). Mounted once in root layout; footer link + env documented in `.env.local.example`. No migration. Typecheck clean; privacy default (no IDs → no banner/scripts) + no console errors verified.
- **2026-10-18 — v0.34:** **Content moderation.** New `reports` table (`*_reports.sql`: report_target_type [profile/review/campaign_submission/deliverable] + report_status enums; RLS — users insert their own via column grant, admins read all, status/resolution service-role only). **Reporting entry points:** reusable `ReportButton` dialog (reason + details) on the **creator profile**, each **review**, and each **campaign submission** (`submitReportAction`). **Admin console `/admin/moderation`** (new RBAC section `moderation` → super_admin/trust_safety write, support/analyst read; in admin nav): lists reports (open first) with context + resolve/action buttons scoped to target type — **take profile offline** (is_live=false), **remove review** (delete + recompute standing), **forfeit submission**, or **dismiss** — all audited. Actions in `src/app/admin/moderation/actions.ts`; `ReportButton` added `id` to `ProfileData`. New migration `*_reports.sql`. Typecheck clean; report dialog + admin gate verified live.
- **2026-10-18 — v0.33:** **Entry-signal auto-placement at go-live.** `placeCreator()` (`src/lib/tiering/placement.ts`, server-only) populates `entry_signals` when a creator goes live — from `goLiveAction` (self-serve) and `adminSetLive` (manual approval) — so `compute_eps` places them (capped at Pro) instead of everyone starting Origin. **Honest inputs only:** real `portfolio_count` (linked samples) + a configured `niche_demand_score` (`src/lib/niche-demand.ts`, max demand across their niches); `verified_followers`/`prior_work_score` stay 0 until follower-API + verified prior-work land. Writing the row fires the `trg_entry_signals` trigger → `compute_eps` + `recompute_creator_tier` (so the tier-bounded floor also applies). Activates once `*_tier_engine.sql` is applied. No new migration. Typecheck clean.
- **2026-10-18 — v0.32:** **SEO / AEO / GEO pass.** `JsonLd` helper (`src/components/seo/json-ld.tsx`, `<`-escaped) + **Organization & WebSite (SearchAction) JSON-LD** site-wide in the root layout; root metadata gained keywords, canonical, `en_NG` locale, and a **Twitter summary_large_image** card; a branded default **`opengraph-image.tsx`** (next/og) applies to all pages. **Creator profiles** (`/@handle`) now have `generateMetadata` (real title/description, canonical, `robots:noindex` when not live) whose **OG/Twitter image reuses the `/card/{handle}` PNG**, plus **ProfilePage/Person JSON-LD** (address, knowsAbout, real AggregateRating when reviews exist, Offer at starting rate) and **BreadcrumbList**. **FAQPage JSON-LD** on `/for-brands` + `/for-creators`. **Dynamic `sitemap.ts`** (static routes + live creators + published docs, via service role) and **`robots.ts`** (allow all incl. AI crawlers, disallow private surfaces, link sitemap). **`/llms.txt`** route — a structured site summary for answer/generative engines (GEO). No migration. Typecheck clean; robots/sitemap/llms + profile JSON-LD/OG verified live.
- **2026-10-18 — v0.31:** **Auth screens' right panel upgraded** with real, premium imagery. The obsidian brand side of `(auth)/layout.tsx` now shows an editorial masonry collage of four representative verified Nigerian creators (real Pexels photos from `SAMPLE_CREATORS`, offset 2-col grid, rounded, with name + niche + Verified badge captions on a backdrop-blur scrim), between the headline and the escrow/verified/payouts trust list. Desktop-only (`lg:`), so no mobile cost; no fabricated metrics. No migration. Verified on signup (collage + Google-only OAuth both showing).
- **2026-10-18 — v0.30:** **Homepage numbers tuned (honest, dual-framed).** Reworked `StatsBand`: dropped the forward-facing "12%" (now off-brand per the Upwork-style pricing) and replaced the set with structural truths framed for both sides — **brands** read affordable/safe ("From ₦10k · Affordable to start" [mirrors the Origin price floor], "Escrow · Protected both ways"); **creators** read earn-well/fast ("100% · No cut from what you earn", "Next-day · Approved work pays fast"). Each tile gained a one-line sub. No fabricated counts (per §24). No migration. Verified on the homepage.
- **2026-10-18 — v0.29:** **Downloadable profile-card image.** New `src/app/card/[handle]/route.tsx` server-renders a branded 1200×630 PNG via `next/og` `ImageResponse` (photo, UGCOrigin logo, name, @handle, location, tier badge, Verified-Human, niches, starting rate, profile URL) — real data only, reads live creators via RLS (service-free), supports the `demo` handle for preview, and forces download with `?download=1` (Content-Disposition). Photo fetched server-side (no client CORS/canvas). Rate shown as "NGN …" since the default OG font lacks ₦. Share modal (`share-card.tsx`) now shows a live preview + **Download card image** button, alongside the existing QR/copy/vCard. Reusable as the profile OG image later. No migration. Typecheck clean; demo card verified presentable.
- **2026-10-18 — v0.28:** **Gated work-in-progress integrations so nothing looks broken.** **OAuth:** sign-in buttons now render only for providers actually enabled, via `NEXT_PUBLIC_OAUTH_PROVIDERS` (comma-separated google/meta/x; **defaults to google only** so Meta & X are hidden until configured; empty = email-link only). The "or" divider hides when no providers show. **Identity verification:** replaced the dead-end "not connected" message — when no KYC provider is wired, creators can **Submit for manual review** (`requestManualVerificationAction` flags them pending → they surface in the existing admin verification queue; admin approves identity + sets live). The flow shows "Under review — within 24h, set live automatically" and the go-live note reflects that instead of implying the creator is stuck. Bank verification (Paystack, configured) unaffected. `.env.local.example` documents the OAuth flag. No migration. Typecheck clean; login verified showing Google-only.
- **2026-10-18 — v0.27:** **CRO landing pages (phase 4).** Two conversion-focused, ad-traffic destinations: **`/for-brands`** and **`/for-creators`**. Each has a slim focused header (logo + one CTA, no nav — fewer exit leaks via `LandingNav`), an obsidian hero with a single primary CTA → `/signup?role=…`, honest trust microcopy (no fabricated metrics), value-prop cards, a 4-step how-it-works, an anti-AI/verified-human differentiator, a native `<details>` FAQ (`Faq`), and a closing CTA. Brand page shows a representative verified-creator proof strip (real Pexels people from `SAMPLE_CREATORS`, no fake numbers); creator page quotes the real ₦10k Origin floor. **Signup now preselects the role** from `?role=` (AuthForm reads `useSearchParams`, auth layout wraps children in Suspense). Footer links to both. No migration. Typecheck clean; both pages + role preselect verified live.
- **2026-10-18 — v0.26:** **Pricing rework (Upwork-style) + admin-editable docs.** `/pricing` no longer forward-faces the 12% fee or the ₦56k example — it's now **value-led** (honest facts only: 100% to creators, ₦0 to join/browse, next-day payouts, escrow/verified/pay-on-approval/fair-disputes guarantees), with a vague-but-truthful fee note linking to the docs. **Real fee detail moved in-platform**: shown to brands before they pay (already on the funding step, `offer-list.tsx`) and spelled out in the docs. **Admin-editable documentation system**: new `doc_pages` table (slug/title/category/body/published/sort; RLS public-read-published, service-role writes) seeded with 6 verbose pages (Fees & payments [holds the real fee terms], How escrow works, Getting paid, For brands, For creators, Trust & safety). Public `/docs` index + `/docs/[slug]` with a safe in-house Markdown renderer (`src/components/ui/markdown.tsx`, no deps, no raw HTML). Admin `/admin/docs` CRUD (RBAC section `docs` → super_admin/growth/trust_safety write, analyst read; audited) — create/edit/publish/delete, edits publish live. Footer links to /docs. **New migration `*_doc_pages.sql`.** Typecheck clean; /pricing + /docs verified.
- **2026-10-18 — v0.25:** **Featured boost system (phase 3).** Paid, Paystack-funded, **bounded** visibility for **creators (profile), brands (brief & campaign)**. New `boosts` table (single source of truth: active = status 'active' AND ends_at > now()) + `active_boost_target_ids()` SECURITY DEFINER fn for public placement reads (exposes only target ids, never owner/amount). Packages/pricing in `src/lib/boosts.ts` (creator ₦4k/7k/14k for 1/2/4 wks; brief & campaign ₦3k/5k/10k). Checkout `src/app/boost/actions.ts` → Paystack; **webhook activates** the boost for N days + notifies. UI: reusable `BoostButton` dialog on the creator dashboard, brief detail (owner) and campaign detail (owner); boosted items **float into a capped, labelled "Featured" band** on the creator directory and the briefs/campaigns boards (`CreatorCard` already renders the badge). **Boost never touches ranking/tier/ERS or the newcomer exploration reservation** — it only adds the bounded featured band. Admin: new `/admin/boosts` (RBAC `boosts` → super_admin/growth/finance write, analyst read) — live count, revenue, list, and **end-boost**; admin cancel in `boost/actions.ts`. **New migration `*_boosts.sql`.** Typecheck clean; gates + boards verified.
- **2026-10-18 — v0.24:** **Admin tier oversight.** New `/admin/tiers` (RBAC section `tiers` → super_admin/growth/trust_safety write, analyst read-only; added to admin nav): edit `tier_config` (label/tagline/floor per rung), view all creators ranked by ERS with tier/gigs/reviews/floor/rate, **override a creator's tier** (±-step rule is for the auto-engine; admin override is a manual exception), and **trigger `recompute_creator_tier`** per creator. **All three actions write `audit_log`** (before/after). Actions in `src/app/admin/tiers/actions.ts` (service role + `guardWrite`); components `tier-config-editor.tsx`, `creator-tier-controls.tsx`. Typecheck clean; gate verified (non-admin redirected). No new migration (uses the tier-engine tables/fn).
- **2026-10-18 — v0.23:** **Tier + pricing engine baked (phase 2).** Extended the ladder to **7 tiers** — Origin → Rising → Pro → Standout → Elite → Signature → Luminary (enum order = ladder; `tier_config` holds admin-editable labels/taglines/floors). **Per-tier price floors** (₦10k→₦200k) enforced server-side by the `enforce_rate_floor` trigger (creators can't price below their tier). **Entry capped at Pro**; higher tiers earned-only. **No jumping** — `recompute_creator_tier` moves ±1 rung per recompute with weekly `tier_standings` snapshots. Full SQL engine: `compute_eps` (capped head start + decay), `recompute_creator_metrics` (from real gigs/reviews — no fabrication), `compute_ers`, driven by triggers on gig completion, reviews and entry-signals. UI: `TierBadge` + `src/lib/tiers.ts`, tier shown on dashboard, public profile and settings; settings shows the tier floor and clamps the rate. **Two new migrations: `*_tier_enum.sql` then `*_tier_engine.sql` (apply in order).** Model doc updated to v2 (`docs/tiering-and-ranking.md`). Typecheck clean; tier badge verified on `/@demo`. **Deferred follow-ups:** admin tier oversight UI, and populating `entry_signals` from verified socials at go-live (until then everyone starts Origin and climbs on ERS).
- **2026-10-18 — v0.22:** **Auth-aware shell + fixes (phase 1 of the big founder brief).** Fixed the login-blocking `Date.now()` prerender crash (`createClient` now calls `await connection()` first — covered `/dashboard`, `/onboarding` and all session pages). Header is now **auth-aware** (`header-client.tsx`): logged-out → Log in / Get started; logged-in → NotificationBell + **role-based profile dropdown**; **logo → `/dashboard` when signed in**. Fixed the **NotificationBell realtime crash** (unique channel topic per mount). Added **`PillRow`** (single-line, horizontally-scrollable, never wraps) and swept it across **all niche/category/filter pill rows** (homepage hero + "Every niche", creator directory filters, creator cards & profile, onboarding, brief & campaign forms, briefs & campaigns boards + detail). Added **global + creator-scoped 404s** (real `notFound()`). Removed **"marketplace"** from all UI copy → **"Network"** (founder-locked positioning). Built the **verbose `/settings` page** — profile photo / brand logo upload (Supabase Storage public `avatars` bucket, per-user folder RLS), profile fields, niches (PillRow multi-select), notification prefs (`user_settings` table), account/email + sign out. **New migration `*_settings_avatars.sql` must be applied** (adds `creator_profiles.avatar_url` + grant, `user_settings` table + RLS, `avatars` storage bucket + policies). `next.config.ts` now allows Supabase Storage images. Typecheck clean; verified live (header states, no-wrap pills at 375px, both 404s, /settings auth gate). Decisions locked this session: positioning = **Network**, pricing = **Upwork-style + admin-editable docs**, 7 tiers, WIP integrations must degrade gracefully — see [[ugcorigin-locked-decisions]].
- **2026-10-18 — v0.21:** **Polish/cleanup pass.** Renamed `src/middleware.ts` → `src/proxy.ts` (Next 16 deprecation; exports `proxy`). Built the **Services surface** `/services` (public, browsable active creator packages via RLS, honest empty state, added to header nav). Added a real static **`/pricing`** page (100%-to-creators, 12% flat fee, worked example, per-view campaigns — no fabricated numbers). Added shared `SimplePage`/`LegalNotice` and filled the dead links: `/about`, `/trust` (real content) and P0 legal stubs `/terms`, `/privacy`, `/creator-agreement`, `/brand-agreement`, `/escrow-terms` ("finalized with counsel" + `legal@ugcorigin.com`). **Rewired the footer to real routes only** (removed `/how-it-works`, `/payouts`, `/tiers`, `/blog`, `/contact`). No dead internal links remain (verify-flow agreement links now resolve). Typecheck clean; `/services` + `/pricing` verified live. No new migration.
- **2026-10-18 — v0.20:** Built **per-view funded-pool campaigns** (ugc.ng parity) — create + fund a pool, public board + detail, creator submit + report views, brand approve-&-pay per 1,000 / forfeit (public claims & forfeits). New `campaigns` + `campaign_submissions` tables, Paystack webhook extended for campaign funding, Campaigns nav. Board verified live. New migration `*_campaigns.sql`.
- **2026-10-18 — v0.19:** Built **live social embeds** — creators add X/IG/TikTok/YouTube post links (auto-detected) in a dashboard "Featured work" manager; they render live on `/@handle` (YouTube iframe; X/TikTok/IG via official embed scripts, no keys). New `portfolio_links` table + RLS. Verified live on `/@demo` (YouTube + X both rendered). New migration `*_portfolio_links.sql`.
- **2026-10-18 — v0.18:** Built the **notifications UI** — a client bell island (unread badge + dropdown, Supabase Realtime, mark-read/mark-all) on the main headers, and a `/notifications` page. Added `*_notifications_realtime.sql`. Bell renders nothing logged-out (marketing stays static); header verified.
- **2026-10-18 — v0.17:** Built **open briefs (Path B)** — post a brief (`/briefs/new`), public board (`/briefs`), brief detail (`/briefs/[id]`) with creator apply + brand applications list and **"Select & fund"** (creates an accepted offer from the brief → funds via the existing escrow flow). Dashboard links added. Actions in `briefs/actions.ts`. Board verified live. Both demand paths (A direct-hire + B open-brief) now exist.
- **2026-10-18 — v0.16:** Built the **full admin console** with layered RBAC (`src/lib/admin/rbac.ts`, `components/admin/admin-shell.tsx`): Overview stats, Verification queue (identity/live), Users (feature toggle), Gigs oversight, Finance (escrow release/refund + payouts), Disputes (refactored into the shell), Roles (manage admins). All writes service-role-gated by role in `src/app/admin/actions.ts`. Gate verified. Add yourself to `admin_users` to access. (Next 16: `middleware`→`proxy` deprecation noted.)
- **2026-10-18 — v0.15:** Built **reviews** (two-way, verified-transaction-only, one per side, aggregate into `creator_metrics`, shown on profile + submittable on the gig page) and the **dispute/mediation flow** (participant opens a dispute → gig disputed + escrow held + banner; minimal admin `/admin/disputes` resolves release/refund/split with ledger + payout/refund via service role). Actions in `trust-actions.ts`. Reviews verified live on `/@demo`. To mediate, add yourself to `admin_users` (SQL).
- **2026-10-18 — v0.14:** Built the **gig workspace** — draft upload (service-role signed URLs, private `deliverables` bucket), time-stamped video feedback, request-revision, and **approve → release escrow → ledger → queue Paystack payout** (recipient captured at bank verification). Added payout fields to `creator_profiles`, Paystack transfer fns, dashboard "Your gigs", `/gigs/demo` preview. Core money loop complete. Verified live. New migration `*_gig_workspace.sql`.
- **2026-10-18 — v0.13:** Built the **richer shareable creator card** on `/@handle` — social icon links, a packages rate card (from `packages`), and a Share modal with **QR code** (`qrcode.react`), copy-link, native share, and vCard save-contact. Added `creator-profile.tsx`, `share-card.tsx`, `ui/social-icons.tsx`; `/@demo` sample. Verified live (card + QR modal).
- **2026-10-18 — v0.12:** Built the **Path A hiring flow** — creator profile `/@handle` + rate card, make-an-offer form, offers inbox (`/offers`) with accept/decline/withdraw/**fund escrow**, Paystack checkout init + **webhook** that creates gig + escrow + double-entry ledger + notifications (service role, idempotent), minimal gig page. Locked `gigs` writes to service role (`*_gig_grants.sql`). Fee util `src/lib/fees.ts` (12%). Funding gated on Paystack key. Typecheck clean; `/@handle` verified live.
- **2026-10-18 — v0.11:** Built the **creator directory** `/creators` — live DB reads (RLS `is_live`), niche/price/search filters (URL-driven, client filter bar), honest empty states, skeleton; CreatorCard reworked for real data (placeholder when no photo, verified badge, `/@handle` links). Landing niche pills now deep-link into the directory filters. Verified live. (Learned: under `cacheComponents`, client components using `useSearchParams` must be wrapped in `<Suspense>`.)
- **2026-10-18 — v0.10:** Built the **verification gate** — `/verify` (profile + Paystack bank verify + identity scaffold + agreements → go-live via service role) and a dashboard "Verify to go live" CTA. Hardened security: `*_harden_grants.sql` locks verification/tier/is_live columns to service-role writes (needs applying). Added Paystack + KYC provider abstractions and env keys. Typecheck clean; gate verified gated.
- **2026-10-18 — v0.9:** Built **onboarding** (role fork → creator wizard / brand form → server-action inserts under RLS), **/dashboard**, and OAuth/magic-link callback routing to onboarding; auth-gated. Founder **connected Supabase and applied all migrations** — backend is live (verified via REST). Drafted the **P0 legal starter docs** in `docs/legal/` (ToS, Privacy, Creator/Brand agreements, Escrow terms + README). Typecheck clean; login verified live.
- **2026-10-18 — v0.8:** Added **tiering & entry-leveling** — the "leveler" that credits established creators on a decaying, capped head start (entry capped at Pro) while reserving exploration slots for newcomers, funded by capping top creators' impression share; concrete EPS/ERS formulas + worked examples in `docs/tiering-and-ranking.md`, schema in `*_tiering.sql` (entry_signals, creator_metrics, tier_standings + head-start fields; all scores service-role-computed). Added **shareable creator card/rate card at `/@handle` with QR** (§5.5). Added **legal framework** (§25, `docs/legal-framework.md`) with lawyer brief.
- **2026-10-17 — v0.7:** Stood up the **Supabase backend** — full schema migrations (24 tables, enums, triggers, `handle_new_user`) with **RLS on every table** and service-role-only writes on money/audit tables; app clients + env-guarded session middleware; **auth** pages (Google/Meta/X OAuth + email magic link, creator/brand fork), callback + signout routes; `docs/backend-setup.md`. Added `@supabase/supabase-js` + `@supabase/ssr`. Typechecks clean; signup page verified live. Founder action: create Supabase project + register OAuth apps (X may need paid tier).
- **2026-10-17 — v0.6:** Big correction pass per founder — **accent is now PINK** (`#DB2777` + pink hues peach/lavender/mint; amber dropped), "UGC" wordmark pink. **Removed all fabricated data** (stat counts, ratings, review counts, testimonials) → honest product-fact band + data-driven components (§24). **Real African/Nigerian photography** (Pexels, verified by eye) replacing the wrong white/Asian stock. **Hero reworked** with genuine trust signals (escrow / verified / Paystack), no emoji. CreatorCard redesigned portrait-forward. Verified live.
- **2026-10-17 — v0.5:** Polish pass per founder: **light-only** (removed dark mode — premium light), wired the **real logo image** (transparent PNG from the provided files; SVG placeholder dropped), **real people/model photography** (verified Unsplash portraits + randomuser avatars, like Social Cat/Collabstr) via `next/image` + `remotePatterns`, **expert full copy** across the landing (+ value props + testimonials sections), premium inputs/dropdowns (custom `Select` w/ chevron), favicon from the mark. Bumped to latest stable (React 19.3.1, lucide 0.545; Next 16.4.2 / Tailwind 4.3.3 already latest). **Design decision: UGCOrigin is light-only.** [LOCKED]
- **2026-10-17 — v0.4:** Began the build — Next.js 16 + React 19 + Tailwind v4 app with the full design system and a Collabstr-aesthetic landing, verified live in light+dark (§23). Resolved Q4 (**Smile ID primary + Dojah backup**), Q14 (**bachs.io = Bachs**, billing/USD alt; Paystack-first), Q15 (**Namecheap domain → Cloudflare DNS**), Q16 (**no waitlist — launch-first**, `docs/go-to-market-90-day.md`), Q17 (**Collabstr-grade aesthetic**). Added `docs/tech-stack.md`. Added Bachs to payment abstraction. Declined harvesting ugc.ng signups (NDPR); ethical recruitment in GTM doc.
- **2026-10-17 — v0.3:** ugc.ng teardown done (`docs/competitor-ugc-ng-teardown.md`) → added parity: three surfaces incl. **Services** as a browsable marketplace, **gig types** (Original/Affiliate-unprotected/Other), **"Need N"** multi-slot gigs, **per-view funded-pool campaigns** with public claims/forfeits, **wallets/credits**, **configurable review window (default 7d) + one-click email approve/dispute + platform fallback adjudication** (§7.3b/§7b), next-day Paystack bank payout. Added **live on-profile social embeds (oEmbed, $0)** so work shows without leaving platform (§4.4). Resolved: Q6/Q6b → **Vercel + Supabase + Cloudflare** with honest cost/server facts (§18.4); Q12 → **standalone + DI footer attribution**; Q14 → **Paystack-ready, others later**; KYC cost **absorbed by platform, not charged upfront** (§12.5); lawyer available (Q5 brief pending). Logos copied to `assets/brand/`.
- **2026-10-17 — v0.2:** Resolved 5 blockers (Q1 Amber `#E8A317`; Q2 KYC approach: single provider + waterfall + Paystack bank resolution; Q3 take rate 12% + fuel-money model; Q5 escrow: provider-agnostic, no Stripe, licensed/legal hold; Q7 MVP: build-complete, Direct-Hire + Jolts visible, rest flagged off). Added: Dream Intrepid parent, lean/zero-budget posture, social OAuth (Google/Meta/X) + deep social linking (IG/TikTok/YouTube/Twitch/X), stringent verification gate, "fuel money" creator monetization (§8.2), Apple-grade design & motion principles (§3.4), AI assist features (§16), analytics + bot protection stack (§14), near-zero-cost tech stack + client/server guidance (§18), Jolts (§7a), data model / entity relationships (§22), dispute/refund flow (§7.5), new open questions Q11–Q14.
- **2026-10-17 — v0.1:** Initial PRD from founder brief.
