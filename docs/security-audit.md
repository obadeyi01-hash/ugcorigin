# UGCOrigin — Comprehensive Security Audit

**Date:** 2026-10-24
**Scope:** Whole codebase — every server action, route handler, page data-fetch, RLS policy/grant, the money loop, file uploads, injection/XSS/redirect surfaces, secrets, enumeration/rate-limiting, and brand/creator/admin role separation. Focus on the newly-merged onboarding/verification, admin broadcast, and admin finance code.
**Branch:** `claude/silly-spence-d6da68` (off `main` @ `d4b55b8`)
**Method:** Read of all 21 `actions.ts` files, both API route handlers, all 51 SQL migrations (RLS + grants), the Supabase client factories, the Paystack/Cloudinary/notify/redact libraries, and every data-fetch that touches a sensitive column. Confirmed how PostgREST column grants interact with each RLS `SELECT` policy.

---

## Executive summary

The platform is, overall, **well-secured**. The money loop is genuinely hardened (webhook re-verification, compare-and-swap release, idempotent payouts, server-derived amounts), secrets are confined to `server-only` modules, private media is served only through signed URLs to authorized participants, the in-chat markdown renderer is XSS-safe, and almost every server action does an explicit ownership/role check before writing.

The audit nonetheless found **one Critical and two High** issues, all in the **Row-Level-Security / Postgres-grant layer** — the gap between "the app checks permissions" and "the raw PostgREST API, reachable with the public anon key, also enforces them." These are exactly the issues an app-layer review misses, and all three are now fixed in this PR with a migration plus a handful of read-path reroutes. A set of Medium/Low hardening items and non-code recommendations (MFA, dual-control) are documented below.

### Findings at a glance

| # | Severity | Area | Title | Status |
|----|----------|------|-------|--------|
| C1 | **Critical** | Authorization / RLS | Any admin role can self-escalate to `super_admin` via direct PostgREST write to `admin_users` | **Fixed** |
| H1 | **High** | RLS / PII | Every brand's `phone`, `rc_number`, internal `verification_note` readable by anonymous users | **Fixed** |
| H2 | **High** | RLS / PII | Every live creator's `phone` readable by anonymous users | **Fixed** |
| M1 | Medium | File uploads | Signed Cloudinary uploads don't constrain size/type server-side | Recommendation |
| M2 | Medium | Rate-limiting | No rate-limiting / bot protection on auth, verification, uniqueness, messaging | Recommendation |
| L1 | Low | Injection | Search-term sanitization before `.or()` was incomplete | **Fixed (hardened)** |
| L2 | Low | Enumeration | NIN existence leaked by identity-submission error message | Documented |
| L3 | Low | Enumeration | Phone existence leaked by onboarding error message | Documented |
| L4 | Low | Go-live gate | `completeness` is self-writable, so that one sub-gate is self-attestable | Documented |
| L5 | Low | Secrets | Cron secret accepted via `?key=` query string (lands in logs) | Documented |
| L6 | Low | Footgun | `is_admin(min_role)` ignores its argument | Documented |
| R1 | — | Money (non-code) | No dual-control on admin escrow release/refund | Recommendation |
| R2 | — | Admin (non-code) | Admin MFA not enforced | Recommendation |
| R3 | — | Legal | Escrow fund-custody / money-transmission posture | Recommendation |

> **Lane note:** admin MFA (R2) and dual-control on large releases (R1) are owned by the parallel "admin dual-control + MFA" session. They are flagged here for completeness only; this PR does not implement them.

---

## Critical

### C1 — Admin privilege escalation: any admin role → `super_admin` via direct API write

- **Where:** `supabase/migrations/20261017120100_rls_policies.sql:54` (policy `admin_all`), plus `public.is_admin()` at `supabase/migrations/20261017120000_init_schema.sql:80`.
- **Severity:** Critical (privilege escalation → full platform + money control).

**The defect.** `admin_users` is the table that defines who is an admin and with what role (`super_admin | finance | trust_safety | support | growth | analyst`). Its RLS policy is:

