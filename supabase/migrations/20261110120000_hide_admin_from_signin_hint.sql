-- Close an admin-enumeration vector in the public sign-in form.
--
-- auth_email_sign_in_hint() is called (via service_role) before the login form
-- sends anything, and it returned {exists:true, ...} for ANY address in
-- auth.users — admins included. Since admin accounts now sign in through the
-- separate /admin-login door (never this form), an admin address appearing here
-- only leaks that it exists. We make a matched admin look exactly like a miss,
-- so the public form can't be used to confirm an admin email.
--
-- Everything else about the function is unchanged. create-or-replace preserves
-- the existing grants; they are re-asserted below for clarity.

create or replace function public.auth_email_sign_in_hint(target text)
returns jsonb
language plpgsql
stable
security definer
set search_path = auth, public
as $$
declare
  uid uuid;
  is_banned boolean;
  sent_at timestamptz;
  providers text[];
begin
  if target is null or length(btrim(target)) = 0 or length(btrim(target)) > 254 then
    return jsonb_build_object('exists', false);
  end if;

  select u.id,
         (u.banned_until is not null and u.banned_until > now()),
         u.recovery_sent_at
    into uid, is_banned, sent_at
  from auth.users u
  where lower(u.email) = lower(btrim(target))
  limit 1;

  if uid is null then
    return jsonb_build_object('exists', false);
  end if;

  -- Admin accounts are invisible to the public sign-in form: answer as a miss.
  if exists (select 1 from public.admin_users a where a.user_id = uid) then
    return jsonb_build_object('exists', false);
  end if;

  select coalesce(array_agg(distinct i.provider), array[]::text[])
    into providers
  from auth.identities i
  where i.user_id = uid;

  return jsonb_build_object(
    'exists', true,
    'banned', coalesce(is_banned, false),
    'providers', to_jsonb(providers),
    'recovery_sent_at', sent_at
  );
end;
$$;

revoke all on function public.auth_email_sign_in_hint(text) from public;
revoke all on function public.auth_email_sign_in_hint(text) from anon;
revoke all on function public.auth_email_sign_in_hint(text) from authenticated;
grant execute on function public.auth_email_sign_in_hint(text) to service_role;
