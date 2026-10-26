-- ============================================================================
-- UGCOrigin, close PII exposure on world-readable profile rows.
--
-- CONTEXT / THE LEAK THIS FIXES
-- Supabase grants anon + authenticated SELECT on every column of public tables
-- by default (nothing in this project ever revoked it — the public directory
-- relies on it). Row access is then gated by RLS:
--   * creator_profiles: `creator_select` lets anon read any row with is_live=true
--   * brand_profiles:   `brand_select` is USING (true) — anon reads every row
-- Since the column grant is table-wide, these policies exposed sensitive columns
-- that were added after the original hardening pass:
--   * creator_profiles.phone           (every live creator's number → anon)
--   * brand_profiles.phone             (every brand's number → anon)
--   * brand_profiles.rc_number         (every brand's CAC/business reg → anon)
--   * brand_profiles.verification_note (internal reviewer note → anon)
-- An attacker with the public anon key (shipped in the browser bundle) could
-- dump all of these via PostgREST, e.g.
--   GET /rest/v1/creator_profiles?select=phone&is_live=eq.true
--   GET /rest/v1/brand_profiles?select=phone,rc_number
--
-- THE FIX
-- Column-level privileges are the only in-table mechanism that restricts SELECT.
-- Revoke SELECT on these columns from anon AND authenticated (column grants are
-- role-wide, so "owner-only" / "gig-counterparty-only" cannot be expressed here).
-- The few legitimate readers — the owner's own Settings/Dashboard, the admin
-- verification queue, and the funded gig workspace (where the two parties are
-- meant to see each other's phone) — now read these columns through the
-- service-role client, which bypasses RLS and column grants and enforces the
-- relationship in server code. Non-sensitive columns (name, bio, niches, rate,
-- tier, company_name, website, logo, verification_status) stay readable, so the
-- public directory and profile cards are unaffected.
-- ============================================================================

-- creator_profiles: the phone number is the only sensitive, non-public column.
revoke select (phone) on public.creator_profiles from anon, authenticated;

-- brand_profiles: phone + business-registration number + internal review note.
revoke select (phone, rc_number, verification_note) on public.brand_profiles from anon, authenticated;

-- service_role keeps full SELECT (it is never granted/revoked here), so all
-- server-side admin reads continue to work.

-- ============================================================================
-- admin_users: close an admin privilege-escalation hole.
--
-- THE HOLE: the admin_users policy is `for all to authenticated using
-- (is_admin())`, and is_admin() only checks that the caller EXISTS in
-- admin_users — it ignores the role. Combined with Supabase's default
-- INSERT/UPDATE/DELETE grant, ANY admin (even a read-only `analyst` or
-- `support`) could write admin_users directly through PostgREST, bypassing the
-- app's guardWrite("roles") checks, e.g.
--   PATCH /rest/v1/admin_users?user_id=eq.<self>   {"role":"super_admin"}
-- i.e. self-promote to super_admin. The app itself never writes admin_users
-- from the authenticated client — adminAddAdmin / adminSetRole /
-- adminRemoveAdmin all use the service-role client — so no feature needs this.
--
-- THE FIX: replace the all-privilege policy with a SELECT-only policy (the
-- authenticated client still reads its own admin row for getAdminContext / the
-- roles page) and revoke every write privilege from anon + authenticated. Role
-- management stays with the service role, gated by guardWrite("roles").
-- ============================================================================
drop policy if exists admin_all on public.admin_users;

create policy admin_select on public.admin_users for select to authenticated
  using (public.is_admin());

revoke insert, update, delete on public.admin_users from anon, authenticated;