```sql
create policy admin_all on public.admin_users for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
```

and `is_admin()` is:

```sql
select exists (select 1 from public.admin_users a where a.user_id = auth.uid());
```

`is_admin()` only checks **membership**, not role. Combined with Supabase's default `INSERT/UPDATE/DELETE` grant to `authenticated`, the RLS lets **any** authenticated admin — including a read-only `analyst` or `support` — write **any** row of `admin_users` directly through the PostgREST REST API, entirely bypassing the application's `guardWrite("roles")` checks.

**Failure scenario.** A `support` admin (lowest trust) takes the public anon key (shipped in the browser bundle) and their own session JWT and sends:

```
PATCH /rest/v1/admin_users?user_id=eq.<their-own-id>
Authorization: Bearer <their-jwt>
apikey: <anon-key>
{ "role": "super_admin" }
```

RLS evaluates `is_admin()` → true (they are an admin) → the write is allowed. They are now `super_admin` and can release escrow, refund, manage roles, and broadcast. The in-app role UI never participated.

**Why the app layer didn't catch it.** The app's role actions (`adminAddAdmin`, `adminSetRole`, `adminRemoveAdmin` in `src/app/admin/actions.ts`) are correctly gated by `guardWrite("roles")` — but they all write through the **service-role** client, and nothing forces an attacker to go through those actions. The RLS/grant layer is the real boundary, and it was open.

**Fix applied** (`supabase/migrations/20261024180000_pii_column_grants.sql`): replace the all-privilege policy with a SELECT-only policy and revoke every write privilege from `anon`/`authenticated`. All admin_users writes already go through the service-role client (verified: the only authenticated reads are `getAdminContext` in `src/lib/admin/rbac.ts:25` and the roles page), so nothing legitimate breaks.

```sql
drop policy if exists admin_all on public.admin_users;
create policy admin_select on public.admin_users for select to authenticated
  using (public.is_admin());
revoke insert, update, delete on public.admin_users from anon, authenticated;
```

Role management now lives solely with the service role, gated by `guardWrite("roles")` and the existing last-super-admin lockout guard (`src/app/admin/actions.ts:384`).

---

## High

### H1 — Brand PII (`phone`, `rc_number`, `verification_note`) exposed to anonymous users

- **Where:** policy `brand_select` — `supabase/migrations/20261017120100_rls_policies.sql:78` (`using (true)`); columns added later in `20261019210000_phone_numbers.sql`, `20261020130000_brand_verification.sql`.
- **Severity:** High (mass PII / business-identity exfiltration by unauthenticated attacker).

**The defect.** `brand_select` allows **anyone** (anon included) to read `brand_profiles`:

```sql
create policy brand_select on public.brand_profiles for select to anon, authenticated using (true);
```

The original columns were benign company info (name, website, logo). But later migrations added **`phone`**, **`rc_number`** (CAC/business-registration number), and **`verification_note`** (internal reviewer text) to the same table. Supabase grants `anon`/`authenticated` `SELECT` on **every column** by default, and nothing in the project revokes it (confirmed: no `revoke select`/`alter default privileges` anywhere, and the public directory relies on the default grant). So those sensitive columns became world-readable.

**Failure scenario.** Using only the public anon key:

```
GET /rest/v1/brand_profiles?select=id,company_name,phone,rc_number,verification_note
```

returns every brand's phone number, CAC number, and the admin's private verification notes — a complete PII/business-registry dump, no login required.

**Fix applied.** Column-level privileges are the only in-table control over `SELECT`. The migration revokes those three columns from both API roles:

```sql
revoke select (phone, rc_number, verification_note) on public.brand_profiles from anon, authenticated;
```

The handful of legitimate readers were rerouted to the service-role client (which bypasses column grants and enforces the relationship in server code):

- `src/app/settings/page.tsx` — owner reads their own brand row → now via `createAdminClient()`, scoped `.eq("id", user.id)`.
- `src/app/dashboard/page.tsx` — owner's `select("*")` → now via admin client, own row.
- `src/app/admin/verification/page.tsx` — pending-brand `rc_number` queue → now via the admin client already in scope.
- `src/app/gigs/[id]/page.tsx` — the brand's phone shown to the creator **after a gig is funded** → now via admin client, gated by role + funded status.

