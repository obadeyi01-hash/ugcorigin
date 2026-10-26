# Dashboard analytics map

What the product actually records today, and where a dashboard should read it.
There is no event pipeline beyond page views. Money, verification, and hiring
live in Postgres and should be queried there, not invented in the tag manager.

## Already in the browser

`src/components/analytics/analytics.tsx` loads nothing until cookie consent.
When an id is set it sends:

| Signal | When | Payload |
|---|---|---|
| GA4 `page_view` | route change, if `NEXT_PUBLIC_GA_ID` | `page_path` |
| GTM `pageview` | route change, if `NEXT_PUBLIC_GTM_ID` | `page_path` |
| Meta Pixel `PageView` | once on load, if `NEXT_PUBLIC_META_PIXEL_ID` | none |
| Clarity | script only, if `NEXT_PUBLIC_CLARITY_ID` | session replay |

Use GTM or GA4, not both, or page views double-count. No custom events
(`sign_up`, `begin_checkout`, `purchase`) are fired.

## Read these tables instead

| Question | Source |
|---|---|
| Signups and returning sessions | `auth.users`, `profiles` |
| Creators live vs hidden vs suspended | `creator_profiles.is_live`, `suspended`, `verification_status` |
| Brands verified | `brand_profiles.verification_status` |
| Offers sent, accepted, expired | `offers.status`, `expires_at` |
| Gigs funded through completed | `gigs.status` |
| Escrow held, released, refunded | `escrow.status`, `escrow.amount_naira` |
| Payouts failed and retried | `payouts.status`, `retries` |
| Campaign pool left | `campaigns.budget_naira`, `spent_naira` |
| Disputes open | `disputes.status` |
| Verify prompts sent | `notifications.type = 'verify_prompt'` |

Admin overview already aggregates the operational counts. A marketing dashboard
should join those rows to the page-view property in GA4 by date, not by user,
because the tags are consent-gated and not tied to an account id.
