-- ============================================================================
-- The pre-launch wipe deleted auth.users with session_replication_role = replica.
-- That skips foreign-key cascades, so auth.identities (and sessions) for the
-- deleted accounts were left behind. Google sign-in finds that identity, then
-- fails with "User not found" because the user row is gone.
--
-- Drop only rows whose user no longer exists. Live accounts are untouched.
-- ============================================================================

delete from auth.mfa_amr_claims c
using auth.sessions s
where c.session_id = s.id
  and not exists (select 1 from auth.users u where u.id = s.user_id);

delete from auth.mfa_challenges ch
using auth.mfa_factors f
where ch.factor_id = f.id
  and not exists (select 1 from auth.users u where u.id = f.user_id);

delete from auth.refresh_tokens rt
where not exists (
  select 1 from auth.users u where u.id::text = rt.user_id
);

delete from auth.sessions s
where not exists (select 1 from auth.users u where u.id = s.user_id);

delete from auth.mfa_factors f
where not exists (select 1 from auth.users u where u.id = f.user_id);

delete from auth.mfa_recovery_codes c
using auth.mfa_recovery_code_sets r
where c.mfa_recovery_code_set_id = r.id
  and not exists (select 1 from auth.users u where u.id = r.user_id);

delete from auth.mfa_recovery_code_sets r
where not exists (select 1 from auth.users u where u.id = r.user_id);

delete from auth.scim_users s
where not exists (select 1 from auth.users u where u.id = s.user_id);

delete from auth.one_time_tokens t
where not exists (select 1 from auth.users u where u.id = t.user_id);

delete from auth.oauth_consents c
where not exists (select 1 from auth.users u where u.id = c.user_id);

delete from auth.oauth_authorizations a
where a.user_id is not null
  and not exists (select 1 from auth.users u where u.id = a.user_id);

delete from auth.webauthn_credentials w
where not exists (select 1 from auth.users u where u.id = w.user_id);

delete from auth.webauthn_challenges w
where w.user_id is not null
  and not exists (select 1 from auth.users u where u.id = w.user_id);

delete from auth.flow_state f
where f.user_id is not null
  and not exists (select 1 from auth.users u where u.id = f.user_id);

delete from auth.identities i
where not exists (select 1 from auth.users u where u.id = i.user_id);
