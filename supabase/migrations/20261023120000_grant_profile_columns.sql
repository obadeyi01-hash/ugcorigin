-- ============================================================================
-- UGCOrigin, fix: grant the authenticated role write access to the profile
-- columns added after the original harden_grants migration. Without these,
-- onboarding/settings INSERT/UPDATE hit "permission denied for table".
-- Sensitive gate columns (verification_status, tier, is_live, strikes, benched,
-- is_influencer, media_flagged, ai_flagged, earned_reputation) stay service-role
-- only, so this keeps the hardening intent intact.
-- ============================================================================

-- creator_profiles: user-writable columns added since (names, phone, formats,
-- the self-service governance counters).
grant insert (first_name, last_name, middle_name, phone, content_formats)
  on public.creator_profiles to authenticated;
grant update (first_name, last_name, middle_name, phone, content_formats,
              username_changes, avatar_changes, avatar_last_changed_at)
  on public.creator_profiles to authenticated;

-- brand_profiles: contact name, phone, and the onboarding preference columns.
grant insert (contact_first_name, contact_last_name, phone, rc_number,
              goal, ad_platforms, content_types, business_type, contact_role, team_size)
  on public.brand_profiles to authenticated;
grant update (contact_first_name, contact_last_name, phone, rc_number,
              goal, ad_platforms, content_types, business_type, contact_role, team_size)
  on public.brand_profiles to authenticated;
