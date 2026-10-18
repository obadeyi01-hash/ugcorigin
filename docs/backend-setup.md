# UGCOrigin — backend setup (Supabase + OAuth)

> Everything is coded. These are the one-time clicks only **you** can do (accounts/keys). The marketing site runs fine without any of this — auth just won't work until it's done.

## 1. Create the Supabase project
1. Go to **supabase.com** → New project (free tier). Region: closest to Nigeria (e.g. EU West / London).
2. Save the DB password.
3. Project Settings → **API**. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, keep secret)

## 2. Environment
Copy `.env.local.example` → `.env.local` and fill the three keys above, plus:
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Restart `npm run dev` after editing env.

## 3. Run the database migrations
The schema lives in `supabase/migrations/` (two files: `init_schema`, then `rls_policies`).

**Option A — Supabase Cloud (recommended to start):**
```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```
(or open the SQL Editor in the dashboard and paste the two files **in order**.)

**Option B — Local (needs Docker running):**
```bash
npx supabase start      # boots Postgres + Studio at http://localhost:54323
```
Migrations apply automatically.

## 4. Auth URL configuration (Supabase → Authentication → URL Configuration)
- **Site URL:** `http://localhost:3000` (add your production domain later).
- **Redirect URLs:** add `http://localhost:3000/auth/callback` (and `https://ugcorigin.com/auth/callback` for prod).

## 5. OAuth providers (Authentication → Providers)
The provider callback URL for all three is:
`https://<your-project-ref>.supabase.co/auth/v1/callback`

### Google
1. **console.cloud.google.com** → APIs & Services → Credentials → Create OAuth client ID → **Web application**.
2. Authorized redirect URI = the Supabase callback URL above.
3. Copy **Client ID** + **Client Secret** → Supabase → Providers → **Google** → enable + paste.

### Meta (Instagram/Facebook) — Supabase provider name: "Facebook"
1. **developers.facebook.com** → Create app → add **Facebook Login**.
2. Valid OAuth Redirect URI = the Supabase callback URL.
3. Copy **App ID** + **App Secret** → Supabase → Providers → **Facebook** → enable + paste.
   (Instagram sign-in rides on Facebook Login.)

### X — Supabase provider name: "Twitter"
1. **developer.x.com** → Projects & Apps → create app with **OAuth 2.0** (type: Web App).
2. Callback URI = the Supabase callback URL. Request email permission.
3. Copy **Client ID** + **Client Secret** → Supabase → Providers → **Twitter** → enable + paste.
   ⚠️ X's API now has paid tiers — confirm your access level allows OAuth login; if it's a blocker, we ship Google + Meta + email first and add X later (the button is already wired).

## 6. What's wired in the app
- `src/lib/supabase/` — browser (`client.ts`), server (`server.ts`), service-role admin (`admin.ts`), session `middleware.ts`.
- `src/middleware.ts` — refreshes the session each request (no-op until env is set).
- `/login`, `/signup` — OAuth (Google/Meta/X) + email magic link, with the creator/brand fork on signup.
- `/auth/callback` — exchanges the code for a session.
- `/auth/signout` — POST to sign out.

## 7. Security notes (escrow is the sensitive part)
- **RLS is on for every table.** Money tables (`escrow_transactions`, `ledger_entries`, `payouts`) and `audit_log` have **no user write policies** — only the **service role** (edge functions / webhooks) can write them. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- The `handle_new_user` trigger auto-creates a `profiles` row on signup.
- To make yourself an admin: insert your `auth.users` id into `public.admin_users` (role `super_admin`) via the SQL editor.

## 8. Verification gate (creators go live)
Flow: `/verify` → profile complete + **bank verified (Paystack)** + **identity verified (Smile ID/Dojah)** + agreements accepted → a server action sets `is_live` via the service role. Sensitive columns are locked to the service role by the `*_harden_grants.sql` migration — **apply it** (`npx supabase db push` or paste in SQL Editor).
- **Bank verification (works now once key added):** add `PAYSTACK_SECRET_KEY` (use your TEST key in dev). It calls Paystack's account-resolve endpoint to confirm the account name. No key → the bank step shows "activates once the Paystack key is added."
- **Identity verification:** add Smile ID (primary) or Dojah (backup) keys when you have accounts. Until then the identity step shows "available once our provider is connected," and creators cannot go live (gate stays airtight). The adapter in `src/lib/kyc/` has TODOs to finish against each provider's docs, plus a webhook to flip `identity_verified` via the service role.
- **To test go-live before KYC exists:** in the Supabase SQL editor you can manually set a test creator's `identity_verified = true`.

## Done / next
Done: auth, onboarding, dashboard, verification gate (bank live; identity scaffolded). Next: the public `/@handle` card, directory reads, briefs/offers/gigs, payments/escrow, admin.
