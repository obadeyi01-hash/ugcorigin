# UGCOrigin — Tech stack (for review)

> **Status:** v1 — 2026-10-17. Review this and flag anything to change. "Set up" = needs an account/API key from you (I'll tell you exactly when).
> Scaffolded and running locally today: Next.js app + design system (see `src/`). Everything else is planned and architected-for.

## Legend
- ✅ **In place** (scaffolded/working locally)
- 🔜 **Planned** (architected, not built yet)
- 🔑 **Needs your account/setup**

## 1. Frontend / app
| Thing | Choice | Status | Notes |
|---|---|---|---|
| Framework | **Next.js 16.4.2** (App Router) | ✅ | Note: this is a very new Next — stricter prerender rules (`cacheComponents`, `partialPrefetching` on). We code to them. |
| Language | **TypeScript 5** | ✅ | |
| UI runtime | **React 19.3** | ✅ | |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` tokens) | ✅ | Tokens live in `src/app/globals.css`. |
| Icons | **lucide-react** | ✅ | Clean line icons. |
| Class utils | **clsx + tailwind-merge** | ✅ | `cn()` helper. |
| Fonts | **Inter** (UI) + **Space Grotesk** (display) via next/font | ✅ | |
| Component system | Custom (Button, Card, Badge, Input, Avatar, Chip, Rating, Logo, Reveal, ThemeToggle, CreatorCard, header/footer…) | ✅ | See `src/components/`. Style guide at `/styleguide`. |
| Animation | CSS + IntersectionObserver `Reveal` (no heavy lib) | ✅ | Respects reduced-motion. |

## 2. Hosting, domain, edge
| Thing | Choice | Status | Notes |
|---|---|---|---|
| App hosting | **Vercel** | 🔑 | ~$20/mo Pro (commercial). Keep media off Vercel to avoid overage. |
| Domain registrar | **Namecheap** (buy `ugcorigin.com`) | 🔑 | Your call — buy it. |
| DNS + CDN + WAF | **Cloudflare** (point Namecheap nameservers to Cloudflare) | 🔑 | You manage everything through Cloudflare, as planned. |
| Media storage | **Cloudflare R2** (zero egress) | 🔑🔜 | Watermarked drafts vs final files. |
| Bot protection | **Cloudflare Turnstile** | 🔑🔜 | Free; protects hosting from bot abuse. |

## 3. Backend / data
| Thing | Choice | Status | Notes |
|---|---|---|---|
| Database | **Supabase Postgres** | 🔑🔜 | Free tier to start. The financial ledger lives here. |
| Auth | **Supabase Auth** — Google, Meta, X OAuth (+ email) | 🔑🔜 | Each social provider needs an app/keys (🔑). |
| Authorization | Postgres **Row-Level Security** + app RBAC | 🔜 | Flexible admin roles. |
| File storage | Supabase Storage or Cloudflare R2 | 🔜 | Likely R2 for media, Supabase for small assets. |
| Realtime/chat | Supabase Realtime | 🔜 | Slack-style gig messenger. |
| Architecture | **Modular monolith** (clean domain boundaries), extractable later | ✅(dir)🔜 | Not split client/server infra now (cost). |

## 4. Payments & verification
| Thing | Choice | Status | Notes |
|---|---|---|---|
| Payments (primary) | **Paystack** | 🔑🔜 | You have the account. Collections + transfers + free bank-name resolution. |
| Payments (alt) | **Flutterwave**, **Korapay/Monnify/Squad** | 🔜 | Behind a provider abstraction; swappable. |
| Billing / recurring / USD | **Bachs (bachs.io)** | 🔜 | For subscriptions/"fuel money" + USD/stablecoin settlement later. Claims unverified — treat as alt, confirm directly. |
| Escrow mechanism | Provider-native hold/settlement (NO Stripe, NO self-custody) | 🔜 | **Blocked on lawyer sign-off** — see PRD §12.2. |
| Identity KYC (primary) | **Smile ID** | 🔑🔜 | Per-check cost; platform absorbs at launch. |
| Identity KYC (backup) | **Dojah** | 🔑🔜 | Waterfall failover when Smile ID fails. |
| Bank verification | **Paystack account-name resolution** | 🔜 | Free/cheap; required before a creator goes live. |

## 5. Analytics, growth, comms
| Thing | Choice | Status | Notes |
|---|---|---|---|
| Web analytics | **Google Analytics 4** | 🔑🔜 | |
| Heatmaps/replay | **Microsoft Clarity** | 🔑🔜 | Free. |
| Ad attribution | **Meta Pixel** (+ Meta integration) | 🔑🔜 | For brand retargeting. |
| Product analytics | **PostHog** | 🔑🔜 | Free tier; funnels/events. |
| Transactional email | **Resend** or **Postmark** | 🔜🔑 | Pick one later. |
| WhatsApp/SMS | NG provider (e.g. Termii) | 🔜🔑 | Transactional nudges only. |
| Social embeds | Native **oEmbed** (X/IG/TikTok/YouTube/Twitch) | 🔜 | Free; show work on-profile without leaving. |

## 6. AI assist
| Thing | Choice | Status | Notes |
|---|---|---|---|
| LLM assist | Cost-guarded (cheap model + caching + free quota) | 🔜🔑 | Brand brief/contract drafter, creator profile helper. Provider TBD. |

## 7. Dev tooling
| Thing | Choice | Status |
|---|---|---|
| Linting | ESLint 9 + eslint-config-next | ✅ |
| Package manager | npm | ✅ |
| Repo/CI | GitHub + Vercel CI (planned) | 🔜🔑 |

## Your immediate setup checklist (when we reach each)
1. Buy **ugcorigin.com** on Namecheap → move DNS to **Cloudflare**.
2. **Vercel** account (connect GitHub).
3. **Supabase** project.
4. OAuth apps: **Google**, **Meta**, **X**.
5. **Paystack** keys (have), later **Flutterwave**/**Bachs**.
6. **Smile ID** (primary) + **Dojah** (backup) accounts.
7. **GA4**, **Microsoft Clarity**, **Meta Pixel**, **PostHog**.
8. **Cloudflare R2** + **Turnstile**.

**Flag anything here you want changed and I'll update the PRD + this file.**