Public company info (`company_name`, `website`, `store_url`, `logo_url`, `verification_status`, `trust_tier`) stays readable, so the directory, offer/gig rendering, and the "Verified brand" badge are unaffected.

### H2 — Creator `phone` exposed to anonymous users for every live creator

- **Where:** policy `creator_select` — `supabase/migrations/20261017120100_rls_policies.sql:58`; `phone` column added in `20261019210000_phone_numbers.sql:8`.
- **Severity:** High (PII of every discoverable creator exposed to anon).

**The defect.** `creator_select` makes a creator's whole row readable once they go live:

```sql
create policy creator_select on public.creator_profiles for select to anon, authenticated
  using (is_live = true or id = auth.uid() or public.is_admin());
```

The earlier identity work correctly moved **NIN + selfie** off this row into the service-role-only `identity_submissions` table precisely because this policy is world-readable (`identity_lifecycle.sql` documents the reasoning). But **`phone`** was left on `creator_profiles`, so it rode the same default column grant and became readable by anon for every live creator.

**Failure scenario.**

```
GET /rest/v1/creator_profiles?select=handle,phone&is_live=eq.true
```

dumps the phone number of every discoverable creator. (Legal names `first_name/last_name` are **intentionally** public — they render on the profile card via `publicName()` in `src/app/[handle]/page.tsx` and `src/app/card/[handle]/route.tsx` — so those are not a leak. Phone is.)

**Interesting side effect.** `src/app/gigs/[id]/page.tsx` documents that the two parties see each other's phone "hidden everywhere else until this point [a funded gig]." That claim was actually **false** before this fix — the phone was readable by anyone via the anon API. The fix makes the claim true.

**Fix applied.**

```sql
revoke select (phone) on public.creator_profiles from anon, authenticated;
```

Legitimate readers rerouted to the service-role client: `src/app/settings/page.tsx` (owner), `src/app/dashboard/page.tsx` (owner `select("*")`), `src/app/verify/actions.ts:147` (owner's phone snapshot into the identity submission), and `src/app/gigs/[id]/page.tsx` (counterparty phone, gated by funded-gig participation).

---

## Medium

### M1 — Signed Cloudinary uploads do not constrain size/type/content server-side

- **Where:** `src/lib/cloudinary-server.ts:40` (`signedUpload`); callers `signSelfieUpload` (`verify/actions.ts`), `signDeliverableUpload` (`gigs/actions.ts`), `signChatUpload` (`messages/actions.ts`).
- **Severity:** Medium.

**Analysis.** The signing is done correctly in the important ways: the API secret never leaves the server, uploads are `type: "authenticated"` (private, signed-URL delivery only), and the `folder` is scoped per-user / per-conversation / per-gig and bound to the signer's identity. What the signature does **not** include is `max_file_size`, `allowed_formats`, or a resource-type restriction, so a client holding a valid signed payload can upload an arbitrarily large file or an unexpected type into *its own* scoped folder. Impact is limited (own folder, private asset, no path traversal — the folder is server-chosen, not client-supplied), but it allows storage/cost abuse and stores unvalidated content.

**Recommendation (not applied — needs a product call on limits):** sign `max_file_size` and an `allowed_formats`/resource-type allowlist in `signedUpload`, or move to a named upload preset with those constraints enforced by Cloudinary, and keep the existing client-side checks in `src/lib/upload-limits.ts` as UX only. Low blast radius, so deferred rather than guessed.

### M2 — No rate-limiting or bot protection on sensitive endpoints

- **Where:** auth flows, `verify/actions.ts` (`verifyBankAction`, `submitIdentityAction`), `onboarding/actions.ts`, `messages/actions.ts` (`sendMessage`), the uniqueness checks.
- **Severity:** Medium.

**Analysis.** There is no application- or edge-level rate limiting. An authenticated attacker can hammer `verifyBankAction` (which calls the Paystack resolve API — cost + abuse), retry NIN/phone submissions, or flood messages. The locked product decisions already call for **Cloudflare Turnstile** and bot protection at the gate; it is not yet wired.

**Recommendation (not applied — infra/provider-gated):** add Turnstile on signup/login and the verification submit, and per-user/IP rate limits (edge middleware or a Supabase edge function + a counter table) on `verifyBankAction`, identity submission, and `sendMessage`.

---

## Low (L1 fixed/hardened; rest documented)

### L1 — Incomplete sanitization of search input before a PostgREST `.or()` — **hardened**

- **Where:** `src/app/creators/page.tsx:117` — `query.or(\`display_name.ilike.%${q}%,handle.ilike.%${q}%,location.ilike.%${q}%\`)`.
- **Severity:** Low (after the pre-existing partial guard).

**Analysis.** `q` is a user-supplied search string interpolated into a PostgREST filter tree, where `,` separates OR-conditions and `()` group them — the classic Supabase filter-injection vector (a boolean oracle over columns the attacker can't `SELECT`, e.g. `phone`, or query breakage). The code **already** stripped `,()%*` from `q` (`creators/page.tsx:64`), which neutralizes the structural separators, so this was not an open hole. It was, however, incomplete: no length cap, and backslash/quote/colon were not stripped.

**Fix applied.** Added `sanitizeSearchTerm()` to `src/lib/utils.ts` (strips `,()*%\:"'` + backticks, collapses whitespace, caps at 60 chars) and used it at `creators/page.tsx:64`. The value is only ever used as a literal substring inside an `ilike` pattern. The `region` filter at `creators/page.tsx:116` and the broadcast `region` at `admin/notifications/actions.ts:75` use `.ilike("col", value)` with the value as a **bound parameter** (not interpolated into a filter string), so they are not injectable and were left as-is.

### L2 — NIN existence enumeration via error message

- **Where:** `src/app/verify/actions.ts:164-166` — returns "That NIN is already linked to another account" on a `23505` unique violation.
- **Severity:** Low. Requires an authenticated account per attempt; NIN space is 10¹¹. Still, it confirms whether a specific NIN is registered.
- **Recommendation:** either keep (clear UX for a legitimate collision) or return a generic "we couldn't verify that NIN — contact support" and surface the real reason only to the owning account. Left as-is pending a UX call; flagged per audit scope item 7.

### L3 — Phone existence enumeration via onboarding error message

- **Where:** `src/app/onboarding/actions.ts:94` — "That phone number is already linked to another creator account."
- **Severity:** Low. Same shape as L2; one profile per account limits abuse. Documented; no change.

### L4 — `completeness` is self-writable, so that go-live sub-gate is self-attestable

- **Where:** `src/app/verify/actions.ts:202` reads `completeness`; `completeness` is in the `authenticated` update grant (`20261023120000_grant_profile_columns.sql:15`).
- **Severity:** Low. A creator can `PATCH` their own `completeness` to 100 and skip the "complete your profile" check. **The meaningful gates are not bypassable** — `identity_verified`, `photo_verified`, `bank_verified`, and `agreements_accepted_at` are all service-role-only columns, and `goLiveAction` requires them. So a creator still cannot go live without a real admin-approved identity + photo + bank. Documented; not a security boundary.

### L5 — Cron secret accepted via `?key=` query string

- **Where:** `src/app/api/cron/prune-deliverables/route.ts:24`.
- **Severity:** Low. The `Authorization: Bearer` path is preferred and present; the `?key=` fallback can leak the secret into proxy/access logs. The endpoint correctly 401s when `CRON_SECRET` is unset. Recommendation: drop the query-string fallback, or document that callers must use the header.

### L6 — `is_admin(min_role)` ignores its argument

- **Where:** `supabase/migrations/20261017120000_init_schema.sql:80`.
- **Severity:** Low (footgun, not currently exploitable). The function takes a `min_role` parameter but never uses it. No RLS policy calls it with an argument (verified across all migrations), so role granularity is enforced only in the app layer (`canAccess`), which is fine today. Risk is future: a policy author could write `is_admin('finance')` expecting enforcement and get a no-op grant-to-all-admins. Recommendation: either implement the role check or drop the parameter so the signature can't mislead.

---

## Non-code recommendations (flagged, not implemented here)

- **R1 — Dual-control on money movement.** `adminReleaseEscrow` / `adminRefundEscrow` (`src/app/admin/actions.ts:220,279`) let a single `finance` admin release or refund **any** amount with no second approval. This matches a known locked decision ("dual-control on large releases") that is not yet built. Owned by the admin dual-control/MFA session.
- **R2 — Admin MFA.** Not enforced. Combined with C1 (now fixed) this was especially dangerous; still worth enforcing via Supabase Auth. Owned by the admin dual-control/MFA session.
- **R3 — Escrow custody / money-transmission.** Unchanged from prior guidance: UGCOrigin settles brand funds into the Dream Intrepid Paystack balance before transferring out, i.e. it holds third-party funds. This is a regulatory/legal structure question, not a code bug — see `docs/PRD.md` and the escrow risk note.

---

## What was verified clean (notable positives)

- **Paystack webhook** (`src/app/api/paystack/webhook/route.ts`): HMAC-SHA512 signature checked with `crypto.timingSafeEqual` (length-safe via try/catch), and **every** charge is re-verified server-side against `transaction/verify` (status + currency `NGN` + amount) before any value is granted — the signed body is never trusted. Per-branch amount floors (offer, campaign, boost, subscription) block underpayment. `transfer.*` events close the payout loop.
- **Escrow release/refund/payout idempotency:** compare-and-swap on gig status (`approveReleaseAction`, `adminReleaseEscrow`), release only `from held`, one-payout-per-gig guard (+ DB partial unique indexes), real Paystack refund on cancel. All amounts are server-derived from DB records (`offer.price_naira`, `boostPrice`, `PRO_PRICE_NAIRA`) — never from client input. Payout recipient/amount come from the creator's own verified record.
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, `CRON_SECRET` appear only in `server-only`/server modules; none reachable in a client bundle. `createAdminClient` is `import "server-only"`.
- **Private media:** deliverables, chat attachments, and selfies upload as Cloudinary *authenticated* assets and are delivered only via signed URLs minted for an already-authorized participant; the resolve/sign actions re-check conversation/gig membership and that the asset folder belongs to that conversation/gig.
- **XSS:** the only `dangerouslySetInnerHTML` is JSON-LD with `<` escaped (`src/components/seo/json-ld.tsx`); admin-authored docs render through `src/components/ui/markdown.tsx`, which builds React nodes (never raw HTML) and restricts link hrefs to `http(s)`/`mailto`/relative.
- **Open redirect:** `src/app/auth/callback/route.ts` only ever redirects to internal `/onboarding` or `/login`; no user-supplied `next`/`redirectTo` is honored.
- **Messaging:** participant-gated send/read, service-role insert with pre-storage contact redaction, and an auto-strike path for repeated pre-contract contact sharing.
- **Role separation & ownership:** every mutating action re-checks auth + ownership/role before writing (creator-only deliverable submit, brand-only approve/fund, participant-only shipping/comments, admin `guardWrite(section)`), and the go-live gate cannot be bypassed to reach `is_live` because the gating columns are service-role-only.
- **Last-super-admin lockout guard** prevents removing/demoting the final `super_admin`.

---

## Files changed in this PR

**Migration**
- `supabase/migrations/20261024180000_pii_column_grants.sql` — C1, H1, H2 (revoke sensitive column SELECT; lock down `admin_users` writes).

**Read-path reroutes to the service-role client (own-row / relationship-gated)**
- `src/app/settings/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/admin/verification/page.tsx`
- `src/app/verify/actions.ts`
- `src/app/gigs/[id]/page.tsx`

**Injection hardening**
- `src/lib/utils.ts` — new `sanitizeSearchTerm()`
- `src/app/creators/page.tsx` — use it for the directory search term

**Verification:** `npx tsc --noEmit` and `npx next build` both pass (see PR).
